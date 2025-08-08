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
import OAuth from 'oauth';
import express from 'express';
import { parseLibgenHtml } from './server/libgenParser.js';

dotenv.config();

Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();
app.use(Sentry.Handlers.requestHandler());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

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
const GOODREADS_CALLBACK =
  process.env.GOODREADS_CALLBACK_URL || 'http://localhost:4000/goodreads/callback';
const haveGoodreads = GOODREADS_KEY && GOODREADS_SECRET;
if (!haveGoodreads) {
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
      return jsonError(res, 500, 'DB error', 'DB_ERROR', error);
    if (!data)
      return jsonError(res, 401, 'Goodreads not linked', 'GOODREADS_NOT_LINKED');
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

app.get('/goodreads/connect', authenticate, (req, res, next) => {
  if (!haveGoodreads) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const oa = new OAuth.OAuth(
      'https://www.goodreads.com/oauth/request_token',
      'https://www.goodreads.com/oauth/access_token',
      GOODREADS_KEY,
      GOODREADS_SECRET,
      '1.0',
      GOODREADS_CALLBACK,
      'HMAC-SHA1'
    );
    oa.getOAuthRequestToken((error, oauthToken, oauthTokenSecret) => {
      if (error)
        return next(Object.assign(new Error('GOODREADS_CONNECT_ERROR'), {
          status: 500,
          details: error,
        }));
      req.app.locals[`gr_${req.user.id}`] = { oauthTokenSecret };
      const authorizeUrl = `https://www.goodreads.com/oauth/authorize?oauth_token=${oauthToken}`;
      res.redirect(authorizeUrl);
    });
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_CONNECT_ERROR'), { status: 500, details: e }));
  }
});

app.get('/goodreads/callback', authenticate, (req, res, next) => {
  if (!haveGoodreads) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const temp = req.app.locals[`gr_${req.user.id}`];
    if (!temp)
      return jsonError(res, 400, 'Missing temp token', 'OAUTH_STATE_MISSING');
    const oa = new OAuth.OAuth(
      'https://www.goodreads.com/oauth/request_token',
      'https://www.goodreads.com/oauth/access_token',
      GOODREADS_KEY,
      GOODREADS_SECRET,
      '1.0',
      GOODREADS_CALLBACK,
      'HMAC-SHA1'
    );
    oa.getOAuthAccessToken(
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
          id: req.user.id,
          access_token: accessToken,
          access_token_secret: accessTokenSecret,
        });
        if (error)
          return jsonError(res, 500, 'Persist failed', 'DB_ERROR', error);
        delete req.app.locals[`gr_${req.user.id}`];
        return res.send('Goodreads connected. You can close this window.');
      }
    );
  } catch (e) {
    next(Object.assign(new Error('GOODREADS_CALLBACK_ERROR'), { status: 500, details: e }));
  }
});

app.get('/goodreads/bookshelf', authenticate, loadGoodreadsTokens, async (req, res, next) => {
  if (!haveGoodreads) {
    return jsonError(res, 503, 'Goodreads integration not configured', 'GOODREADS_NOT_CONFIGURED');
  }
  try {
    const client = goodreads({
      key: GOODREADS_KEY,
      secret: GOODREADS_SECRET,
      accessToken: req.goodreadsTokens.access_token,
      accessTokenSecret: req.goodreadsTokens.access_token_secret,
    });
    const books = await client.getBooksOnUserShelf('read', { per_page: 200 });
    res.json(books);
  } catch (error) {
    next(
      Object.assign(new Error('GOODREADS_FETCH_ERROR'), {
        status: 502,
        details: error,
      })
    );
  }
});

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
    if (!q) return jsonError(res, 400, 'Missing q', 'VALIDATION_ERROR');
    const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
    const resp = await fetch(url, { timeout: 15000 });
    if (!resp.ok)
      return jsonError(res, 502, 'Libgen gateway error', 'UPSTREAM_ERROR', resp.status);
    const html = await resp.text();
    const books = parseLibgenHtml(html).slice(0, 25);
    return res.json({ success: true, books });
  } catch (e) {
    next(Object.assign(new Error('LIBGEN_PROXY_ERROR'), { status: 500, details: e }));
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

app.post('/goodreads/export', authenticate, checkSession, loadGoodreadsTokens, async (req, res, next) => {
  if (!haveGoodreads) {
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
  } catch (error) {
    next(
      Object.assign(new Error('GOODREADS_EXPORT_ERROR'), {
        status: 502,
        details: error,
      })
    );
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
