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

-- 2. Table Students (Master Data Siswa)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division TEXT NOT NULL,
  class_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  parent_whatsapp TEXT,
  parent_email TEXT,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Participants (Peserta & Tiket)
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  division TEXT NOT NULL,
  class_name TEXT,
  ticket_type TEXT,
  track TEXT,
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

-- 4. Table Scanner Users (User Tiket Scanner max 10)
CREATE TABLE IF NOT EXISTS public.scanner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter Table untuk database yang sudah terlanjur dibuat sebelumnya
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS ticket_type TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS track TEXT;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Grant izin tabel ke role anon/authenticated (tanpa ini PostgREST membalas 42501 / HTTP 401)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Turn on Row Level Security (RLS) and allow public read/write for simple access
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the app (Idempotent policies)
DROP POLICY IF EXISTS "Allow public access to events" ON public.events;
CREATE POLICY "Allow public access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to students" ON public.students;
CREATE POLICY "Allow public access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to participants" ON public.participants;
CREATE POLICY "Allow public access to participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to scanner_users" ON public.scanner_users;
CREATE POLICY "Allow public access to scanner_users" ON public.scanner_users FOR ALL USING (true) WITH CHECK (true);

-- Indexes for fast scanning and lookup
CREATE INDEX IF NOT EXISTS idx_participants_ticket ON public.participants(ticket_code);
CREATE INDEX IF NOT EXISTS idx_participants_event ON public.participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_student ON public.participants(student_id);
CREATE INDEX IF NOT EXISTS idx_students_division_class ON public.students(division, class_name);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(student_name);
