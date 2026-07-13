# Contribuire a Positano.app

Grazie! Questo progetto vive di contributi, e **non serve saper programmare**: il valore principale sono i dati locali verificati.

## Come contribuire senza programmare

1. **Segnala un errore o un'informazione mancante**: apri una [issue](../../issues) descrivendo cosa va corretto (es. "il numero della guardia medica è cambiato").
2. **Correggi direttamente un dato**: i contenuti sono file JSON in `public/data/`. Puoi modificarli dall'interfaccia web di GitHub (icona matita) e proporre la modifica (pull request).

## Regole per i dati

- Ogni informazione deve avere una **fonte verificabile** (sito ufficiale, delibera, verifica sul campo). Indicala nella descrizione della modifica.
- I testi sono bilingui: compila sempre sia `it` che `en` (se non sai l'inglese, scrivilo nella PR: ci pensa qualcun altro).
- Se un dato non è certo, imposta `"verificato": false` — l'app mostrerà l'etichetta "da verificare".
- Aggiorna il campo `"aggiornato"` del file con la data della modifica (formato `AAAA-MM-GG`).
- **Niente dati personali** di privati cittadini; solo contatti pubblici e istituzionali.
- **Niente contenuti promozionali o politici**: vedi [GOVERNANCE.md](GOVERNANCE.md).

## Come contribuire al codice

1. Forka il repository e crea un branch (`fix/nome-fix` o `feat/nome-feature`).
2. L'app è HTML/CSS/JS puro, senza build: apri `public/` con un server statico e verifica le modifiche.
3. Requisiti: accessibilità (WCAG 2.1 AA), niente dipendenze esterne senza discussione, niente tracker.
4. Apri una pull request descrivendo cosa cambia e perché.

## Stile

- Italiano semplice e diretto; inglese chiaro per i visitatori.
- Il codice segue lo stile esistente (vanilla JS, niente framework in v0).
