/* Positano.app — i18n minimale (IT/EN) */
(function () {
  'use strict';

  const I18N = {
    it: {
      'a11y.skip': 'Salta al contenuto',
      'app.tagline': 'La guida civica di Positano',
      'nav.home': 'Home', 'nav.emergenze': 'Emergenze', 'nav.trasporti': 'Trasporti',
      'nav.rifiuti': 'Rifiuti', 'nav.eventi': 'Eventi',
      'home.title': 'Benvenuti',
      'home.intro': 'Tutto quello che serve per vivere e visitare Positano, in un unico posto. Gratuita, senza pubblicità, senza tracciamento.',
      'card.emergenze': 'Emergenze e numeri utili', 'card.trasporti': 'Bus, mare e parcheggi',
      'card.rifiuti': 'Raccolta differenziata', 'card.mare': 'Spiagge',
      'card.sentieri': 'Sentieri', 'card.eventi': 'Eventi', 'card.info': 'Il progetto',
      'sec.emergenze': 'Emergenze e numeri utili', 'sec.trasporti': 'Trasporti e parcheggi',
      'sec.rifiuti': 'Rifiuti e raccolta differenziata', 'sec.mare': 'Spiagge',
      'sec.sentieri': 'Sentieri', 'sec.eventi': 'Eventi', 'sec.info': 'Il progetto',
      'rifiuti.glossario': 'Dove lo butto?',
      'rifiuti.search': 'Cerca un rifiuto…',
      'eventi.none': 'Nessun evento in programma al momento.',
      'common.verify': 'Da verificare', 'common.demo': 'Esempio',
      'common.updated': 'Dati aggiornati al', 'common.offline': 'Contenuto non disponibile. Controlla la connessione e riprova.',
      'install.hint': 'Puoi installare questa app sul telefono.', 'install.how': 'Come fare',
      'install.title': "Installa l'app",
      'install.ios': 'iPhone/iPad: apri questa pagina in Safari, tocca il tasto Condividi e poi “Aggiungi alla schermata Home”.',
      'install.android': 'Android: apri il menu del browser (⋮) e scegli “Installa app” o “Aggiungi a schermata Home”.',
      'info.text': 'Positano.app è un bene comune digitale: un progetto civico open source, indipendente e senza scopo di lucro. I dati sono curati da volontari e ogni scheda indica la data di aggiornamento. Il codice è pubblico e chiunque può contribuire.',
      'info.privacy.title': 'Privacy',
      'info.privacy': 'Questa app non richiede registrazione, non usa cookie di profilazione e non traccia gli utenti.',
      'info.version': 'Versione'
    },
    en: {
      'a11y.skip': 'Skip to content',
      'app.tagline': "Positano's civic guide",
      'nav.home': 'Home', 'nav.emergenze': 'Emergency', 'nav.trasporti': 'Transport',
      'nav.rifiuti': 'Waste', 'nav.eventi': 'Events',
      'home.title': 'Welcome',
      'home.intro': 'Everything you need to live in and visit Positano, in one place. Free, ad-free, no tracking.',
      'card.emergenze': 'Emergency & useful numbers', 'card.trasporti': 'Buses, ferries & parking',
      'card.rifiuti': 'Waste & recycling', 'card.mare': 'Beaches',
      'card.sentieri': 'Trails', 'card.eventi': 'Events', 'card.info': 'About',
      'sec.emergenze': 'Emergency & useful numbers', 'sec.trasporti': 'Transport & parking',
      'sec.rifiuti': 'Waste & recycling', 'sec.mare': 'Beaches',
      'sec.sentieri': 'Trails', 'sec.eventi': 'Events', 'sec.info': 'About the project',
      'rifiuti.glossario': 'Where does it go?',
      'rifiuti.search': 'Search an item…',
      'eventi.none': 'No upcoming events at the moment.',
      'common.verify': 'To be verified', 'common.demo': 'Sample',
      'common.updated': 'Data updated on', 'common.offline': 'Content unavailable. Check your connection and try again.',
      'install.hint': 'You can install this app on your phone.', 'install.how': 'How',
      'install.title': 'Install the app',
      'install.ios': 'iPhone/iPad: open this page in Safari, tap Share, then “Add to Home Screen”.',
      'install.android': 'Android: open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.',
      'info.text': 'Positano.app is a digital commons: an independent, non-profit, open source civic project. Data is curated by volunteers and every card shows its last update date. The code is public and anyone can contribute.',
      'info.privacy.title': 'Privacy',
      'info.privacy': 'This app requires no registration, uses no profiling cookies and does not track users.',
      'info.version': 'Version'
    }
  };

  let lang = null;
  try { lang = localStorage.getItem('lang'); } catch (e) { /* storage non disponibile */ }
  if (lang !== 'it' && lang !== 'en') {
    lang = (navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  function t(key) {
    return (I18N[lang] && I18N[lang][key]) || I18N.it[key] || key;
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    const search = document.getElementById('rifiuti-search');
    if (search) search.placeholder = t('rifiuti.search');
    const it = document.getElementById('lang-it');
    const en = document.getElementById('lang-en');
    if (it) it.setAttribute('aria-pressed', String(lang === 'it'));
    if (en) en.setAttribute('aria-pressed', String(lang === 'en'));
  }

  function setLang(l) {
    lang = (l === 'en') ? 'en' : 'it';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignora */ }
    applyI18n();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.PA_I18N = { t: t, setLang: setLang, applyI18n: applyI18n, getLang: function () { return lang; } };
})();
