# Positano.app

**La guida civica di Positano** — un bene comune digitale, open source, per chi a Positano vive e per chi la visita.

> 🇬🇧 *Positano.app is an open source civic Progressive Web App for the town of Positano (Amalfi Coast, Italy): emergency numbers, transport, waste collection, beaches, trails and events, in Italian and English, offline-first, with no ads and no tracking. Licensed under EUPL-1.2. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).*

## Cos'è

Una **PWA** (Progressive Web App) che raccoglie in un unico posto le informazioni utili della vita quotidiana e della visita a Positano:

| Sezione | Contenuto |
|---|---|
| 🚨 Emergenze | Numeri di emergenza e servizi locali, con chiamata diretta |
| 🚌 Trasporti | Bus, collegamenti via mare, parcheggi, taxi |
| ♻️ Rifiuti | Calendario raccolta differenziata e glossario "dove lo butto?" |
| 🏖️ Spiagge | Accessi, servizi, note pratiche |
| 🥾 Sentieri | Sentiero degli Dei e percorsi locali |
| 📅 Eventi | Calendario della comunità |

**Principi:** bilingue (IT/EN) · funziona offline · installabile · senza registrazione · senza pubblicità · senza tracciamento · accessibile · dati con fonte e data di aggiornamento.

## Stato del progetto

⚠️ **v0.1.0 — scheletro iniziale.** La struttura funziona; molti contenuti sono segnaposto contrassegnati "da verificare" in attesa di verifica sul campo e con gli uffici competenti. Il progetto nasce dalla società civile ed è progettato per l'adozione da parte del Comune di Positano ai sensi degli artt. 68-69 del CAD (vedi [`publiccode.yml`](publiccode.yml)).

## Provala in locale

Nessuna build necessaria. Serve solo un server statico:

```bash
cd public
python3 -m http.server 8080
# apri http://localhost:8080
```

## Deploy (gratuito)

Vedi [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md) — Cloudflare Pages, banda illimitata sul piano free, build command nessuno, output directory `public`.

## Struttura

```
public/           l'app (HTML/CSS/JS puro, nessuna build)
  data/           i contenuti in JSON bilingue — il cuore del progetto
  icons/          icone (aggiungere icon-192.png, icon-512.png, apple-touch-icon.png)
docs/             roadmap, deploy, fonti dei dati
publiccode.yml    descrittore standard per il riuso nella PA italiana
```

## Da fare subito (v0 → v1)

- [ ] Caricare le icone PNG già pronte (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) in `public/icons/` — da GitHub: *Add file → Upload files* — e aggiungere al `manifest.webmanifest`:
  ```json
  { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ```
- [ ] Verificare sul campo i numeri locali (`public/data/numeri-utili.json`)
- [ ] Calendario rifiuti per zona dall'Ufficio Ambiente
- [ ] Orari bus/traghetti strutturati (accordo con i gestori)
- [ ] Migrazione UI a [Bootstrap Italia](https://italia.github.io/bootstrap-italia/) (design system della PA)
- [ ] Traccia GPX Sentiero degli Dei

## Contribuire

Chiunque può contribuire, anche senza saper programmare: la maggior parte del valore sono i **dati locali verificati**. Leggi [CONTRIBUTING.md](CONTRIBUTING.md) e la [GOVERNANCE.md](GOVERNANCE.md) (il progetto è civico e politicamente neutrale).

## Licenza

[EUPL-1.2](LICENSE) — la licenza open source dell'Unione Europea, pensata anche per il software della pubblica amministrazione. © 2026 i contributori di Positano.app.
