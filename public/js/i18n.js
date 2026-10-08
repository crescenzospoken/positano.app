/* Positano.app · testi dell'interfaccia (IT/EN). I contenuti stanno in data/*.json. */
(function () {
  'use strict';

  const I18N = {
    it: {
      'a11y.skip': 'Salta al contenuto', 'a11y.nav': 'Sezioni', 'a11y.onpage': 'In questa pagina', 'a11y.back': 'Indietro',
      'app.tagline': 'La guida civica di Positano',
      'nav.home': 'Oggi', 'nav.emergenze': 'Emergenze', 'nav.muoversi': 'Muoversi', 'nav.rifiuti': 'Rifiuti', 'nav.tutto': 'Tutto',
      'sec.emergenze': 'Emergenze e salute', 'sec.muoversi': 'Arrivare e muoversi', 'sec.rifiuti': 'Rifiuti e raccolta',
      'sec.mare': 'Spiagge', 'sec.sentieri': 'Sentieri', 'sec.eventi': 'Eventi e feste', 'sec.luoghi': 'Da vedere',
      'sec.comune': 'Comune, uffici e regole', 'sec.info': 'Il progetto', 'sec.tutto': 'Tutta la guida',
      'desc.emergenze': '112, guardia medica, farmacia, ospedale', 'desc.muoversi': 'Bus, traghetti, navetta, parcheggi, ZTL',
      'desc.rifiuti': 'Cosa si ritira oggi e dove si butta', 'desc.mare': 'Come si arriva, gradini, servizi',
      'desc.sentieri': 'Sentiero degli Dei e scalinate', 'desc.eventi': 'Feste, ricorrenze, appuntamenti',
      'desc.luoghi': 'Chiese, museo, torri, frazioni', 'desc.comune': 'Orari, contatti, ordinanze, segnalazioni',
      'desc.info': 'Chi la fa, privacy, come contribuire',
      'home.hello.morning': 'Buongiorno', 'home.hello.afternoon': 'Buon pomeriggio', 'home.hello.evening': 'Buonasera',
      'home.today': 'Oggi a Positano', 'home.sunrise': 'Alba', 'home.sunset': 'Tramonto',
      'home.waste.today': 'Rifiuti: stasera si espone', 'home.waste.none': 'Stasera non si espone niente',
      'home.departures': 'Prossime partenze', 'home.plates.title': 'Oggi targhe alterne sulla SS163',
      'home.plates.even': 'Oggi è un giorno pari: dalle {h} non circolano le auto con targa che finisce con cifra pari.',
      'home.plates.odd': 'Oggi è un giorno dispari: dalle {h} non circolano le auto con targa che finisce con cifra dispari.',
      'home.events': 'Prossimi appuntamenti', 'home.events.all': 'Tutti gli eventi',
      'home.alerts': 'Avvisi', 'home.sections': 'La guida', 'home.sos': 'Emergenza? Chiama il 112',
      'home.sos.sub': 'Numero unico europeo, gratuito, anche senza credito',
      'home.season.low': 'Bassa stagione: molti servizi turistici e traghetti sono ridotti o fermi.',
      'home.season.high': 'Alta stagione: strade e bus affollati, conviene muoversi presto.',
      'home.season.mid': 'Media stagione: traghetti attivi con orari ridotti.',
      'common.verify': 'Da verificare', 'common.demo': 'Esempio', 'common.source': 'Fonte',
      'common.updated': 'Dati aggiornati al', 'common.offline': 'Contenuto non disponibile. Controlla la connessione e riprova.',
      'common.offlinebar': 'Sei offline: stai vedendo i dati salvati sul telefono.',
      'common.call': 'Chiama', 'common.map': 'Mappa', 'common.web': 'Sito', 'common.mail': 'Email', 'common.pec': 'PEC',
      'common.share': 'Condividi', 'common.close': 'Chiudi', 'common.copied': 'Link copiato',
      'common.hours': 'Orari', 'common.active': 'Attivo in questo periodo', 'common.inactive': 'Fermo in questo periodo',
      'common.today': 'oggi', 'common.tomorrow': 'domani', 'common.indays': 'fra {n} giorni',
      'common.estimated': 'data dell\'anno scorso, da confermare', 'common.checked': 'consultata il',
      'eventi.usually': 'di solito {d}', 'eventi.yearly': 'Ogni anno', 'eventi.yearly.note': 'Date delle ultime edizioni: il programma nuovo esce di solito poche settimane prima.',
      'common.report': 'Hai trovato un errore? Segnalalo',
      'search.open': 'Cerca', 'search.title': 'Cerca nella guida', 'search.ph': 'Farmacia, bus, vetro, Fornillo…',
      'search.none': 'Nessun risultato. Prova con un\'altra parola.', 'search.hint': 'Cerca fra numeri utili, trasporti, rifiuti, spiagge, sentieri, eventi e uffici.',
      'rifiuti.glossario': 'Dove lo butto?', 'rifiuti.search': 'Cerca un rifiuto…', 'rifiuti.week': 'Cosa si espone, sera per sera',
      'rifiuti.tonight': 'Stasera', 'rifiuti.nothing': 'niente', 'rifiuti.none': 'Nessun rifiuto trovato.',
      'eventi.none': 'Nessun evento in programma al momento.', 'eventi.recurring': 'Ogni anno',
      'install.title': 'Installa l\'app sul telefono',
      'install.ios': 'iPhone: apri in Safari, tocca Condividi e poi «Aggiungi alla schermata Home».',
      'install.android': 'Android: menu del browser (⋮) e poi «Installa app».',
      'install.btn': 'Installa',
      'info.text': 'Positano.app è un bene comune digitale: una guida civica open source, gratuita, senza pubblicità e senza scopo di lucro, pensata per chi vive a Positano e per chi la visita. Ogni scheda dice da dove viene il dato e quando è stato aggiornato.',
      'info.neutral': 'È neutrale: non promuove attività commerciali, partiti o persone. Hotel, ristoranti e prenotazioni restano fuori.',
      'info.ai': 'Molti testi sono stati raccolti e scritti con l\'aiuto dell\'intelligenza artificiale a partire da fonti pubbliche, e sono in corso di verifica umana: le voci non ancora confermate hanno l\'etichetta «Da verificare». In caso di dubbio fanno fede gli atti e il sito del Comune.',
      'info.privacy.title': 'Privacy',
      'info.privacy': 'Nessuna registrazione, nessun cookie, nessun sistema di statistiche o di tracciamento. L\'app non tratta dati personali conferiti dagli utenti; il server che la ospita riceve, come ogni sito, l\'indirizzo IP della richiesta. Lingua e preferenze restano solo sul tuo telefono.',
      'info.offline.title': 'Funziona anche senza rete',
      'info.offline': 'Dopo la prima apertura tutta la guida resta sul telefono: numeri, orari e mappe testuali si consultano anche in spiaggia o sul sentiero senza campo.',
      'info.contribute.title': 'Contribuire',
      'info.contribute': 'I dati sono file aperti: chiunque può proporre una correzione, citando la fonte.',
      'info.version': 'Versione', 'info.code': 'Codice sorgente (EUPL-1.2)'
    },
    en: {
      'a11y.skip': 'Skip to content', 'a11y.nav': 'Sections', 'a11y.onpage': 'On this page', 'a11y.back': 'Back',
      'app.tagline': 'Positano\'s civic guide',
      'nav.home': 'Today', 'nav.emergenze': 'Emergency', 'nav.muoversi': 'Transport', 'nav.rifiuti': 'Waste', 'nav.tutto': 'All',
      'sec.emergenze': 'Emergency & health', 'sec.muoversi': 'Getting here & around', 'sec.rifiuti': 'Waste & recycling',
      'sec.mare': 'Beaches', 'sec.sentieri': 'Trails', 'sec.eventi': 'Events & festivals', 'sec.luoghi': 'Things to see',
      'sec.comune': 'Town hall, offices & rules', 'sec.info': 'About', 'sec.tutto': 'The whole guide',
      'desc.emergenze': '112, out-of-hours doctor, pharmacy, hospital', 'desc.muoversi': 'Buses, ferries, shuttle, parking, restricted zones',
      'desc.rifiuti': 'Today\'s collection and what goes where', 'desc.mare': 'How to get there, steps, facilities',
      'desc.sentieri': 'Path of the Gods and stairways', 'desc.eventi': 'Festivals, traditions, dates',
      'desc.luoghi': 'Churches, museum, towers, villages', 'desc.comune': 'Hours, contacts, local rules, reporting',
      'desc.info': 'Who makes it, privacy, how to help',
      'home.hello.morning': 'Good morning', 'home.hello.afternoon': 'Good afternoon', 'home.hello.evening': 'Good evening',
      'home.today': 'Today in Positano', 'home.sunrise': 'Sunrise', 'home.sunset': 'Sunset',
      'home.waste.today': 'Waste: put out tonight', 'home.waste.none': 'Nothing to put out tonight',
      'home.departures': 'Next departures', 'home.plates.title': 'Odd-even plates on the SS163 today',
      'home.plates.even': 'Today is an even date: from {h} cars with plates ending in an even digit cannot drive.',
      'home.plates.odd': 'Today is an odd date: from {h} cars with plates ending in an odd digit cannot drive.',
      'home.events': 'Coming up', 'home.events.all': 'All events',
      'home.alerts': 'Notices', 'home.sections': 'The guide', 'home.sos': 'Emergency? Call 112',
      'home.sos.sub': 'Free European emergency number, works without credit',
      'home.season.low': 'Low season: many tourist services and ferries are reduced or suspended.',
      'home.season.high': 'High season: roads and buses are crowded, set off early.',
      'home.season.mid': 'Shoulder season: ferries run on reduced timetables.',
      'common.verify': 'To be verified', 'common.demo': 'Sample', 'common.source': 'Source',
      'common.updated': 'Data updated on', 'common.offline': 'Content unavailable. Check your connection and try again.',
      'common.offlinebar': 'You are offline: showing the data saved on your phone.',
      'common.call': 'Call', 'common.map': 'Map', 'common.web': 'Website', 'common.mail': 'Email', 'common.pec': 'Certified email',
      'common.share': 'Share', 'common.close': 'Close', 'common.copied': 'Link copied',
      'common.hours': 'Hours', 'common.active': 'Running now', 'common.inactive': 'Not running at this time of year',
      'common.today': 'today', 'common.tomorrow': 'tomorrow', 'common.indays': 'in {n} days',
      'common.estimated': 'last year\'s date, to be confirmed', 'common.checked': 'checked',
      'eventi.usually': 'usually {d}', 'eventi.yearly': 'Every year', 'eventi.yearly.note': 'Dates of the latest editions: the new programme usually comes out a few weeks before.',
      'common.report': 'Found a mistake? Let us know',
      'search.open': 'Search', 'search.title': 'Search the guide', 'search.ph': 'Pharmacy, bus, glass, Fornillo…',
      'search.none': 'No results. Try another word.', 'search.hint': 'Search useful numbers, transport, waste, beaches, trails, events and offices.',
      'rifiuti.glossario': 'Where does it go?', 'rifiuti.search': 'Search an item…', 'rifiuti.week': 'What to put out, evening by evening',
      'rifiuti.tonight': 'Tonight', 'rifiuti.nothing': 'nothing', 'rifiuti.none': 'No item found.',
      'eventi.none': 'No upcoming events at the moment.', 'eventi.recurring': 'Every year',
      'install.title': 'Install the app on your phone',
      'install.ios': 'iPhone: open in Safari, tap Share, then “Add to Home Screen”.',
      'install.android': 'Android: browser menu (⋮), then “Install app”.',
      'install.btn': 'Install',
      'info.text': 'Positano.app is a digital commons: a free, open source, ad-free, non-profit civic guide for people who live in or visit Positano. Every card tells you where its data comes from and when it was last updated.',
      'info.neutral': 'It is neutral: it does not promote businesses, parties or individuals. Hotels, restaurants and bookings are left out.',
      'info.ai': 'Many texts were gathered and written with the help of artificial intelligence from public sources and are being checked by people: entries not yet confirmed are labelled “To be verified”. When in doubt, official acts and the Town Hall website prevail.',
      'info.privacy.title': 'Privacy',
      'info.privacy': 'No sign-up, no cookies, no analytics or tracking. The app processes no personal data provided by users; like any website, the hosting server receives the IP address of each request. Language and preferences stay on your phone only.',
      'info.offline.title': 'Works without signal',
      'info.offline': 'After the first visit the whole guide stays on your phone: numbers, timetables and directions work on the beach or on the trail with no signal.',
      'info.contribute.title': 'Contribute',
      'info.contribute': 'The data are open files: anyone can suggest a correction, citing the source.',
      'info.version': 'Version', 'info.code': 'Source code (EUPL-1.2)'
    }
  };

  let lang = null;
  try { lang = localStorage.getItem('lang'); } catch (e) { /* storage non disponibile */ }
  if (lang !== 'it' && lang !== 'en') {
    lang = (navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  function t(key, vars) {
    let s = (I18N[lang] && I18N[lang][key]) || I18N.it[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-label]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-label'))); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    const btn = document.getElementById('lang-toggle');
    if (btn) {
      const other = lang === 'it' ? 'en' : 'it';
      btn.textContent = other.toUpperCase();
      btn.setAttribute('lang', other);
      btn.setAttribute('aria-label', other === 'en' ? 'EN, switch to English' : 'IT, passa all\'italiano');
    }
  }

  function setLang(l) {
    lang = (l === 'en') ? 'en' : 'it';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignora */ }
    applyI18n();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.PA_I18N = { t: t, setLang: setLang, applyI18n: applyI18n, getLang: function () { return lang; } };
})();
