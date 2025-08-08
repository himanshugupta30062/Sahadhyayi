import express from 'express';
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

function createSession(res, sessionId) {
  const sid = sessionId || crypto.randomBytes(16).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  sessions.set(sid, { createdAt: Date.now(), csrfToken });
  res.cookie('sessionId', sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
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

function requireSession(req, res, next) {
  if (!validateSessionIntegrity(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  req.userId = req.cookies.sessionId;
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
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
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
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  try {
    const url = await goodreadsClient.getRequestToken();
    const urlObj = new URL(url);
    urlObj.searchParams.set('state', req.user.id);
    res.json({ url: urlObj.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/goodreads/callback', async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/goodreads/bookshelf', requireSession, async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  const userId = connectedGoodreadsUsers.get(req.userId);
  if (!userId) return res.status(401).json({ error: 'Not authenticated with Goodreads' });
  try {
    const books = await goodreadsClient.getBooksOnUserShelf(String(userId), 'read', {
      per_page: 200,
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/session', async (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const csrfToken = createSession(res, user.id);
  res.json({ csrfToken });
});

app.post('/api/logout', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.cookie('sessionId', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  });
  return res.json({ ok: true });
});

app.get('/api/me', requireSession, (req, res) => {
  res.json({ id: req.userId });
});

app.post('/api/stt', requireSession, checkSession, (req, res) => {
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

app.post('/goodreads/export', authenticate, async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  const { books } = req.body;
  const userId = connectedGoodreadsUsers.get(req.user.id);
  if (!userId) return res.status(401).json({ error: 'Not authenticated with Goodreads' });
  try {
    for (const book of books || []) {
      if (book.goodreadsId) {
        await goodreadsClient.addBookToShelf(book.goodreadsId, 'read');
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(Sentry.Handlers.errorHandler());

// Handle client-side routing by returning the main index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on ${PORT}`);
});
