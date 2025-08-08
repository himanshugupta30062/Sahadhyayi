import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OAuth from 'oauth';
import { parseStringPromise } from 'xml2js';
import { parseLibgenHtml } from './server/libgenParser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as Sentry from '@sentry/node';
import fetch from 'node-fetch';
import FormData from 'form-data';
import cors from 'cors';
import busboy from 'busboy';

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
  if (!validateSessionIntegrity(req)) return res.status(401).send('Session expired');
  const token = req.get('x-csrf-token');
  if (!token || token !== getCSRFToken(req)) return res.status(403).send('Invalid CSRF token');
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

if (!GOODREADS_KEY || !GOODREADS_SECRET) {
  console.warn('Goodreads API credentials not provided; Goodreads features are disabled.');
}

async function authenticate(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  req.userId = user.id;
  next();
}

async function loadGoodreadsTokens(req, res, next) {
  try {
    const userId = req.userId;
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
        .json({ error: 'Goodreads not linked', code: 'GOODREADS_NOT_LINKED' });
    req.goodreadsTokens = data;
    next();
  } catch (e) {
    next(
      Object.assign(new Error('GOODREADS_TOKENS_ERROR'), {
        status: 500,
        details: e,
      })
    );
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
  if (!GOODREADS_KEY || !GOODREADS_SECRET) {
    return res
      .status(503)
      .json({ error: 'Goodreads integration not configured' });
  }
  try {
    const callbackUrl =
      process.env.GOODREADS_CALLBACK_URL ||
      'http://localhost:4000/goodreads/callback';
    const oauthClient = new OAuth.OAuth(
      'https://www.goodreads.com/oauth/request_token',
      'https://www.goodreads.com/oauth/access_token',
      GOODREADS_KEY,
      GOODREADS_SECRET,
      '1.0A',
      callbackUrl,
      'HMAC-SHA1'
    );
    oauthClient.getOAuthRequestToken((err, token, tokenSecret) => {
      if (err)
        return next(
          Object.assign(new Error('GOODREADS_CONNECT_ERROR'), {
            status: 500,
            details: err,
          })
        );
      req.app.locals[`gr_${req.userId}`] = { oauthTokenSecret: tokenSecret };
      const authorizeUrl = `https://www.goodreads.com/oauth/authorize?oauth_token=${token}`;
      res.redirect(authorizeUrl);
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

app.get('/goodreads/callback', authenticate, async (req, res, next) => {
  if (!GOODREADS_KEY || !GOODREADS_SECRET) {
    return res
      .status(503)
      .json({ error: 'Goodreads integration not configured' });
  }
  try {
    const { oauth_token, oauth_verifier } = req.query;
    const temp = req.app.locals[`gr_${req.userId}`];
    if (!temp)
      return res
        .status(400)
        .json({ error: 'Missing temp token', code: 'OAUTH_STATE_MISSING' });
    const callbackUrl =
      process.env.GOODREADS_CALLBACK_URL ||
      'http://localhost:4000/goodreads/callback';
    const oauthClient = new OAuth.OAuth(
      'https://www.goodreads.com/oauth/request_token',
      'https://www.goodreads.com/oauth/access_token',
      GOODREADS_KEY,
      GOODREADS_SECRET,
      '1.0A',
      callbackUrl,
      'HMAC-SHA1'
    );
    oauthClient.getOAuthAccessToken(
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
          id: req.userId,
          access_token: accessToken,
          access_token_secret: accessTokenSecret,
        });
        if (error)
          return res
            .status(500)
            .json({ error: 'Persist failed', code: 'DB_ERROR', details: error });
        delete req.app.locals[`gr_${req.userId}`];
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
    if (!GOODREADS_KEY || !GOODREADS_SECRET) {
      return res
        .status(503)
        .json({ error: 'Goodreads integration not configured' });
    }
    try {
      const oauthClient = new OAuth.OAuth(
        'https://www.goodreads.com/oauth/request_token',
        'https://www.goodreads.com/oauth/access_token',
        GOODREADS_KEY,
        GOODREADS_SECRET,
        '1.0A',
        null,
        'HMAC-SHA1'
      );
      const tokens = req.goodreadsTokens;
      const userInfoXml = await new Promise((resolve, reject) => {
        oauthClient.get(
          'https://www.goodreads.com/api/auth_user',
          tokens.access_token,
          tokens.access_token_secret,
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });
      const userInfo = await parseStringPromise(userInfoXml);
      const userId = userInfo?.GoodreadsResponse?.user?.[0]?.$.id;
      const shelfUrl = `https://www.goodreads.com/review/list/${userId}.xml?per_page=200&shelf=read`;
      const shelfXml = await new Promise((resolve, reject) => {
        oauthClient.get(
          shelfUrl,
          tokens.access_token,
          tokens.access_token_secret,
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });
      const shelf = await parseStringPromise(shelfXml);
      return res.json({ books: shelf?.GoodreadsResponse?.reviews?.[0]?.review || [] });
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

app.get('/api/libgen', authenticate, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q)
      return res.status(400).json({ error: 'Missing q', code: 'VALIDATION_ERROR' });
    const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
    const resp = await fetch(url, { timeout: 15000 });
    if (!resp.ok)
      return res.status(502).json({
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
      if (!resp.ok) return res.status(resp.status).json({ error: data?.error || 'STT failed' });
      return res.json(data);
    } catch (err) {
      console.error('STT proxy error:', err);
      return res.status(500).json({ error: 'Server STT proxy error' });
    }
  });

  req.pipe(bb);
});

app.post('/api/data', checkSession, (req, res) => {
  res.json({ secure: true });
});

app.post(
  '/goodreads/export',
  authenticate,
  checkSession,
  loadGoodreadsTokens,
  async (req, res, next) => {
    if (!GOODREADS_KEY || !GOODREADS_SECRET) {
      return res
        .status(503)
        .json({ error: 'Goodreads integration not configured' });
    }
    try {
      const { books } = req.body;
      const oauthClient = new OAuth.OAuth(
        'https://www.goodreads.com/oauth/request_token',
        'https://www.goodreads.com/oauth/access_token',
        GOODREADS_KEY,
        GOODREADS_SECRET,
        '1.0A',
        null,
        'HMAC-SHA1'
      );
      const tokens = req.goodreadsTokens;
      for (const book of books || []) {
        if (book.goodreadsId) {
          await new Promise((resolve, reject) => {
            oauthClient.post(
              'https://www.goodreads.com/shelf/add_to_shelf.xml',
              tokens.access_token,
              tokens.access_token_secret,
              { name: 'read', book_id: book.goodreadsId },
              null,
              (err) => (err ? reject(err) : resolve())
            );
          });
        }
      }
      res.json({ success: true });
    } catch (e) {
      next(
        Object.assign(new Error('GOODREADS_EXPORT_ERROR'), {
          status: 502,
          details: e,
        })
      );
    }
  }
);

app.use(Sentry.Handlers.errorHandler());

// Handle client-side routing by returning the main index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on ${PORT}`);
});
