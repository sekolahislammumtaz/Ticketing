-- Perbaikan galat 42501 "permission denied for table ..." (HTTP 401 dari PostgREST).
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > Run.
-- Aman diulang berkali-kali.

-- 1. Cek cepat (opsional): semua harus true dan policy harus muncul.
-- SELECT tablename, has_table_privilege('anon', 'public.' || tablename, 'SELECT') AS anon_bisa_select
--   FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname = 'public';

-- 2. Beri izin schema dan tabel ke role yang dipakai aplikasi.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Supaya tabel baru otomatis ikut punya izin yang sama.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. Pastikan RLS aktif dan policy longgar (aplikasi memakai anon key dari browser).
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to events" ON public.events;
CREATE POLICY "Allow public access to events" ON public.events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to students" ON public.students;
CREATE POLICY "Allow public access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to participants" ON public.participants;
CREATE POLICY "Allow public access to participants" ON public.participants FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to scanner_users" ON public.scanner_users;
CREATE POLICY "Allow public access to scanner_users" ON public.scanner_users FOR ALL USING (true) WITH CHECK (true);

-- 5. Muat ulang cache skema PostgREST supaya izin langsung berlaku.
NOTIFY pgrst, 'reload schema';
