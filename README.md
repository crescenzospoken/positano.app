# Positano.app

**La guida civica di Positano** — un bene comune digitale, open source, per chi a Positano vive e per chi la visita.

🌐 **App online:** [positano-app.crescy.workers.dev](https://positano-app.crescy.workers.dev) *(in attesa del dominio positano.app)*

> 🇬🇧 *Positano.app is an open source civic Progressive Web App for the town of Positano (Amalfi Coast, Italy): emergency numbers, transport, waste collection, beaches, trails and events, in Italian and English, offline-first, with no ads and no tracking. Licensed under EUPL-1.2. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).*

## Cos'è

Una **PWA** (Progressive Web App) che raccoglie in un unico posto le informazioni utili della vita quotidiana e della visita a Positano:

| Sezione | Contenuto |
|---|---|
| Oggi | La home sa che ore sono: alba e tramonto, avvisi attivi, rifiuti da esporre stasera, prossime partenze, targhe alterne, prossimi eventi |
| Emergenze e salute | 112, guardia medica, farmacia, ospedale, forze dell'ordine, aree di attesa della protezione civile |
| Arrivare e muoversi | Bus SITA e interno, traghetti, taxi a tariffa fissa, ZTL, targhe alterne, parcheggi |
| Rifiuti | Cosa si espone sera per sera e glossario «dove lo butto?» |
| Spiagge | Accessi, gradini, Bandiera Blu, sicurezza in acqua |
| Sentieri | Sentieri CAI con numero, lunghezza, dislivello e difficoltà |
| Eventi | Feste e appuntamenti, con le ricorrenze annuali |
| Da vedere | Chiesa, MAR, frazioni, torri, storia |
| Comune | Uffici, orari, PEC, pagoPA, regole, a chi segnalare cosa |

**Principi:** bilingue (IT/EN) · funziona offline · installabile · senza registrazione · senza pubblicità · senza tracciamento · accessibile · dati con fonte e data di aggiornamento.

## Stato del progetto

⚠️ **v0.2.0 · prototipo con dati reali.** I contenuti sono stati raccolti da fonti pubbliche, ognuno con fonte e data; quelli non confermati da fonte primaria hanno l'etichetta «Da verificare» (elenco in [`docs/fonti-dati.md`](docs/fonti-dati.md)). Molti testi sono stati scritti con l'aiuto dell'intelligenza artificiale e vanno rivisti da una persona prima di un lancio pubblico. Audit della versione in [`docs/audit-2026-10.md`](docs/audit-2026-10.md). Il progetto nasce dalla società civile ed è progettato per l'adozione da parte del Comune di Positano ai sensi degli artt. 68-69 del CAD (vedi [`publiccode.yml`](publiccode.yml)).

## Test

```bash
node --test tests/*.test.mjs
```

## Provala in locale

Nessuna build necessaria. Serve solo un server statico:

```bash
cd public
python3 -m http.server 8080
# apri http://localhost:8080
```

## Deploy

L'app è servita come **asset statici su Cloudflare Workers** (piano gratuito): la configurazione è in `public/wrangler.jsonc` e **ogni push su `main` va online automaticamente**. Guida e dominio personalizzato: [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md).

## Struttura

```
public/           l'app (HTML/CSS/JS puro, nessuna build)
  data/           i contenuti in JSON bilingue — il cuore del progetto
  icons/          icone dell'app (SVG + PNG)
  wrangler.jsonc  configurazione deploy Cloudflare Workers
docs/             roadmap, deploy, fonti dei dati
publiccode.yml    descrittore standard per il riuso nella PA italiana
```

## Da fare subito (v0 → v1)

- [x] Numeri locali, trasporti, rifiuti, spiagge, sentieri, eventi da fonti pubbliche (v0.2)
- [ ] Verificare con gli uffici i 13 punti aperti in `docs/fonti-dati.md`
- [ ] Orari completi bus e traghetti come dati (accordo con i gestori, GTFS)
- [ ] Adottare il Design system .italia con [Dev Kit Italia](https://italia.github.io/dev-kit-italia) (Web Components nativi, senza bundler) quando uscirà dalla beta — vedi [#2](../../issues/2)
- [ ] Traccia GPX Sentiero degli Dei

## Contribuire

Chiunque può contribuire, anche senza saper programmare: la maggior parte del valore sono i **dati locali verificati**. Leggi [CONTRIBUTING.md](CONTRIBUTING.md) e la [GOVERNANCE.md](GOVERNANCE.md) (il progetto è civico e politicamente neutrale).

## Licenza

[EUPL-1.2](LICENSE) — la licenza open source dell'Unione Europea, pensata anche per il software della pubblica amministrazione. © 2026 i contributori di Positano.app.
