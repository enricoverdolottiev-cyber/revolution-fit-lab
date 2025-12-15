-- ============================================
-- Revolution Fit Lab - Supabase Security Setup
-- ============================================
-- Questo script configura Row Level Security (RLS) 
-- per la tabella 'bookings' su Supabase.
--
-- ISTRUZIONI:
-- 1. Apri il Dashboard Supabase
-- 2. Vai su SQL Editor
-- 3. Incolla e esegui questo script
-- ============================================

-- STEP 1: Abilita Row Level Security sulla tabella bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- STEP 2: Policy per INSERT (pubblico - chiunque può prenotare)
-- Permette agli utenti anonimi di inserire nuove prenotazioni
CREATE POLICY "Allow public insert on bookings"
ON bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- STEP 3: Policy per SELECT (negata al pubblico)
-- Nessun utente anonimo può vedere le prenotazioni
-- Solo gli admin (service_role) possono vedere i dati
CREATE POLICY "Deny public select on bookings"
ON bookings
FOR SELECT
TO anon
USING (false);

-- STEP 4: Policy per DELETE (negata al pubblico)
-- Nessun utente anonimo può eliminare prenotazioni
CREATE POLICY "Deny public delete on bookings"
ON bookings
FOR DELETE
TO anon
USING (false);

-- STEP 5: Policy per UPDATE (negata al pubblico)
-- Nessun utente anonimo può modificare prenotazioni
CREATE POLICY "Deny public update on bookings"
ON bookings
FOR UPDATE
TO anon
USING (false);

-- ============================================
-- NOTE IMPORTANTI:
-- ============================================
-- - Le policy sopra permettono INSERT a tutti (anon + authenticated)
-- - Le policy bloccano SELECT/DELETE/UPDATE per utenti anonimi
-- - Gli admin con service_role possono comunque accedere a tutto
-- - Per vedere le prenotazioni, usa il Dashboard Supabase o un backend admin
-- ============================================

