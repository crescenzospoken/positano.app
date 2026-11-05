-- Positano.app v0.4: zone e servizi negli avvisi, traduzione automatica, proposte da Instagram,
-- notifiche push, statistiche senza cookie, registro errori, dati di Super Agenda.
ALTER TABLE avvisi ADD COLUMN zone TEXT NOT NULL DEFAULT '[]';
ALTER TABLE avvisi ADD COLUMN servizio TEXT NOT NULL DEFAULT '';
ALTER TABLE avvisi ADD COLUMN tradotto_auto INTEGER NOT NULL DEFAULT 0;
ALTER TABLE avvisi ADD COLUMN ig_id TEXT;

-- Post Instagram del Comune già trattati dalla redazione (diventati avvisi o ignorati).
CREATE TABLE IF NOT EXISTS proposte (ig_id TEXT PRIMARY KEY, esito TEXT NOT NULL, avviso_id INTEGER, quando TEXT NOT NULL, chi TEXT NOT NULL);

-- Atti dell'Albo spiegati in breve (testo semplificato automaticamente; fa fede l'atto).
CREATE TABLE IF NOT EXISTS albo_breve (registro INTEGER PRIMARY KEY, oggetto TEXT NOT NULL, it TEXT NOT NULL, en TEXT NOT NULL, creato TEXT NOT NULL);

-- Iscrizioni alle notifiche: solo l'indirizzo tecnico del browser e le zone scelte. Nessun nome, nessuna email.
CREATE TABLE IF NOT EXISTS iscrizioni (endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL, zone TEXT NOT NULL DEFAULT '[]', lingua TEXT NOT NULL DEFAULT 'it', creato TEXT NOT NULL, ultimo_ok TEXT);
CREATE TABLE IF NOT EXISTS invii (id INTEGER PRIMARY KEY AUTOINCREMENT, quando TEXT NOT NULL, chi TEXT NOT NULL, titolo TEXT NOT NULL, testo TEXT, url TEXT, zona TEXT, destinatari INTEGER NOT NULL DEFAULT 0, ok INTEGER NOT NULL DEFAULT 0, rimossi INTEGER NOT NULL DEFAULT 0, finito INTEGER NOT NULL DEFAULT 0);

-- Statistiche senza cookie: solo contatori per giorno, sezione e lingua. Niente IP, niente identificativi.
CREATE TABLE IF NOT EXISTS visite (giorno TEXT NOT NULL, sezione TEXT NOT NULL, lingua TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (giorno, sezione, lingua));

-- Errori dai dispositivi: messaggio e pagina, raggruppati. Niente IP.
CREATE TABLE IF NOT EXISTS errori (firma TEXT PRIMARY KEY, messaggio TEXT NOT NULL, dove TEXT, versione TEXT, primo TEXT NOT NULL, ultimo TEXT NOT NULL, volte INTEGER NOT NULL DEFAULT 1);
