# Guida al pannello di redazione

Indirizzo: `/admin.html` (link anche in fondo a «Il progetto»). Al primo accesso si sceglie la propria password (almeno 12 caratteri).

## Aperture invernali
- **Aggiungi un locale**: nome, categoria, zona, uno o più periodi (dal/al), facoltativi giorni della settimana («solo ven, sab, dom»), nota («solo a pranzo»).
- **Importa un elenco**: una riga per locale, `Nome; categoria; zona; 1/11-30/11, 8/12-6/1; nota`. Le date di gennaio-giugno vanno all'anno dopo da sole.
- **Stagione e zone**: inizio e fine della timeline, data «aggiornato al», testo sotto il titolo e **ordine delle zone** (una per riga): nell'app i locali escono per zona in quest'ordine, e dentro ogni zona in ordine alfabetico.
- Un locale nascosto non compare nell'app ma resta nel pannello.

## Avvisi
- Un avviso è visibile dal giorno «dal» al giorno «al» e poi sparisce da solo.
- Quando la situazione cambia **si aggiorna lo stesso avviso**: stato (attivo, aggiornato, risolto) e una nota di aggiornamento, che resta nella storia sotto l'avviso.
- «Crea il post» apre il generatore della grafica 4:5 già compilato.

## Dai post del Comune
- Il tab mostra i post Instagram del Comune degli ultimi 45 giorni (arrivano da Super Agenda). «Prepara l'avviso» scrive una bozza con l'AI: titolo, testo, date, zone, servizio, inglese. **Controlla sempre date e zone** prima di pubblicare. «Non serve» lo toglie dalla lista (si può rimettere).

## Zone e servizi
- Negli avvisi scegli le zone interessate (nessuna = tutto il paese) e il servizio interrotto (acqua, luce, gas, strade): chi ha scelto la sua zona li vede in cima alla home.
- L'elenco delle zone si cambia in «Consiglio e canali». Cambiare un nome stacca gli iscritti alle notifiche da quella zona.

## Notifiche
- Arrivano solo a chi le ha attivate nell'app. Usale poco: allerte, interruzioni, chiusure, comunicazioni urgenti. Il pulsante chiede conferma; l'invio procede a blocchi di 40 e, se si interrompe, «Completa» lo riprende dal punto giusto.
- Su iPhone funzionano solo se l'app è installata sulla Home (iOS 16.4 o successivi).

## Consiglio e canali
- Prossima seduta: data, ora, luogo, ordine del giorno (un punto per riga), link alla convocazione e alla diretta. Senza seduta inserita, l'app usa l'ultima convocazione all'Albo se è futura.
- Canale WhatsApp del Comune: il link compare in home e nella pagina «La tua zona e notifiche».

## Stato
- Visite degli ultimi 30 giorni (contatori anonimi), errori arrivati dai telefoni, ultima lettura di Super Agenda con il pulsante «Aggiorna ora», stato dell'AI.

## Home
- Automatica: Inverno (nov-mar), Natale (6 dic-7 gen), Estate (metà giugno-metà settembre), Giorno di festa (San Vito, Montepertuso, Assunta), Allerta (allerta meteo arancione o rossa del bollettino della Protezione Civile).
- Si può fissare una modalità a mano e scrivere un messaggio in cima («Strada riaperta», «Scuole chiuse domani»). Per tornare all'automatico: «Automatica».
- Anteprime di ogni home: `/#home/inverno`, `/#home/natale`, `/#home/estate`, `/#home/festa`, `/#home/allerta`.

## Registro
- Le ultime 100 modifiche con chi e quando. Il database conserva anche il prima e il dopo di ogni modifica.

## Dati automatici (senza pannello)
- Ogni 2 ore: allerta meteo (Protezione Civile), meteo e mare (Open-Meteo), avvisi del sito del Comune (RSS).
- Ogni lunedì: controllo di orari in scadenza e link rotti, con una issue su GitHub se c'è da fare.
