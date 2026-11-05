-- Positano.app v0.5: archivio proprio dell'Albo pretorio (solo metadati pubblici, categorie senza nomi di privati)
-- e calendari pubblici collegati con un link .ics. Nessun collegamento a sistemi esterni di parte.
CREATE TABLE IF NOT EXISTS albo (albo_id INTEGER PRIMARY KEY, registro INTEGER, num_atto TEXT, data_atto TEXT, oggetto TEXT NOT NULL, categoria TEXT NOT NULL,
  ente TEXT, pub_da TEXT, pub_a TEXT, primo_visto TEXT NOT NULL, ultimo_visto TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS albo_pub_a ON albo (pub_a);
CREATE INDEX IF NOT EXISTS albo_categoria ON albo (categoria, pub_da);
DELETE FROM config WHERE chiave = 'superagenda';
-- Applicata in produzione il 5/11/2026, insieme a un avvio una tantum dello storico del Consiglio comunale
-- (25 righe: delibere di Consiglio e convocazioni da giugno a ottobre 2026, metadati pubblici dell'Albo pretorio).
