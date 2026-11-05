# Bozza · Scheda per il registro dei trattamenti (art. 30 GDPR)

| Campo | Contenuto |
|---|---|
| Denominazione | Positano.app: informazione ai cittadini, notifiche, redazione |
| Titolare | Comune di Positano |
| Struttura di riferimento | [Servizio __] |
| Finalità | Informazione di pubblica utilità; invio di notifiche a chi le richiede; gestione redazionale con tracciabilità delle modifiche |
| Base giuridica | Art. 6.1.e GDPR (informazione e servizi); art. 6.1.a (notifiche, consenso) |
| Categorie di interessati | Utenti dell'app che attivano le notifiche; personale abilitato alla redazione |
| Categorie di dati | Identificativo tecnico di iscrizione alle notifiche, zona, lingua; email, nome e ruolo dei redattori; registro delle modifiche; dati tecnici di navigazione trattati dall'hosting |
| Dati particolari o giudiziari | No |
| Destinatari | Fornitore di hosting (responsabile ex art. 28); servizi push dei browser (solo recapito di messaggi cifrati) |
| Trasferimenti extra UE | [Hosting attuale: USA, con DPF e clausole contrattuali standard. Da azzerare con l'hosting qualificato ACN in UE] |
| Termini di cancellazione | Iscrizioni: fino a revoca o scadenza; account: fine incarico; registro: [__] anni; statistiche anonime: 400 giorni |
| Misure di sicurezza | HTTPS; password con PBKDF2-SHA256 (100.000 iterazioni) e sale; cookie di sessione firmato, HttpOnly, Secure, SameSite=Strict; protezione CSRF; limite ai tentativi di accesso; registro delle modifiche; cifratura end-to-end delle notifiche (RFC 8291); nessun dato personale nei sistemi di AI |
| DPIA | Non necessaria: trattamento non su larga scala di dati particolari, nessuna profilazione [da confermare con il DPO] |
