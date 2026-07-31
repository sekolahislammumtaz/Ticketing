-- ========================================================
-- DATABASE SCHEMA UNTUK APLIKASI TICKETING ACARA (SUPABASE)
-- Copy-paste seluruh script ini ke Supabase SQL Editor dan jalankan (Run)
-- ========================================================

-- 1. Table Events (Acara)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Participants (Peserta & Tiket)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  ticket_code TEXT NOT NULL,
  status TEXT DEFAULT '',
  wa_sent BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ,
  scanned_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ticket_per_event UNIQUE (event_id, ticket_code)
);

-- 3. Table Scanner Users (User Tiket Scanner max 10)
CREATE TABLE IF NOT EXISTS public.scanner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) and allow public read/write for simple access
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the app
CREATE POLICY "Allow public access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to scanner_users" ON public.scanner_users FOR ALL USING (true) WITH CHECK (true);

-- Indexes for fast scanning and lookup
CREATE INDEX IF NOT EXISTS idx_participants_ticket ON public.participants(ticket_code);
CREATE INDEX IF NOT EXISTS idx_participants_event ON public.participants(event_id);
