-- Messages and Conversations Schema
-- This schema supports customer-to-vendor messaging functionality

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'vendor')),
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Customers can see their own conversations
CREATE POLICY "Customers can view their conversations" ON conversations
  FOR SELECT
  USING (auth.uid()::text = customer_id);

-- Vendors can see conversations where they are the vendor
CREATE POLICY "Vendors can view their conversations" ON conversations
  FOR SELECT
  USING (auth.uid()::text = vendor_id);

-- Customers can create conversations
CREATE POLICY "Customers can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid()::text = customer_id);

-- Customers and vendors can update their conversations
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE
  USING (
    auth.uid()::text = customer_id OR 
    auth.uid()::text = vendor_id
  );

-- RLS Policies for messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid()::text OR vendor_id = auth.uid()::text
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid()::text OR vendor_id = auth.uid()::text
    )
  );

-- Users can update messages (for marking as read)
CREATE POLICY "Users can update their messages" ON messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid()::text OR vendor_id = auth.uid()::text
    )
  );

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.text,
    last_message_time = NEW.timestamp,
    updated_at = NOW(),
    unread_count = CASE 
      WHEN NEW.sender_type = 'vendor' THEN unread_count + 1
      ELSE unread_count
    END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating conversation
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conversation_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET read = TRUE
  WHERE conversation_id = conversation_id_param;
  
  UPDATE conversations
  SET unread_count = 0
  WHERE id = conversation_id_param;
END;
$$ LANGUAGE plpgsql;
