# Changelog

Tutte le modifiche rilevanti a questo progetto sono documentate qui.
Formato ispirato a [Keep a Changelog](https://keepachangelog.com/it/); versioning [SemVer](https://semver.org/lang/it/).

## [0.4.0] · 2026-11-05

### Aggiunto
- **Collegamento con Super Agenda** (funzione `export-pubblico`, solo campi pubblici): Albo, Consiglio comunale, feste e post del Comune, copiati ogni 2 ore dal cron del Worker.
- **Albo pretorio**: atti in pubblicazione divisi per tipo, oggetti leggibili e spiegazione breve automatica (segnalata), link all'Albo ufficiale.
- **Consiglio comunale**: prossima seduta (dal pannello o dalla convocazione all'Albo) con ordine del giorno e diretta; decisioni delle ultime sedute; in home nei 14 giorni prima.
- **Proposte dai post del Comune**: nel pannello i post Instagram recenti diventano bozze di avviso con l'AI (Workers AI); la redazione controlla e pubblica.
- **Zone e servizi**: avvisi per frazione e per servizio (acqua, luce, gas, strade); la tua zona sul telefono; blocco «Acqua, luce e strade» in home.
- **Notifiche push** senza account (Web Push standard, cifratura RFC 8291 verificata sul vettore ufficiale, VAPID); invio dal pannello a tutti o per zona.
- **Canale WhatsApp del Comune** in home e nella pagina zona, modificabile dal pannello.
- **Mappa offline** in SVG: punti dai nostri dati e, con il workflow settimanale, costa, strade, fermate, defibrillatori e farmacie da OpenStreetMap.
- **Inglese automatico** per gli avvisi senza traduzione, segnalato nell'app; pulsante «Traduci ora» nel pannello.
- **Statistiche senza cookie** (contatori per giorno, pagina e lingua) e **registro errori** dai telefoni, nel tab «Stato» del pannello.
- **Carte per l'adozione** in `docs/adozione/`: delibera, redazione, informativa, accessibilità, messa a disposizione, registro dei trattamenti.

### Cambiato
- Eventi: le feste del calendario del Comune sostituiscono le date stimate.

## [0.3.1] · 2026-11-05

### Cambiato
- Leggibilità: titoli, schede, avvisi e date in Montserrat grassetto senza maiuscolo forzato; Cormorant Garamond resta solo nel marchio in alto e nei post 4:5 generati.
- Etichette maiuscole portate ad almeno 12 px; testi secondari, badge e barra in basso leggermente più grandi.

## [0.3.0] · 2026-11-05

### Aggiunto
- **Home a modalità**: ordinaria, inverno, Natale, estate, giorno di festa, allerta. Si sceglie da sola (data, allerta meteo arancione o rossa) o dal pannello; anteprime su `#home/<modalità>`.
- **Pannello di redazione** (`/admin.html`, Worker + D1): aperture invernali, avvisi con stato e storia, modalità e messaggio della home, registro delle modifiche. Accesso con password (PBKDF2), cookie firmato, blocco dopo 8 tentativi.
- **Aperti d'inverno**: timeline novembre-marzo per zona e in ordine alfabetico, filtri per categoria e «aperti oggi», importazione di un elenco.
- **Servizi del Comune per bisogno** (33 schede con link alle pagine ufficiali) e **Chi chiamo per…** (17 problemi, email di segnalazione già impostata).
- **Avvisi**: pagina dedicata, stato e storico, avvisi del sito del Comune importati dal feed RSS.
- **Allerta meteo** dal bollettino della Protezione Civile, **meteo e mare** da Open-Meteo: li scarica GitHub ogni 2 ore, il telefono non contatta siti terzi.
- **Regole in vigore oggi** (bruciatura, incendi, orari dei rifiuti, ordinanza balneare, ZTL).
- **Crea un post**: grafica 4:5 nello stile dei preset del Comune, anche partendo da un avviso.
- Eventi: filtri oggi, domani, fine settimana; «Aggiungi al calendario».
- Controllo settimanale automatico di dati in scadenza e link rotti (issue su GitHub).
- `docs/legale.md` (quadro legale) e `docs/redazione.md` (guida al pannello).

### Cambiato
- Grafica del design system «Comune di Positano»: Cormorant Garamond e Montserrat ospitati nell'app (niente Google Fonts), colori di categoria, fili rossi, angoli squadrati. **Solo tema chiaro.**
- Barra in basso: Oggi, Emergenze, Servizi, Muoversi, Tutto.

## [0.2.2] · 2026-11-05

### Cambiato
- Orari invernali: bus interni Mobility Amalfi Coast dal 1° novembre, SITA dal 2 novembre; Travelmar confermato fino a metà novembre.
- Carabinieri: numero confermato (089 875011).

## [0.2.1] · 2026-10-08

### Aggiunto
- Orari di ottobre 2026 dei tre bus interni Mobility Amalfi Coast (Montepertuso-Nocelle, interno, Praiano) e prossime corse in home, ordinate per orario.
- Orari della farmacia, cimitero comunale con orari stagionali, avviso di apertura straordinaria per i defunti (27/10-4/11), Croce Rossa con sede e telefono.

### Corretto
- Il secco si espone il mercoledì.
- Bus interno: biglietto 1,50 € (2 € a bordo), non 0,90 €.

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
