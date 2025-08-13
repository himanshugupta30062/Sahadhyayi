
-- Create user search functionality and enhance profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_sharing BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create friend requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Create friends table for accepted friendships
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Create private messages table
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create group chat members table
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests
CREATE POLICY "Users can view friend requests involving them" 
  ON friend_requests FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests" 
  ON friend_requests FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friend requests involving them" 
  ON friend_requests FOR UPDATE 
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- RLS Policies for friends
CREATE POLICY "Users can view their friendships" 
  ON friends FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create friendships" 
  ON friends FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can delete their friendships" 
  ON friends FOR DELETE 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for private_messages
CREATE POLICY "Users can view their private messages" 
  ON private_messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send private messages" 
  ON private_messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" 
  ON private_messages FOR UPDATE 
  USING (auth.uid() = receiver_id);

-- RLS Policies for group_chats
CREATE POLICY "Group members can view group chats" 
  ON group_chats FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_id = id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create group chats" 
  ON group_chats FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update group chats" 
  ON group_chats FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for group_chat_members
CREATE POLICY "Group members can view group membership" 
  ON group_chat_members FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM group_chat_members gcm 
    WHERE gcm.group_id = group_id AND gcm.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can manage membership" 
  ON group_chat_members FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_id = group_chat_members.group_id AND user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for group_messages
CREATE POLICY "Group members can view group messages" 
  ON group_messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Group members can send messages" 
  ON group_messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM group_chat_members 
    WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_addressee ON friend_requests(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON friends(user1_id);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user2_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group ON group_chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(username, '') || ' ' || coalesce(bio, '')));

-- Function to automatically create friendship when request is accepted
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friends (user1_id, user2_id)
    VALUES (
      LEAST(NEW.requester_id, NEW.addressee_id),
      GREATEST(NEW.requester_id, NEW.addressee_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for friend request acceptance
DROP TRIGGER IF EXISTS trigger_friend_request_acceptance ON friend_requests;
CREATE TRIGGER trigger_friend_request_acceptance
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_acceptance();
