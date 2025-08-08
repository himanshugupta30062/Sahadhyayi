import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import goodreads from 'goodreads-api-node';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import fetch from 'node-fetch';
import FormData from 'form-data';
import cors from 'cors';
import busboy from 'busboy';
import { validateFileUpload } from './src/utils/security';
import { SECURITY_CONFIG } from './src/utils/securityConfig';
import { sanitizeHTML, sanitizeInput } from './src/utils/validation';
import { parseLibgenHtml } from './server/libgenParser.js';

dotenv.config();

Sentry.init({ dsn: process.env.SENTRY_DSN });

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://maps.googleapis.com",
  "style-src 'self' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss:",
  "frame-src 'self'",
  "report-uri /csp-report"
].join('; ');

const app = express();
app.use(Sentry.Handlers.requestHandler());
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [/\.sahadhyayi\.com$/, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// CSRF: compare X-CSRF-Token header with csrfToken cookie
function csrfValidator(req, res, next) {
  const header = req.get('X-CSRF-Token');
  const cookie = req.cookies?.csrfToken;
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!needsCsrf) return next();
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}

app.use(csrfValidator);

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self)');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    Sentry.captureMessage('HTTP Request', {
      level: 'info',
      extra: { path: req.path, duration, status: res.statusCode },
    });
  });
  next();
});

function jsonError(res, status, message, code, details) {
  return res.status(status).json({ error: message, code, details });
}

// Helper: set a hardened cookie
function setSessionCookie(res, userId) {
  res.cookie('sessionId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// Require a valid session cookie
function requireSession(req, res, next) {
  const userId = req.cookies?.sessionId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  req.sessionUserId = userId;
  req.userId = userId;
  next();
}

app.post(
  '/csp-report',
  express.json({ type: ['application/csp-report', 'application/json'] }),
  (req, res) => {
    try {
      const report = req.body['csp-report'] || req.body;
      console.warn('[CSP-REPORT]', JSON.stringify(report));
    } catch {}
    res.status(204).end();
  }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the built frontend
app.use(express.static(path.join(__dirname, 'dist')));
const httpServer = createServer(app);

const io = new Server(httpServer, {
  path: '/discussions',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const GOODREADS_KEY = process.env.GOODREADS_KEY;
const GOODREADS_SECRET = process.env.GOODREADS_SECRET;
let goodreadsClient = null;
if (GOODREADS_KEY && GOODREADS_SECRET) {
  const grCredentials = { key: GOODREADS_KEY, secret: GOODREADS_SECRET };
  const grCallback =
    process.env.GOODREADS_CALLBACK_URL || 'http://localhost:4000/goodreads/callback';
  goodreadsClient = goodreads(grCredentials);
  goodreadsClient.initOAuth(grCallback);
} else {
  console.warn('Goodreads API credentials not provided; Goodreads features are disabled.');
}

async function loadGoodreadsTokens(req, res, next) {
  try {
    const userId = req.userId;
    const { data, error } = await supabase
      .from('user_goodreads')
      .select('access_token, access_token_secret')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      return res.status(500).json({ error: 'DB error', code: 'DB_ERROR', details: error });
    }
    if (!data) {
      return res.status(401).json({ error: 'Goodreads not linked', code: 'GOODREADS_NOT_LINKED' });
    }
    req.goodreadsTokens = data;
    next();
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_TOKENS_ERROR'), { status: 500, details: e }));
  }
}

io.use(async (socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers['authorization']?.replace('Bearer ', '');
  if (!token) return next(new Error('Authentication required'));
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return next(new Error('Invalid token'));
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  socket.on('join', async (roomId) => {
    if (typeof roomId !== 'string') return;
    try {
      const { data, error } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('group_id', roomId)
        .eq('user_id', socket.data.user.id)
        .single();
      if (error || !data) {
        console.error('Join error:', error);
        return socket.emit('error', 'Unauthorized');
      }
      socket.join(roomId);
    } catch (err) {
      console.error('Join exception:', err);
      socket.emit('error', 'Server error');
    }
  });

  socket.on('message', async ({ roomId, content }) => {
    if (!roomId || !content) return;
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert([{ group_id: roomId, sender_id: socket.data.user.id, content }])
        .select()
        .single();
      if (error || !data) {
        console.error('Message error:', error);
        return socket.emit('error', 'Failed to send message');
      }
      io.to(roomId).emit('new-message', data);
    } catch (err) {
      console.error('Message exception:', err);
      socket.emit('error', 'Server error');
    }
  });
});

app.get('/goodreads/connect', requireSession, async (req, res, next) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const callbackUrl = process.env.GOODREADS_CALLBACK_URL;
    const { oauthToken, oauthTokenSecret, authorizeUrl } = await goodreadsClient.getRequestToken(
      callbackUrl
    );
    req.app.locals[`gr_${req.userId}`] = { oauthTokenSecret };
    return res.redirect(authorizeUrl);
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_CONNECT_ERROR'), { status: 500, details: e }));
  }
});

app.get('/goodreads/callback', requireSession, async (req, res, next) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const temp = req.app.locals[`gr_${req.userId}`];
    if (!temp) {
      return res
        .status(400)
        .json({ error: 'Missing temp token', code: 'OAUTH_STATE_MISSING' });
    }

    const { accessToken, accessTokenSecret } = await goodreadsClient.getAccessToken({
      oauthToken: oauth_token,
      oauthVerifier: oauth_verifier,
      oauthTokenSecret: temp.oauthTokenSecret,
    });

    const { error } = await supabase.from('user_goodreads').upsert({
      id: req.userId,
      access_token: accessToken,
      access_token_secret: accessTokenSecret,
    });
    if (error) {
      return res.status(500).json({ error: 'Persist failed', code: 'DB_ERROR', details: error });
    }

    delete req.app.locals[`gr_${req.userId}`];
    return res.send('Goodreads connected. You can close this window.');
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_CALLBACK_ERROR'), { status: 500, details: e }));
  }
});

