import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import goodreads from 'goodreads-api-node';

dotenv.config();

const app = express();
app.use(express.json());
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

app.get('/goodreads/bookshelf', authenticate, async (req, res) => {
  if (!goodreadsClient) {
    return res.status(503).json({ error: 'Goodreads integration not configured' });
  }
  const userId = connectedGoodreadsUsers.get(req.user.id);
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

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on ${PORT}`);
});
