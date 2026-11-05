# Positano.app: quadro legale

Perché un'app civica come questa resta inattaccabile, oggi da progetto civico e domani da servizio del Comune. Sintesi di lavoro, non parere legale: i punti segnati ⚖️ vanno confermati dal Segretario comunale.

## 1. Cosa fa e cosa non fa
- **Informa e indirizza, non eroga.** Pratiche, pagamenti, certificati, istanze restano sui canali ufficiali (sito del Comune, ANPR, pagoPA, SUE, SUAP, PEC). L'app porta il cittadino alla pagina giusta: nessun procedimento amministrativo passa da qui, quindi niente obblighi di protocollo, firma o conservazione.
- **L'atto con valore legale è quello dell'Albo pretorio.** L'app lo cita e lo collega; l'avviso in app è una notizia di servizio, come un post Instagram.
- **Ogni dato ha fonte e data.** Quello non confermato porta l'etichetta «Da verificare».

## 2. Flessibilità senza uffici in mezzo
- La home cambia da sola (inverno, Natale, estate, feste, allerta) o dal pannello in un minuto. Un avviso si pubblica, si aggiorna e si chiude dal telefono, con la storia visibile.
- È lo stesso livello di responsabilità dei canali social del Comune: comunicazione istituzionale, non atti. Chi pubblica è identificato, ogni modifica è nel registro (chi, cosa, quando, prima e dopo).
- ⚖️ Se il Comune adotta l'app, una delibera di Giunta indica l'ufficio responsabile dei contenuti e chi può accedere al pannello (come per i social).

## 3. Privacy (GDPR)
- Nessun account, nessun cookie, nessuna statistica per chi usa l'app. I caratteri sono ospitati nell'app (niente Google Fonts, che manda l'IP a Google: LG München, 20/1/2022). Meteo e allerte li scarica il server, non il telefono.
- L'IP della richiesta arriva comunque al server che ospita l'app (CGUE C-582/14, Breyer): l'informativa lo dice. Formula corretta: «non trattiamo dati personali conferiti dagli utenti».
- Il pannello usa un solo cookie tecnico per chi accede; password salvate solo come hash (PBKDF2), blocco dopo 8 tentativi.
- Elenco dei locali aperti: dati di attività economiche comunicati da loro stesse; nessun cellulare personale.

## 4. Parità di trattamento
- Nessun hotel, ristorante o negozio promosso. L'unica eccezione è il calendario delle aperture invernali, che è servizio pubblico (lo pubblica anche il Comune): tutti i locali che comunicano le date, per zona e in ordine alfabetico, senza foto, giudizi o posizioni a pagamento.

## 5. Accessibilità (L. 4/2004, linee guida AgID)
- Obiettivo WCAG 2.1 AA, verificato a ogni versione (axe-core e Lighthouse 100, prove su telefono). ⚖️ Con l'adozione serve la dichiarazione di accessibilità sul modello AgID e il meccanismo di feedback (già presente: link in fondo alle pagine).

## 6. Software libero e riuso (CAD artt. 68-69)
- Codice EUPL-1.2, `publiccode.yml` pronto per Developers Italia. Il Comune può adottarlo senza gara né convenzione: la licenza è il titolo giuridico. ⚖️ Serve la valutazione comparativa ex art. 68 (Allegato E delle linee guida AgID) e il trasferimento del repository a un'organizzazione GitHub del Comune.
- Donazione: non serve il notaio. Il codice è già pubblico con licenza aperta.
- Dati prodotti dal progetto in CC BY 4.0; dati di terzi con la loro licenza (Protezione Civile e Open-Meteo CC BY 4.0, citati in app).

## 7. Hosting
- Finché è un progetto civico: Cloudflare (gratuito) va bene.
- ⚖️ Da servizio del Comune vale il Regolamento ACN sul cloud: servizi qualificati. Cloudflare non risulta qualificato; l'app è statica più un piccolo database, quindi si sposta in giornata su un servizio qualificato (es. lo stesso fornitore del sito comunale). Il codice non cambia.

## 8. Conflitto d'interessi e trasparenza
- Il curatore è consigliere tecnico-amministrativo a titolo gratuito: l'adozione è a titolo gratuito e va motivata e pubblicata in Amministrazione trasparente (comunicato ANAC 5/6/2024), con dichiarazione di assenza di conflitto e separazione netta da eventuali futuri affidamenti di manutenzione.

## 9. Intelligenza artificiale (AI Act, art. 50)
- Molti testi sono stati preparati con l'AI e sono rivisti da persone: l'app lo dichiara nella pagina «Il progetto». I contenuti pubblicati dal pannello li scrive e li firma chi accede.

## 10. Stemma
- Lo stemma è un segno del Comune: nell'app firma solo i contenuti dell'ente e il generatore di post per i canali del Comune. Non è il marchio dell'app finché un atto non la adotta.
- Nota: lo stemma del sito istituzionale ha lo scudo argento; quello dei preset Canva lo ha rosso. Va scelta la versione ufficiale (statuto comunale).
