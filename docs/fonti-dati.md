# Fonti dei dati e referenti

Ogni sezione ha un "proprietario" umano responsabile dell'aggiornamento e una fonte primaria. Regola d'oro: **meglio meno dati, ma giusti**: mai pubblicare informazioni che non possiamo mantenere aggiornate.

| Sezione | File | Fonte primaria | Referente | Frequenza |
|---|---|---|---|---|
| Emergenze e salute | `numeri-utili.json` | ASL Salerno, Guardia Costiera, Comune | *da assegnare* | Trimestrale |
| Arrivare e muoversi | `trasporti.json` | SITA Sud, Travelmar, delibere taxi e ZTL, ordinanza ANAS | *da assegnare* | A ogni cambio d'orario |
| Rifiuti | `rifiuti.json` | Pagina «Raccolta differenziata» del Comune, gestore | *da assegnare* | A ogni variazione |
| Spiagge | `spiagge.json` | Schede luoghi del Comune, ARPAC, ordinanza balneare | *da assegnare* | Annuale (pre-stagione) |
| Sentieri | `sentieri.json` | CAI Monti Lattari (numeri e stato), avvisi del Comune | *da assegnare* | Annuale + avvisi |
| Eventi | `eventi.json` | Comune («Cosa c'è da fare»), parrocchie, albo | *da assegnare* | Settimanale |
| Da vedere | `luoghi.json` | Schede luoghi del Comune, MAR, parrocchia | *da assegnare* | Annuale |
| Comune e regole | `comune.json` | Sito del Comune, albo pretorio | *da assegnare* | Trimestrale |
| Avvisi | `avvisi.json` | Comune, Regione, ANAS | *da assegnare* | Quando servono |

## Convenzioni

- `verificato: false` → l'app mostra l'etichetta «Da verificare»; per ogni dato non confermato da fonte primaria.
- `fonte: { nome, url, data }` → l'app la mostra in fondo alla scheda. `data` è la data della fonte, non della modifica.
- `aggiornato` (AAAA-MM-GG) → aggiornare a ogni modifica del file; l'app lo mostra all'utente.
- `periodo: { dal, al }` in `MM-GG` (stagionale, anche a cavallo d'anno) o `AAAA-MM-GG` → l'app dice «Attivo in questo periodo» o «Fermo».
- Eventi con `ricorrente: "annuale"`: passata la data, l'app mostra la stessa data dell'anno dopo come stimata. Quando esce il programma nuovo, aggiornare `data`.
- Avvisi (`avvisi.json`) con `dal` e `al`: in home solo nei giorni indicati, poi spariscono da soli.
- Partenze (`trasporti.json › partenze`): orari del giorno per la home, con `dal`/`al` del periodo di validità dell'orario. Scaduto il periodo, la riga sparisce: niente orari vecchi in vista.
- Targhe alterne (`trasporti.json › targhe.giorni`): elenco dei giorni in cui vale il divieto.
- Rifiuti (`rifiuti.json › calendario.sere`): cosa si espone la sera di ogni giorno (0 = domenica).
- Niente nomi di esercizi commerciali, niente cellulari privati, niente contenuti politici.
- `node --test tests/*.test.mjs` controlla che ogni testo abbia italiano e inglese, che date e coordinate siano valide e che gli id siano unici.

## Dati da verificare con gli uffici (al 8 ottobre 2026)

1. **Rifiuti**: ✅ il secco è il mercoledì (confermato l'8/10/2026). Restano: i giorni sono "sera di esposizione" o "giorno di ritiro"? Gestore 2026: DM Technology (determine 2026) o L'Igiene Urbana Evolution (Carta della qualità 2023)? Calendario delle attività.
2. **Bus interno** Mobility Amalfi Coast: ✅ orario di ottobre 2026 inserito (locandine ufficiali). ⚠️ Scade il 31/10: inserire l'orario di novembre appena esce (il gestore è provvisorio, contratto scaduto il 30/6).
3. **Farmacia**: ✅ una sola, viale Pasitea 22, orari da Google. Restano i turni notturni.
4. **Croce Rossa**: viale Pasitea 286A, 089 8123520 da Google (da confermare).
5. **Carabinieri** (089 875011 dal sito 2017, 089 811666 da un elenco recente: quale?) e **Guardia di Finanza** (089 875129): numeri dal sito comunale del 2017.
6. **Taxi**: non esiste un numero pubblico del posteggio o di una cooperativa (solo imprese private e cellulari, esclusi per neutralità); conferma che la delibera 97/2024 sia ancora in vigore.
7. **Targhe alterne**: fine del calendario 2026 (31 ottobre o 1° novembre) e calendario 2027.
8. **Traghetti** stagionali (Positano Jet, NLG, Alicost): date di inizio e fine stagione.
9. **Ufficio postale**, **biblioteca**, **scuole**: recapiti dal piano di emergenza 2018.
10. **Piano di emergenza comunale**: è ancora quello del 2018? Le aree di attesa sono le stesse?
11. **Spiagge**: tratti di spiaggia libera ad Arienzo e Laurito; accessi a La Porta e Fiumicello; accessibilità per persone con disabilità.
12. **Ospedale Costa d'Amalfi**: numero diretto del pronto soccorso.
13. **Avviso sentieri Tese-Fiume**: fino a quando vale.
