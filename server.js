import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import fetch, { AbortController } from 'node-fetch';
import oauth from 'oauth';
import { parseStringPromise } from 'xml2js';
import { parseLibgenHtml } from './server/libgenParser.js';
import FormData from 'form-data';
import cors from 'cors';
import busboy from 'busboy';
import { validateFileUpload } from './src/utils/security';
import { SECURITY_CONFIG } from './src/utils/securityConfig';
import { sanitizeHTML, sanitizeInput } from './src/utils/validation';

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
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

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

const sessions = new Map();

function jsonError(res, status, message, code, details) {
  return res.status(status).json({ error: message, code, details });
}


function createSession(res) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { createdAt: Date.now(), csrfToken });
  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
  return csrfToken;
}

function validateSessionIntegrity(req) {
  const session = sessions.get(req.cookies?.sessionId);
  if (!session) return false;
  const maxAge = 24 * 60 * 60 * 1000;
  return Date.now() - session.createdAt < maxAge;
}

function getCSRFToken(req) {
  const session = sessions.get(req.cookies?.sessionId);
  return session?.csrfToken;
}

function checkSession(req, res, next) {
  if (!validateSessionIntegrity(req)) return jsonError(res, 401, "Session expired", "SESSION_EXPIRED");
  const token = req.get("x-csrf-token");
  if (!token || token !== getCSRFToken(req)) return jsonError(res, 403, "Invalid CSRF token", "INVALID_CSRF");
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
let grOAuth = null;
if (GOODREADS_KEY && GOODREADS_SECRET) {
  grOAuth = new oauth.OAuth(
    'https://www.goodreads.com/oauth/request_token',
    'https://www.goodreads.com/oauth/access_token',
    GOODREADS_KEY,
    GOODREADS_SECRET,
    '1.0',
    process.env.GOODREADS_CALLBACK_URL || 'http://localhost:4000/goodreads/callback',
    'HMAC-SHA1'
  );
} else {
  console.warn('Goodreads API credentials not provided; Goodreads features are disabled.');
}

async function authenticate(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return jsonError(res, 401, 'Authentication required', 'AUTH_REQUIRED');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return jsonError(res, 401, 'Invalid token', 'INVALID_TOKEN', error);
  req.user = user;
  next();
}

async function loadGoodreadsTokens(req, res, next) {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('user_goodreads')
      .select('access_token, access_token_secret')
      .eq('id', userId)
      .maybeSingle();
    if (error)
      return res
        .status(500)
        .json({ error: 'DB error', code: 'DB_ERROR', details: error });
    if (!data)
      return res
        .status(401)
        .json({
          error: 'Goodreads not linked',
          code: 'GOODREADS_NOT_LINKED',
        });
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

app.get('/goodreads/connect', authenticate, async (req, res, next) => {
  if (!grOAuth) {
    return jsonError(
      res,
      503,
      'Goodreads integration not configured',
      'GOODREADS_NOT_CONFIGURED'
    );
  }
  try {
    grOAuth.getOAuthRequestToken((err, oauthToken, oauthTokenSecret) => {
      if (err)
        return next(
          Object.assign(new Error('GOODREADS_CONNECT_ERROR'), {
            status: 500,
            details: err,
          })
        );
      req.app.locals[`gr_${req.user.id}`] = { oauthTokenSecret };
      const authorizeUrl = `https://www.goodreads.com/oauth/authorize?oauth_token=${oauthToken}&state=${req.user.id}`;
      res.json({ url: authorizeUrl });
    });
  } catch (e) {
    next(
      Object.assign(new Error('GOODREADS_CONNECT_ERROR'), {
        status: 500,
        details: e,
      })
    );
  }
});

app.get('/goodreads/callback', async (req, res, next) => {
  if (!grOAuth) {
    return jsonError(
      res,
      503,
      'Goodreads integration not configured',
      'GOODREADS_NOT_CONFIGURED'
    );
  }
  try {
    const { oauth_token, oauth_verifier, state } = req.query;
    const temp = req.app.locals[`gr_${state}`];
    if (!temp)
      return res
        .status(400)
        .json({ error: 'Missing temp token', code: 'OAUTH_STATE_MISSING' });
    grOAuth.getOAuthAccessToken(
      oauth_token,
      temp.oauthTokenSecret,
      oauth_verifier,
      async (err, accessToken, accessTokenSecret) => {
        if (err)
          return next(
            Object.assign(new Error('GOODREADS_CALLBACK_ERROR'), {
              status: 500,
              details: err,
            })
          );
        const { error } = await supabase.from('user_goodreads').upsert({
          id: state,
          access_token: accessToken,
          access_token_secret: accessTokenSecret,
        });
        if (error)
          return res
            .status(500)
            .json({ error: 'Persist failed', code: 'DB_ERROR', details: error });
        delete req.app.locals[`gr_${state}`];
        return res.send('Goodreads connected. You can close this window.');
      }
    );
  } catch (e) {
    next(
      Object.assign(new Error('GOODREADS_CALLBACK_ERROR'), {
        status: 500,
        details: e,
      })
    );
  }
});

app.get(
  '/goodreads/bookshelf',
  authenticate,
  loadGoodreadsTokens,
  async (req, res, next) => {
    if (!grOAuth) {
      return jsonError(
        res,
        503,
        'Goodreads integration not configured',
        'GOODREADS_NOT_CONFIGURED'
      );
    }
    try {
      const { access_token, access_token_secret } = req.goodreadsTokens;
      const userXml = await new Promise((resolve, reject) => {
        grOAuth.get(
          'https://www.goodreads.com/api/auth_user',
          access_token,
          access_token_secret,
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });
      const user = await parseStringPromise(userXml);
      const userId = user?.GoodreadsResponse?.user?.[0]?.$.id;
      const shelfUrl = `https://www.goodreads.com/review/list/${userId}.xml?key=${GOODREADS_KEY}&v=2&shelf=read&per_page=200&format=json`;
      const shelfJson = await new Promise((resolve, reject) => {
        grOAuth.get(
          shelfUrl,
          access_token,
          access_token_secret,
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });
      const shelf = JSON.parse(shelfJson);
      return res.json({ books: shelf.reviews?.review || [] });
    } catch (e) {
      next(
        Object.assign(new Error('GOODREADS_FETCH_ERROR'), {
          status: 502,
          details: e,
        })
      );
    }
  }
);

app.post('/api/login', (req, res) => {
  const csrfToken = createSession(res);
  res.json({ csrfToken });
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.clearCookie('sessionId');
  res.status(204).send();
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

app.get('/api/libgen', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q)
      return res
        .status(400)
        .json({ error: 'Missing q', code: 'VALIDATION_ERROR' });
    const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!resp.ok)
      return res
        .status(502)
        .json({
          error: 'Libgen gateway error',
          code: 'UPSTREAM_ERROR',
          details: resp.status,
        });
    const html = await resp.text();
    const books = parseLibgenHtml(html).slice(0, 25);
    return res.json({ success: true, books });
  } catch (e) {
    next(
      Object.assign(new Error('LIBGEN_PROXY_ERROR'), {
        status: 500,
        details: e,
      })
    );
  }
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
app.post('/api/data', checkSession, (req, res) => {
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

app.post(
  '/goodreads/export',
  authenticate,
  checkSession,
  loadGoodreadsTokens,
  async (req, res, next) => {
    if (!grOAuth) {
      return jsonError(
        res,
        503,
        'Goodreads integration not configured',
        'GOODREADS_NOT_CONFIGURED'
      );
    }
    try {
      const { books } = req.body;
      const { access_token, access_token_secret } = req.goodreadsTokens;
      for (const book of books || []) {
        if (book.goodreadsId) {
          await new Promise((resolve, reject) => {
            grOAuth.post(
              'https://www.goodreads.com/shelf/add_to_shelf.xml',
              access_token,
              access_token_secret,
              { name: 'read', book_id: book.goodreadsId },
              '',
              (err, _data) => (err ? reject(err) : resolve(_data))
            );
          });
        }
      }
      return res.json({ success: true });
    } catch (e) {
      next(
        Object.assign(new Error('GOODREADS_EXPORT_ERROR'), {
          status: 500,
          details: e,
        })
      );
    }
  }
);

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
