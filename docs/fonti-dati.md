# Fonti dei dati e referenti

Ogni sezione ha un "proprietario" umano responsabile dell'aggiornamento e una fonte primaria. Regola d'oro: **meglio meno dati, ma giusti** — mai pubblicare informazioni che non possiamo mantenere aggiornate.

| Sezione | File | Fonte primaria | Referente | Frequenza |
|---|---|---|---|---|
| Numeri utili | `numeri-utili.json` | Verifica diretta + siti istituzionali | *da assegnare* | Trimestrale |
| Bus | `trasporti.json` | SITA Sud (orari stagionali) | *da assegnare* | Ad ogni cambio stagione |
| Mare | `trasporti.json` | Gestori collegamenti marittimi | *da assegnare* | Ad ogni cambio stagione |
| Parcheggi/Taxi | `trasporti.json` | Delibere comunali, verifica diretta | *da assegnare* | Semestrale |
| Rifiuti | `rifiuti.json` | Ufficio Ambiente / gestore raccolta | *da assegnare* | Ad ogni variazione |
| Spiagge | `spiagge.json` | Verifica sul campo | *da assegnare* | Annuale (pre-stagione) |
| Sentieri | `sentieri.json` | Verifica sul campo, CAI, Comune | *da assegnare* | Annuale + segnalazioni |
| Eventi | `eventi.json` | Comune, parrocchia, associazioni | *da assegnare* | Settimanale |

## Convenzioni

- `verificato: false` → l'app mostra l'etichetta "da verificare"; da usare per ogni dato non confermato da fonte primaria.
- `aggiornato` (AAAA-MM-GG) → aggiornare ad ogni modifica del file; l'app lo mostra all'utente.
- `esempio: true` → contenuto dimostrativo, da rimuovere appena esistono dati reali.
- Fonti citate nella pull request che introduce o modifica il dato.
