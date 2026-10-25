import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import oauth from 'oauth';
import xml2js from 'xml2js';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import busboy from 'busboy';
import { validateFileUpload } from './server-utils/security.js';
import { SECURITY_CONFIG } from './server-utils/securityConfig.js';
import { sanitizeHTML, sanitizeInput } from './server-utils/validation.js';
import { parseLibgenHtml } from './server/libgenParser.js';

dotenv.config();

Sentry.init({ dsn: process.env.SENTRY_DSN });

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' blob: https://maps.googleapis.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss:",
  "frame-src 'self'",
  "report-uri /csp-report",
];

const CSP = CSP_DIRECTIVES.join('; ');

const ALLOWED_ORIGINS = [
  /\.sahadhyayi\.com$/,
  'https://sahadhyayi.com',
  'https://www.sahadhyayi.com',
  'https://sahadhyayi.netlify.app',
  /\.sahadhyayi\.app$/,
  'https://sahadhyayi.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev-local-session-secret');
if (process.env.NODE_ENV === 'production' && !SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be configured in production');
}
const app = express();

// Lightweight deployment probe for backend hosting platforms.
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'sahadhyayi-api' });
});
app.use(cookieParser(SESSION_SECRET));
app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
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

// Helper: set a hardened, signed cookie
function setSessionCookie(res, userId) {
  res.cookie('sessionId', userId, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// Require a valid session cookie (checks signed cookie first, falls back to legacy for smooth transitions)
function requireSession(req, res, next) {
  const userId = req.signedCookies?.sessionId || req.cookies?.sessionId;
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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
        allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by Socket.io CORS policy'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL configuration');
}

if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY must be provided in production and cannot fall back to anon key.');
}

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase service key configuration');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const GOODREADS_KEY = process.env.GOODREADS_KEY;
const GOODREADS_SECRET = process.env.GOODREADS_SECRET;
const GOODREADS_CALLBACK_URL =
  process.env.GOODREADS_CALLBACK_URL || 'http://localhost:4000/goodreads/callback';
const GOODREADS_REQUEST_TOKEN_URL = 'https://www.goodreads.com/oauth/request_token';
const GOODREADS_ACCESS_TOKEN_URL = 'https://www.goodreads.com/oauth/access_token';
const GOODREADS_AUTHORIZE_URL = 'https://www.goodreads.com/oauth/authorize';
const GOODREADS_API_BASE_URL = 'https://www.goodreads.com';
let goodreadsOAuth = null;

if (GOODREADS_KEY && GOODREADS_SECRET) {
  goodreadsOAuth = new oauth.OAuth(
    GOODREADS_REQUEST_TOKEN_URL,
    GOODREADS_ACCESS_TOKEN_URL,
    GOODREADS_KEY,
    GOODREADS_SECRET,
    '1.0',
    GOODREADS_CALLBACK_URL,
    'HMAC-SHA1'
  );
} else {
  console.warn('Goodreads API credentials not provided; Goodreads features are disabled.');
}

function getGoodreadsRequestToken() {
  return new Promise((resolve, reject) => {
    goodreadsOAuth.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
      if (error) return reject(error);
      resolve({ oauthToken, oauthTokenSecret });
    });
  });
}

function getGoodreadsAccessToken(oauthToken, oauthTokenSecret, oauthVerifier) {
  return new Promise((resolve, reject) => {
    goodreadsOAuth.getOAuthAccessToken(
      oauthToken,
      oauthTokenSecret,
      oauthVerifier,
      (error, accessToken, accessTokenSecret) => {
        if (error) return reject(error);
        resolve({ accessToken, accessTokenSecret });
      }
    );
  });
}

function getGoodreadsXml(url, accessToken, accessTokenSecret) {
  return new Promise((resolve, reject) => {
    goodreadsOAuth.get(url, accessToken, accessTokenSecret, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });
}

function postGoodreadsXml(url, accessToken, accessTokenSecret) {
  return new Promise((resolve, reject) => {
    goodreadsOAuth.post(
      url,
      accessToken,
      accessTokenSecret,
      '',
      'application/x-www-form-urlencoded',
      (error, data) => {
        if (error) return reject(error);
        resolve(data);
      }
    );
  });
}

async function parseGoodreadsXml(xml) {
  return xml2js.parseStringPromise(xml, {
    explicitArray: false,
    mergeAttrs: true,
    trim: true,
  });
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
  if (!goodreadsOAuth) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const { oauthToken, oauthTokenSecret } = await getGoodreadsRequestToken();
    req.app.locals[`gr_${req.userId}`] = { oauthToken, oauthTokenSecret };
    const authorizeUrl = new URL(GOODREADS_AUTHORIZE_URL);
    authorizeUrl.searchParams.set('oauth_token', oauthToken);
    return res.redirect(authorizeUrl.toString());
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_CONNECT_ERROR'), { status: 500, details: e }));
  }
});

