# Admin Dashboard Setup - Revolution Fit Lab

## Configurazione Supabase Authentication

### Step 1: Creare un Utente Admin su Supabase

1. Apri il **Supabase Dashboard**
2. Vai su **Authentication** → **Users**
3. Clicca su **"Add user"** → **"Create new user"**
4. Inserisci:
   - **Email**: la tua email admin (es. `admin@revolutionfitlab.com`)
   - **Password**: una password sicura
   - **Auto Confirm User**: ✅ (per evitare conferma email)
5. Clicca **"Create user"**

### Step 2: Configurare le RLS Policies

1. Vai su **SQL Editor** nel Supabase Dashboard
2. Apri il file `supabase_security.sql` dalla root del progetto
3. Copia e incolla tutto il contenuto nel SQL Editor
4. Clicca **"Run"** per eseguire lo script

**Le policy configurate permettono:**
- ✅ **INSERT**: Chiunque (anonimo o autenticato) può creare prenotazioni
- ✅ **SELECT**: Solo utenti autenticati possono vedere le prenotazioni
- ✅ **DELETE**: Solo utenti autenticati possono eliminare prenotazioni
- ❌ **UPDATE**: Nessuno può modificare prenotazioni (nemmeno admin)

### Step 3: Verificare la Configurazione

1. Avvia il progetto: `npm run dev`
2. Vai su `http://localhost:5173/login`
3. Inserisci le credenziali admin create nello Step 1
4. Dopo il login, verrai reindirizzato a `/admin`

## Struttura dell'Admin Dashboard

### Funzionalità Implementate

- ✅ **Autenticazione**: Login con Supabase Auth
- ✅ **Route Protetta**: Accesso solo agli utenti autenticati
- ✅ **Statistiche**: 
  - Totale prenotazioni
  - Prenotazioni di oggi
  - Prenotazioni di questa settimana
- ✅ **Tabella Prenotazioni**: 
  - Visualizzazione di tutte le prenotazioni
  - Formato data italiano (DD/MM/YYYY HH:mm)
  - Colonne: Data, Cliente, Email, Telefono, Classe
- ✅ **Eliminazione**: 
  - Eliminazione con conferma
  - Feedback visivo (successo/errore)
- ✅ **Logout**: Disconnessione sicura

### Design

- **Tema**: Dark/Zinc (background `#09090b`, cards `#18181b`)
- **Animazioni**: Framer Motion per transizioni smooth
- **Icone**: Lucide React (LogOut, Trash2, Users, Calendar)
- **Responsive**: Ottimizzato per mobile e desktop

## Troubleshooting

### Errore: "Database non configurato"
**Causa**: Le variabili d'ambiente Supabase non sono configurate.
**Soluzione**: 
1. Verifica che il file `.env` contenga:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
2. Riavvia il server di sviluppo

### Errore: "Error fetching bookings" o "permission denied"
**Causa**: Le RLS policies non sono configurate correttamente.
**Soluzione**:
1. Verifica che lo script `supabase_security.sql` sia stato eseguito
2. Controlla nella sezione **Authentication** → **Policies** che le policy siano presenti
3. Assicurati di essere autenticato come utente admin

### Non riesco a fare login
**Causa**: L'utente non esiste o la password è errata.
**Soluzione**:
1. Verifica che l'utente esista in **Authentication** → **Users**
2. Se necessario, crea un nuovo utente o resetta la password
3. Assicurati che l'utente sia confermato (Auto Confirm User = true)

## Note di Sicurezza

- ⚠️ **Mai committare le credenziali admin nel repository**
- ⚠️ **Usa password forti per gli account admin**
- ⚠️ **Considera di limitare l'accesso all'admin dashboard tramite IP whitelist in produzione**
- ⚠️ **Logout automatico dopo periodo di inattività** (feature futura)

## Prossimi Miglioramenti Possibili

- [ ] Filtri per data/classe nella tabella prenotazioni
- [ ] Export CSV delle prenotazioni
- [ ] Paginazione per grandi quantità di dati
- [ ] Search bar per cercare prenotazioni
- [ ] Logout automatico dopo X minuti di inattività
- [ ] Notifiche email quando arrivano nuove prenotazioni

