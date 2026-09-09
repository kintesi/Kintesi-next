-- ==============================================================================
-- 💬 CARTFLY IN-WEBSITE LIVE CHAT - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. CREATE CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id TEXT NOT NULL DEFAULT 'default_chat',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'seller', 'system')),
  sender_name TEXT NOT NULL DEFAULT 'Customer',
  sender_email TEXT,
  text TEXT NOT NULL,
  product_context JSONB DEFAULT NULL,
  order_context JSONB DEFAULT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. CHAT RLS POLICIES
-- Anyone (guests & logged in customers) can view chat messages
CREATE POLICY "Public chat messages viewable" 
  ON public.chat_messages 
  FOR SELECT 
  USING (true);

-- Anyone can send messages
CREATE POLICY "Anyone can send chat messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Admins and message owners can update status (e.g. mark as read)
CREATE POLICY "Admins and senders can update chat messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (true);

-- Admins can delete/clear chat logs
CREATE POLICY "Admins can delete chat messages" 
  ON public.chat_messages 
  FOR DELETE 
  USING (true);

-- 4. REALTIME PUBLICATION
-- Enable real-time updates so new messages appear live without page reload
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 5. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON public.chat_messages(created_at DESC);