app.get('/goodreads/callback', requireSession, async (req, res, next) => {
  if (!goodreadsOAuth) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const temp = req.app.locals[`gr_${req.userId}`];
    if (!temp || typeof oauth_token !== 'string' || oauth_token !== temp.oauthToken) {
      return res
        .status(400)
        .json({ error: 'Invalid or missing temporary token', code: 'OAUTH_STATE_MISSING' });
    }
    if (typeof oauth_verifier !== 'string' || !oauth_verifier) {
      return res.status(400).json({ error: 'Missing verifier', code: 'OAUTH_VERIFIER_MISSING' });
    }

    const { accessToken, accessTokenSecret } = await getGoodreadsAccessToken(
      oauth_token,
      temp.oauthTokenSecret,
      oauth_verifier
    );

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
    const { access_token: accessToken, access_token_secret: accessTokenSecret } = req.goodreadsTokens;
    const userXml = await getGoodreadsXml(
      `${GOODREADS_API_BASE_URL}/api/auth_user`,
      accessToken,
      accessTokenSecret
    );
    const userResponse = await parseGoodreadsXml(userXml);
    const userId = userResponse?.GoodreadsResponse?.user?.id;
    if (!userId) {
      return res.status(502).json({ error: 'Goodreads user response was invalid', code: 'GOODREADS_RESPONSE_INVALID' });
    }

    const bookshelfUrl = new URL(`${GOODREADS_API_BASE_URL}/review/list/${encodeURIComponent(userId)}.xml`);
    bookshelfUrl.searchParams.set('v', '2');
    bookshelfUrl.searchParams.set('shelf', 'read');
    bookshelfUrl.searchParams.set('per_page', '200');
    const shelfXml = await getGoodreadsXml(bookshelfUrl.toString(), accessToken, accessTokenSecret);
    const shelfResponse = await parseGoodreadsXml(shelfXml);
    return res.json({ books: shelfResponse?.GoodreadsResponse?.reviews ?? shelfResponse });
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
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
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
      form.append('audio', new Blob([audioBuffer], { type: 'audio/webm' }), filename);

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

app.get('/api/books', requireSession, async (req, res, next) => {
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

    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid token' });

      setSessionCookie(res, user.id);
      return res.json({ ok: true, user: { id: user.id, email: user.email }, csrfToken });
    }

    // Guest / Anonymous CSRF session initialization
    return res.json({ ok: true, guest: true, csrfToken });
  } catch (e) {
    console.error('Session error', e);
    return res.status(500).json({ error: 'Session initialization failed' });
  }
});

const handleLogout = (req, res) => {
  res.clearCookie('sessionId', { path: '/' });
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
};

app.post('/api/logout', handleLogout);
app.delete('/api/session', handleLogout);
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

app.post('/goodreads/export', requireSession, loadGoodreadsTokens, async (req, res, next) => {
  if (!goodreadsOAuth) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  const books = Array.isArray(req.body?.books) ? req.body.books : [];
  if (books.length > 200) {
    return res.status(400).json({ error: 'Too many books', code: 'VALIDATION_ERROR' });
  }
  try {
    const { access_token: accessToken, access_token_secret: accessTokenSecret } = req.goodreadsTokens;
    for (const book of books) {
      const id = book?.goodreadsId;
      if (typeof id !== 'string' && typeof id !== 'number') continue;
      const url = new URL(GOODREADS_API_BASE_URL + '/shelf/add_to_shelf.xml');
      url.searchParams.set('id', String(id));
      url.searchParams.set('name', 'read');
      await postGoodreadsXml(url.toString(), accessToken, accessTokenSecret);
    }
    return res.json({ success: true });
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_EXPORT_ERROR'), { status: 502, details: e }));
  }
});

// Sentry v8+ removed Sentry.Handlers; use the supported Express integration.
Sentry.setupExpressErrorHandler(app);

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
