# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate qui.
Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/); versioning [SemVer](https://semver.org/lang/it/).

## [0.2.0] · 2026-10-08

### Aggiunto
- **Home «Oggi a Positano»**: data e saluto in ora italiana, alba e tramonto calcolati sul telefono (senza rete), stagione, bottone 112, avvisi attivi (incendi, sentieri), rifiuti da esporre stasera, prossime partenze di traghetti e ultimo bus, targhe alterne del giorno, prossimi eventi.
- **Ricerca globale** su tutta la guida (tasto lente o «/»), tollerante ad accenti e plurali, con link diretto alla scheda.
- **Nuove sezioni**: «Da vedere» (chiesa, MAR, frazioni, torri, storia in sette date) e «Comune, uffici e regole» (orari, PEC, pagoPA, ZTL, ordinanza balneare, a chi segnalare cosa).
- **Schede con azioni**: chiama, mappa (Apple Maps, Android o OpenStreetMap), sito, email, PEC, condividi; fonte e data su ogni scheda; stato «attivo in questo periodo» per i servizi stagionali.
- **Rifiuti**: cosa si espone sera per sera nella settimana, glossario «dove lo butto?» con 18 voci colorate per frazione.
- **Eventi**: feste ricorrenti che passano da sole all'anno dopo, segnate «data dell'anno scorso, da confermare».
- Dati raccolti da fonti pubbliche (Comune, albo pretorio, ASL, SITA, Travelmar, CAI Monti Lattari, Guardia Costiera, ARPAC, stampa locale), ciascuno con fonte e data.
- Test senza dipendenze (`node --test tests/*.test.mjs`): funzioni del tempo e validazione dei dati (testi bilingui, date, coordinate, id). Eseguiti in CI.
- Scorciatoie dall'icona dell'app (Emergenze, Muoversi, Rifiuti).

### Cambiato
- Nuova grafica: mare profondo, calce e maiolica; icone SVG al posto delle emoji; tema scuro rivisto; testo più grande e tocchi da almeno 44 px.
- Barra in basso: Oggi · Emergenze · Muoversi · Rifiuti · Tutto. Il tasto indietro del telefono ora funziona fra le sezioni.
- «Trasporti» diventa «Arrivare e muoversi» (i vecchi link `#trasporti` funzionano ancora).

### Corretto
- Il service worker serviva JS e CSS dalla cache per sempre: gli aggiornamenti non arrivavano. Ora prima la rete (con 3 secondi di tolleranza) e poi la copia salvata.
- Gli eventi usavano la data UTC (dopo mezzanotte risultava ancora ieri) e una festa ricorrente passata restava con la data vecchia.
- Pagine interne senza titolo principale (h1) e gerarchia dei titoli saltata.
- Date mostrate in formato `2026-07-13`: ora «13 luglio 2026».

## [0.1.0] — 2026-07-13

### Aggiunto
- Scheletro PWA senza build: HTML/CSS/JS puro, installabile, offline-first (service worker).
- Sezioni: emergenze e numeri utili, trasporti, rifiuti (con glossario "dove lo butto?"), spiagge, sentieri, eventi, info progetto.
- Bilingue IT/EN con cambio lingua persistente.
- Dati in JSON bilingue con flag `verificato` e data di aggiornamento per sezione.
- Icona SVG, manifest, tema chiaro/scuro automatico.
- Documentazione: README, CONTRIBUTING, GOVERNANCE, codice di condotta, roadmap, guida deploy Cloudflare Pages, fonti dati.
- `publiccode.yml` per il futuro inserimento nel catalogo del riuso di Developers Italia.
