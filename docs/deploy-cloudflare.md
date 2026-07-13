# Deploy su Cloudflare Pages (gratuito, ~5 minuti)

Cloudflare Pages serve siti statici con **banda illimitata anche sul piano gratuito** e HTTPS automatico (obbligatorio per il TLD `.app` e per i service worker).

## Passi

1. Accedi a [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autorizza GitHub e seleziona il repository `positano.app`.
3. Impostazioni di build:
   - **Framework preset**: None
   - **Build command**: *(vuoto — nessuna build)*
   - **Build output directory**: `public`
4. **Save and Deploy**. L'app sarà online su un sottodominio `.pages.dev` in un minuto.
5. Ogni `git push` su `main` pubblica automaticamente; le pull request generano anteprime separate.

## Dominio personalizzato

1. Registra il dominio (es. `positano.app`) — con Cloudflare Registrar la gestione DNS è integrata.
2. Nel progetto Pages: **Custom domains** → **Set up a custom domain** → inserisci il dominio.
3. HTTPS è automatico. Nota: il TLD `.app` è in HSTS preload, funziona **solo** in HTTPS — nessuna configurazione extra necessaria con Cloudflare.

## Verifiche post-deploy

- [ ] L'app si apre e naviga tra le sezioni
- [ ] Lighthouse (Chrome DevTools): PWA installabile, accessibilità ≥ 90
- [ ] Test "Aggiungi alla schermata Home" su un iPhone e un Android reali
- [ ] Modalità aereo dopo la prima visita: l'app deve funzionare offline
