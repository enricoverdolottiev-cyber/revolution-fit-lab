-- ============================================
-- ADMIN DASHBOARD RLS POLICIES
-- Revolution Fit Lab
-- ============================================
-- 
-- Questo file contiene le policy RLS necessarie per
-- permettere agli utenti autenticati di visualizzare e
-- gestire le prenotazioni nella dashboard admin.
--
-- IMPORTANTE: Esegui questi comandi nel SQL Editor
-- di Supabase dopo aver configurato l'autenticazione.
-- ============================================

-- 1. Permetti agli utenti autenticati di SELECT (leggere) le prenotazioni
CREATE POLICY "Authenticated users can view bookings"
ON bookings
FOR SELECT
TO authenticated
USING (true);

-- 2. Permetti agli utenti autenticati di DELETE (eliminare) le prenotazioni
CREATE POLICY "Authenticated users can delete bookings"
ON bookings
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- NOTA: La policy di INSERT per utenti anonimi
-- dovrebbe già esistere per permettere le prenotazioni
-- dal sito pubblico. Non modificarla.
-- ============================================

-- Per verificare le policy esistenti:
-- SELECT * FROM pg_policies WHERE tablename = 'bookings';

