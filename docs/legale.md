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
- Nessun account e nessun cookie per chi usa l'app. Le statistiche (v0.4) sono solo contatori per giorno, sezione e lingua: niente IP, niente identificativi, niente cookie, quindi nessun consenso necessario (art. 122 Codice privacy, linee guida Garante 10/6/2021 sui cookie analitici anonimi). Il registro errori salva solo messaggio tecnico e pagina. I caratteri sono ospitati nell'app (niente Google Fonts, che manda l'IP a Google: LG München, 20/1/2022). Meteo e allerte li scarica il server, non il telefono.
- L'IP della richiesta arriva comunque al server che ospita l'app (CGUE C-582/14, Breyer): l'informativa lo dice. Formula corretta: «non trattiamo dati personali conferiti dagli utenti».
- Il pannello usa un solo cookie tecnico per chi accede; password salvate solo come hash (PBKDF2), blocco dopo 8 tentativi.
- Notifiche push (v0.4): facoltative, chieste dal browser con il suo consenso esplicito. Si conservano solo l'indirizzo tecnico creato dal browser (pseudonimo) e la zona scelta; si cancellano con «Disattiva» o quando il servizio push le dà per scadute. Gli invii passano dai servizi push di Google, Apple o Mozilla (cifrati end-to-end, RFC 8291: loro non leggono il testo). ⚖️ Con l'adozione vanno nell'informativa e nel registro dei trattamenti (bozze in `docs/adozione/`).
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
- v0.4 usa l'AI (Workers AI di Cloudflare, modello Llama aperto, nessun dato personale) in tre punti, sempre dichiarati: bozza di avviso da un post del Comune (la redazione controlla e pubblica: decide una persona), traduzione inglese quando manca («Traduzione automatica» sotto il testo), spiegazione breve degli atti dell'Albo («In breve (automatico)», con l'avvertenza che fa fede l'atto). Nessuna decisione automatizzata su persone (art. 22 GDPR non si applica).

## 10. Stemma
- Lo stemma è un segno del Comune: nell'app firma solo i contenuti dell'ente e il generatore di post per i canali del Comune. Non è il marchio dell'app finché un atto non la adotta.
- Nota: lo stemma del sito istituzionale ha lo scudo argento; quello dei preset Canva lo ha rosso. Va scelta la versione ufficiale (statuto comunale).

## 11. Fonti automatiche: solo istituzionali o sostituibili (v0.5)
- **Albo pretorio**: il Worker legge ogni 2 ore la pagina pubblica di consultazione del portale del Comune e ne conserva un archivio proprio (numero di registro, oggetto, categoria, date). Non scarica allegati. Non conserva le categorie che possono contenere nomi di privati: pubblicazioni di matrimonio, depositi alla casa comunale, elenchi delle opere abusive, determinazioni.
- Nell'app gli atti compaiono **solo finché sono in pubblicazione** (art. 124 TUEL; linee guida Garante 2014 sulla trasparenza: niente archivi paralleli di dati personali oltre i termini). Restano consultabili delibere e convocazioni del Consiglio comunale, atti degli organi di indirizzo politico pubblicati per legge (d.lgs. 33/2013, art. 23).
- **Calendari di feste ed eventi**: collegati con un semplice link .ics pubblico, inserito e sostituibile dal pannello. Nessun legame con account o sistemi di terzi.
- **Proposte di avviso**: dai feed pubblici del sito del Comune o da testi incollati dalla redazione.
- **Nessun collegamento con Super Agenda** (strumento del gruppo di maggioranza): la v0.4 ne usava un ponte, rimosso nella v0.5 su indicazione del curatore per evitare ogni commistione con materiale politico. L'archivio dell'Albo è stato avviato una tantum con i soli metadati pubblici dell'Albo già raccolti (oggetto, numero, date delle categorie ammesse), che sono atti del Comune.
- Tutto il codice è aperto (EUPL-1.2): chiunque può verificare cosa si legge e cosa si conserva.
