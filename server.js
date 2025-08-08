import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import goodreads from 'goodreads-api-node';
import fetch from 'node-fetch';
import { parseLibgenHtml } from './utils/libgenParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json());

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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

const libgenRateLimit = new Map();

function rateLimit(req, res, next) {
  const userId = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60000;
  const limit = 10;
  const entry = libgenRateLimit.get(userId) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count++;
  libgenRateLimit.set(userId, entry);
  if (entry.count > limit) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}

async function loadGoodreadsTokens(req, res, next) {
  const { data, error } = await supabase
    .from('user_goodreads')
    .select('access_token, access_token_secret, goodreads_user_id')
    .eq('id', req.user.id)
    .single();
  if (error || !data) return res.status(401).json({ error: 'Goodreads not linked' });
  req.goodreadsTokens = data;
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
    const oauth = await goodreadsClient.getAccessToken();
    const user = await goodreadsClient.getCurrentUserInfo();
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    if (state) {
      await supabase
        .from('user_goodreads')
        .upsert({
          id: state,
          goodreads_user_id: user.user.id,
          access_token: oauth.oauth_token,
          access_token_secret: oauth.oauth_token_secret,
        });
    }
    res.send('Goodreads connected. You can close this window.');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/goodreads/bookshelf', authenticate, loadGoodreadsTokens, async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  try {
    const client = goodreads({ key: GOODREADS_KEY, secret: GOODREADS_SECRET });
    client.setAccessToken(
      req.goodreadsTokens.access_token,
      req.goodreadsTokens.access_token_secret,
    );
    const books = await client.getBooksOnUserShelf(
      String(req.goodreadsTokens.goodreads_user_id),
      'read',
      { per_page: 200 },
    );
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/goodreads/export', authenticate, loadGoodreadsTokens, async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  const { books } = req.body;
  try {
    const client = goodreads({ key: GOODREADS_KEY, secret: GOODREADS_SECRET });
    client.setAccessToken(
      req.goodreadsTokens.access_token,
      req.goodreadsTokens.access_token_secret,
    );
    for (const book of books || []) {
      if (book.goodreadsId) {
        await client.addBookToShelf(book.goodreadsId, 'read');
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/libgen', authenticate, rateLimit, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (!q) return res.status(400).json({ success: false, error: 'Missing query' });
  try {
    const url = `https://libgen.is/search.php?req=${encodeURIComponent(q)}&res=25&column=title`;
    const response = await fetch(url);
    const html = await response.text();
    const books = parseLibgenHtml(html);
    res.json({ success: true, books });
  } catch (err) {
    console.error('Libgen proxy error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Handle client-side routing by returning the main index.html for other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on ${PORT}`);
});