app.get('/goodreads/bookshelf', requireSession, loadGoodreadsTokens, async (req, res, next) => {
  try {
    const client = goodreads({
      key: GOODREADS_KEY,
      secret: GOODREADS_SECRET,
      accessToken: req.goodreadsTokens.access_token,
      accessTokenSecret: req.goodreadsTokens.access_token_secret,
    });
    const user = await client.getCurrentUserInfo();
    const userId = user?.user?.id || user?.id;
    const books = await client.getBooksOnUserShelf(String(userId), 'read', {
      per_page: 200,
    });
    return res.json({ books });
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_FETCH_ERROR'), { status: 502, details: e }));
  }
});

app.get('/api/libgen', requireSession, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      return res.status(400).json({ error: 'Missing q', code: 'VALIDATION_ERROR' });
    }
    const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
    const resp = await fetch(url, { timeout: 15000 });
    if (!resp.ok) {
      return res
        .status(502)
        .json({ error: 'Libgen gateway error', code: 'UPSTREAM_ERROR', details: resp.status });
    }
    const html = await resp.text();
    const books = parseLibgenHtml(html).slice(0, 25);
    return res.json({ success: true, books });
  } catch (e) {
    next(Object.assign(new Error('LIBGEN_PROXY_ERROR'), { status: 500, details: e }));
  }
});

  app.post('/api/stt', (req, res) => {
  const bb = busboy({ headers: req.headers });
  let audioBuffer = Buffer.alloc(0);
  let filename = 'recording.webm';

  bb.on('file', (_name, file, info) => {
    if (info?.filename) filename = info.filename;
    file.on('data', (data) => {
      audioBuffer = Buffer.concat([audioBuffer, data]);
    });
  });

  bb.on('finish', async () => {
    try {
      const form = new FormData();
      form.append('audio', audioBuffer, { filename, contentType: 'audio/webm' });

      const supabaseUrl = process.env.SUPABASE_URL;
      const edgeKey = process.env.SUPABASE_EDGE_STT_KEY || process.env.SUPABASE_ANON_KEY;
      if (!supabaseUrl || !edgeKey) throw new Error('Missing SUPABASE_URL or function key');

      const resp = await fetch(`${supabaseUrl}/functions/v1/speech-to-text`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${edgeKey}` },
        body: form,
      });

      const data = await resp.json();
      if (!resp.ok) return jsonError(res, resp.status, data?.error || 'STT failed', 'STT_FAILED', data);
      return res.json(data);
    } catch (err) {
      console.error('STT proxy error:', err);
      return jsonError(res, 500, 'Server STT proxy error', 'STT_PROXY_ERROR', err);
    }
  });

  req.pipe(bb);
});

app.get('/api/books', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    let query = supabase.from('books_library').select('*');
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) return next(Object.assign(new Error('DB_ERROR'), { status: 500, code: 'DB_ERROR', details: error }));
    return res.json(data);
  } catch (e) {
    next(e);
  }
});

app.post('/api/session', async (req, res) => {
  try {
    const authHeader = req.get('Authorization') || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearer || req.body?.access_token;
    if (!token) return res.status(400).json({ error: 'Missing access token' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    setSessionCookie(res, user.id);
    return res.json({ ok: true, user: { id: user.id, email: user.email }, csrfToken });
  } catch (e) {
    console.error('Session error', e);
    return res.status(500).json({ error: 'Session initialization failed' });
  }
});

app.post('/api/logout', requireSession, (req, res) => {
  res.cookie('sessionId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  });
  res.cookie('csrfToken', '', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  });
  res.json({ ok: true });
});
app.post('/api/data', requireSession, (req, res) => {
  res.json({ secure: true });
});

app.post('/api/upload', checkSession, async (req, res, next) => {
  try {
    const file = req.file || req.files?.file;
    if (!file) return res.status(400).json({ error: 'No file', code: 'NO_FILE' });

    const { valid, error } = validateFileUpload(
      file,
      SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
      SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE
    );
    if (!valid) return res.status(400).json({ error, code: 'UPLOAD_VALIDATION' });

    return res.json({ ok: true });
  } catch (e) {
    next(Object.assign(new Error('UPLOAD_ERROR'), { status: 500, details: e }));
  }
});

app.post('/api/comments', checkSession, async (req, res, next) => {
  try {
    const body = (req.body?.body ?? '').toString();
    const title = sanitizeInput(req.body?.title ?? '');
    const safeHtml = sanitizeHTML(body);

    if (!title || !safeHtml) {
      return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
    }

    return res.json({ ok: true });
  } catch (e) {
    next(Object.assign(new Error('COMMENT_ERROR'), { status: 500, details: e }));
  }
});

app.post('/goodreads/export', requireSession, loadGoodreadsTokens, async (req, res, next) => {
  if (!GOODREADS_KEY || !GOODREADS_SECRET) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  const { books } = req.body;
  try {
    const client = goodreads({
      key: GOODREADS_KEY,
      secret: GOODREADS_SECRET,
      accessToken: req.goodreadsTokens.access_token,
      accessTokenSecret: req.goodreadsTokens.access_token_secret,
    });
    for (const book of books || []) {
      if (book.goodreadsId) {
        await client.addBookToShelf(book.goodreadsId, 'read');
      }
    }
    res.json({ success: true });
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_EXPORT_ERROR'), { status: 500, details: e }));
  }
});

app.use(Sentry.Handlers.errorHandler());

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR');
  const msg = err.message || 'Unexpected error';
  console.error('API error:', { path: req.path, status, code, msg, details: err.details });
  return jsonError(res, status, msg, code, err.details);
});

// Handle client-side routing by returning the main index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on ${PORT}`);
});
