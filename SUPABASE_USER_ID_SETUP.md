# Setup Colonna user_id nella Tabella bookings

## Verifica e Configurazione

### 1. Verifica Esistenza Colonna

1. Apri il **Supabase Dashboard**
2. Vai su **Table Editor** → **bookings**
3. Controlla se esiste la colonna `user_id`

### 2. Se la Colonna NON Esiste - Aggiungila

#### Opzione A: Tramite SQL Editor (Raccomandato)

1. Vai su **SQL Editor** in Supabase
2. Esegui questo script:

```sql
-- Aggiungi colonna user_id alla tabella bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Aggiungi indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Commento per documentazione
COMMENT ON COLUMN bookings.user_id IS 'Collegamento all''utente autenticato che ha creato la prenotazione';
```

#### Opzione B: Tramite Table Editor (UI)

1. Vai su **Table Editor** → **bookings**
2. Clicca su **Add Column**
3. Configurazione:
   - **Name**: `user_id`
   - **Type**: `uuid`
   - **Is Nullable**: ✅ (Sì, per permettere prenotazioni senza utente loggato)
   - **Default Value**: (lascia vuoto)
   - **Foreign Key**: 
     - **Referenced Table**: `auth.users`
     - **Referenced Column**: `id`
     - **On Delete**: `SET NULL` (opzionale, per mantenere le prenotazioni anche se l'utente viene eliminato)

### 3. Verifica RLS (Row Level Security)

Assicurati che le policy RLS permettano l'inserimento con `user_id`:

```sql
-- Verifica policy esistenti
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Se necessario, aggiorna la policy per permettere INSERT con user_id
-- (La policy esistente dovrebbe già permettere INSERT pubblico)
```

### 4. Test

Dopo aver aggiunto la colonna:

1. Prova a creare una prenotazione dal frontend
2. Verifica nella tabella `bookings` che:
   - La prenotazione sia stata creata
   - La colonna `user_id` contenga l'ID dell'utente loggato (se presente)
   - Se l'utente non è loggato, `user_id` può essere NULL

## Note Importanti

- **user_id è opzionale**: Il codice frontend gestisce correttamente sia con che senza questa colonna
- **Backward Compatibility**: Se la colonna non esiste, le prenotazioni funzioneranno comunque, ma non saranno collegate al profilo utente
- **Dashboard**: La dashboard del cliente usa `email` per filtrare le prenotazioni, quindi funziona anche senza `user_id`

## Troubleshooting

### Errore: "column user_id does not exist"
- La colonna non è stata creata correttamente
- Verifica nello schema della tabella

### Errore: "foreign key constraint violation"
- La colonna esiste ma il riferimento a `auth.users` non è configurato correttamente
- Verifica che il tipo sia `UUID` e che il foreign key sia impostato

### Errore: "permission denied"
- Le policy RLS potrebbero bloccare l'inserimento
- Verifica le policy nella sezione **Authentication** → **Policies**

