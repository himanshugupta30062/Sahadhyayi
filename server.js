import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Require a valid session and matching CSRF token
function requireSession(req, res, next) {
  const userId = req.cookies?.sessionId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  const csrfCookie = req.cookies?.csrfToken;
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  req.sessionUserId = userId;
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

const connectedGoodreadsUsers = new Map();

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

app.get('/goodreads/request-token', authenticate, async (req, res) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const url = await goodreadsClient.getRequestToken();
    const urlObj = new URL(url);
    urlObj.searchParams.set('state', req.user.id);
    res.json({ url: urlObj.toString() });
  } catch (error) {
    return jsonError(res, 500, error.message, 'GOODREADS_ERROR', error);
  }
});

app.get('/goodreads/callback', async (req, res) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    await goodreadsClient.getAccessToken();
    const user = await goodreadsClient.getCurrentUserInfo();
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    if (state) {
      connectedGoodreadsUsers.set(state, user.user.id);
    }
    res.send('Goodreads connected. You can close this window.');
  } catch (error) {
    return jsonError(res, 500, error.message, 'GOODREADS_ERROR', error);
  }
});

app.get('/goodreads/bookshelf', authenticate, async (req, res) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  const userId = connectedGoodreadsUsers.get(req.user.id);
  if (!userId) return jsonError(res, 401, 'Not authenticated with Goodreads', 'GOODREADS_NOT_AUTH');
  try {
    const books = await goodreadsClient.getBooksOnUserShelf(String(userId), 'read', {
      per_page: 200,
    });
    res.json(books);
    } catch (error) {
      return jsonError(res, 500, error.message, 'GOODREADS_ERROR', error);
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

app.post('/api/upload', requireSession, async (req, res, next) => {
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

app.post('/api/comments', requireSession, async (req, res, next) => {
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

app.post('/goodreads/export', authenticate, async (req, res) => {
  if (!goodreadsClient) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  const { books } = req.body;
  const userId = connectedGoodreadsUsers.get(req.user.id);
  if (!userId) return jsonError(res, 401, 'Not authenticated with Goodreads', 'GOODREADS_NOT_AUTH');
  try {
    for (const book of books || []) {
      if (book.goodreadsId) {
        await goodreadsClient.addBookToShelf(book.goodreadsId, 'read');
      }
    }
    res.json({ success: true });
  } catch (error) {
    return jsonError(res, 500, error.message, 'GOODREADS_ERROR', error);
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
