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

const grCredentials = {
  key: process.env.GOODREADS_KEY || '',
  secret: process.env.GOODREADS_SECRET || '',
};
const grCallback = process.env.GOODREADS_CALLBACK_URL || 'http://localhost:4000/goodreads/callback';
const goodreadsClient = goodreads(grCredentials);
goodreadsClient.initOAuth(grCallback);
let connectedGoodreadsUserId;

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
    const { data } = await supabase
      .from('group_chat_members')
      .select('id')
      .eq('group_id', roomId)
      .eq('user_id', socket.data.user.id)
      .single();
    if (!data) return socket.emit('error', 'Unauthorized');
    socket.join(roomId);
  });

  socket.on('message', async ({ roomId, content }) => {
    if (!roomId || !content) return;
    const { data, error } = await supabase
      .from('group_messages')
      .insert([{ group_id: roomId, sender_id: socket.data.user.id, content }])
      .select()
      .single();
    if (!error && data) {
      io.to(roomId).emit('new-message', data);
    }
  });
});

app.get('/goodreads/request-token', async (req, res) => {
  try {
    const url = await goodreadsClient.getRequestToken();
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/goodreads/callback', async (req, res) => {
  try {
    await goodreadsClient.getAccessToken();
    const user = await goodreadsClient.getCurrentUserInfo();
    connectedGoodreadsUserId = user.user.id;
    res.send('Goodreads connected. You can close this window.');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/goodreads/bookshelf', async (req, res) => {
  const userId = connectedGoodreadsUserId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated with Goodreads' });
  try {
    const books = await goodreadsClient.getBooksOnUserShelf(String(userId), 'read', { per_page: 200 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/goodreads/export', async (req, res) => {
  const { books } = req.body;
  const userId = connectedGoodreadsUserId;
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
