
-- First, we need to update the foreign key references to point to profiles table
-- Drop existing foreign key constraints and recreate them properly

-- Update friend_requests table
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_requester_id_fkey;
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_addressee_id_fkey;
ALTER TABLE friend_requests ADD CONSTRAINT friend_requests_requester_id_fkey 
  FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE friend_requests ADD CONSTRAINT friend_requests_addressee_id_fkey 
  FOREIGN KEY (addressee_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update friends table
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user1_id_fkey;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_user2_id_fkey;
ALTER TABLE friends ADD CONSTRAINT friends_user1_id_fkey 
  FOREIGN KEY (user1_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE friends ADD CONSTRAINT friends_user2_id_fkey 
  FOREIGN KEY (user2_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update private_messages table
ALTER TABLE private_messages DROP CONSTRAINT IF EXISTS private_messages_sender_id_fkey;
ALTER TABLE private_messages DROP CONSTRAINT IF EXISTS private_messages_receiver_id_fkey;
ALTER TABLE private_messages ADD CONSTRAINT private_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE private_messages ADD CONSTRAINT private_messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update group_chats table
ALTER TABLE group_chats DROP CONSTRAINT IF EXISTS group_chats_created_by_fkey;
ALTER TABLE group_chats ADD CONSTRAINT group_chats_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Update group_chat_members table
ALTER TABLE group_chat_members DROP CONSTRAINT IF EXISTS group_chat_members_user_id_fkey;
ALTER TABLE group_chat_members ADD CONSTRAINT group_chat_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update group_messages table
ALTER TABLE group_messages DROP CONSTRAINT IF EXISTS group_messages_sender_id_fkey;
ALTER TABLE group_messages ADD CONSTRAINT group_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update the profiles table to have proper RLS policies for friend access
DROP POLICY IF EXISTS "Allow users to view their profile" ON profiles;
DROP POLICY IF EXISTS "Users can view friend profiles" ON profiles;

-- Create a more comprehensive policy for viewing profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can view friend profiles" 
  ON profiles FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM friends 
      WHERE (user1_id = auth.uid() AND user2_id = id) 
         OR (user2_id = auth.uid() AND user1_id = id)
    )
  );

CREATE POLICY "Users can view profiles in search" 
  ON profiles FOR SELECT 
  USING (true);
