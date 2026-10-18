/* =========================================================
   Guichet Courriel — logique de l'outil (démonstration)
   Aucun envoi réseau : ni fetch, ni formulaire soumis.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EXAMPLE_DOMAIN = 'mon-activite.dz';
  var STORE_KEY = 'guichet-courriel-v1';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- État + stockage local ---------------- */
  var DEFAULT_STATE = {
    tab: 'adresses',
    activite: '', domaine: '',
    roles: { contact: true, commercial: true, facturation: true, recrutement: true },
    people: [{ prenom: '', nom: '' }],
    format: 'prenom',
    situation: '',
    sig: { nom: '', fonction: '', activite: '', tel: '', ville: '', email: '', whatsapp: false, site: true, layout: 'classique', color: '#6a4cff' },
    sim: { letter: 'vraie', spf: true, dkim: true, dmarc: 'none' },
    checklist: {}
  };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var state = clone(DEFAULT_STATE);

  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        Object.keys(DEFAULT_STATE).forEach(function (k) {
          if (s[k] === undefined) return;
          if (typeof DEFAULT_STATE[k] === 'object' && !Array.isArray(DEFAULT_STATE[k])) {
            state[k] = Object.assign(clone(DEFAULT_STATE[k]), s[k]);
          } else { state[k] = s[k]; }
        });
        if (!Array.isArray(state.people) || !state.people.length) state.people = [{ prenom: '', nom: '' }];
      }
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
    }, 250);
  }

  /* ---------------- Tampon postal (SVG) ---------------- */
  var MONTHS = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
  var pmCount = 0;
  function postmark(top, bottom, waves) {
    var id = 'pm' + (++pmCount);
    var d = new Date();
    var day = String(d.getDate()).padStart(2, '0') + ' ' + MONTHS[d.getMonth()];
    var w = waves ? 270 : 124;
    var wavesSvg = '';
    if (waves) {
      for (var i = 0; i < 5; i++) {
        var y = 30 + i * 15;
        var p = 'M112 ' + y;
        for (var x = 0; x < 7; x++) p += ' q10 ' + (x % 2 ? 7 : -7) + ' 20 0';
        wavesSvg += '<path d="' + p + '"/>';
      }
    }
    return '<svg viewBox="0 0 ' + w + ' 124" focusable="false" aria-hidden="true">' +
      '<defs><path id="' + id + 't" d="M20 62 A42 42 0 0 1 104 62"/><path id="' + id + 'b" d="M13 62 A49 49 0 0 0 111 62"/></defs>' +
      '<g fill="none" stroke="currentColor"><circle cx="62" cy="62" r="57" stroke-width="3.5"/><circle cx="62" cy="62" r="33" stroke-width="1.6"/>' +
      '<g stroke-width="3" stroke-linecap="round">' + wavesSvg + '</g></g>' +
      '<g fill="currentColor" font-family="Manrope, Arial, sans-serif" font-weight="800">' +
      '<text font-size="11.5" letter-spacing="2.4"><textPath href="#' + id + 't" startOffset="50%" text-anchor="middle">' + esc(top) + '</textPath></text>' +
      '<text font-size="11.5" letter-spacing="2.4"><textPath href="#' + id + 'b" startOffset="50%" text-anchor="middle">' + esc(bottom) + '</textPath></text>' +
      '<text x="62" y="57" font-size="13" text-anchor="middle">' + day + '</text>' +
      '<text x="62" y="80" font-size="13" text-anchor="middle">' + d.getFullYear() + '</text>' +
      '<path d="M42 65h40" stroke="currentColor" stroke-width="1.2"/></g></svg>';
  }

  /* ---------------- Nettoyage du domaine ---------------- */
  var FREE_DOMAINS = ['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.fr', 'ymail.com', 'hotmail.com', 'hotmail.fr',
    'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'gmx.com', 'gmx.fr',
    'proton.me', 'protonmail.com', 'laposte.net', 'orange.fr', 'free.fr', 'yandex.com', 'mail.com'];

  function stripAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function cleanDomain(raw) {
    var notes = [];
    var s = String(raw || '');
    if (!s.trim()) return { value: '', notes: notes, error: null, empty: true };
    if (s !== s.trim()) { notes.push('espaces autour retirés'); s = s.trim(); }
    if (/[A-ZÀ-Ý]/.test(s)) { notes.push('majuscules passées en minuscules'); }
    s = s.toLowerCase();
    var proto = s.match(/^[a-z][a-z0-9+.-]*:\/\//);
    if (proto) { notes.push('« ' + proto[0] + ' » retiré'); s = s.slice(proto[0].length); }
    else if (/^\/\//.test(s)) { notes.push('« // » retiré'); s = s.slice(2); }
    if (s.indexOf('@') !== -1) { notes.push('partie avant « @ » retirée'); s = s.slice(s.lastIndexOf('@') + 1); }
    var cut = s.search(/[\/?#]/);
    if (cut !== -1) { if (s.slice(cut).replace(/\/+$/, '')) notes.push('chemin après le domaine retiré'); s = s.slice(0, cut); }
    if (/:\d*$/.test(s)) { notes.push('port retiré'); s = s.replace(/:\d*$/, ''); }
    if (/^www\d*\./.test(s)) { notes.push('« www. » retiré'); s = s.replace(/^www\d*\./, ''); }
    var noAcc = stripAccents(s);
    if (noAcc !== s) { notes.push('accents remplacés'); s = noAcc; }
    if (/\s/.test(s)) { notes.push('espaces remplacés par des tirets'); s = s.replace(/\s+/g, '-'); }
    if (/_/.test(s)) { notes.push('« _ » remplacé par « - »'); s = s.replace(/_+/g, '-'); }
    if (/,/.test(s)) { notes.push('virgule lue comme un point'); s = s.replace(/,/g, '.'); }
    if (/\.$/.test(s)) { s = s.replace(/\.+$/, ''); notes.push('point final retiré'); }
    if (/^\./.test(s)) { s = s.replace(/^\.+/, ''); notes.push('point initial retiré'); }

    var res = { value: s, notes: notes, error: null, fix: null };
    if (!s) { res.error = 'Il ne reste rien de lisible : saisissez un nom de domaine, par exemple « ' + EXAMPLE_DOMAIN + ' ».'; return res; }
    var bad = s.replace(/[a-z0-9.-]/g, '');
    if (bad) {
      var uniq = Array.from(new Set(bad.split(''))).slice(0, 5).join(' ');
      res.error = /[^\x00-\x7F]/.test(bad)
        ? 'Caractères non latins détectés (' + uniq + ') : saisissez le domaine en lettres latines, chiffres et tirets. Les domaines en écriture arabe existent, à valider avec votre bureau d\'enregistrement.'
        : 'Caractères non autorisés dans un nom de domaine : ' + uniq + '. Gardez lettres, chiffres, tirets et points.';
      return res;
    }
    if (s.indexOf('.') === -1) {
      res.error = 'Il manque l\'extension : un domaine se termine par « .dz », « .com », etc.';
      res.fix = s.replace(/^-+|-+$/g, '') + '.dz';
      return res;
    }
    if (/\.\./.test(s)) { res.error = 'Deux points se suivent : il manque un morceau du domaine.'; res.fix = s.replace(/\.{2,}/g, '.'); return res; }
    var labels = s.split('.');
    for (var i = 0; i < labels.length; i++) {
      if (/^-|-$/.test(labels[i])) {
        res.error = 'Un morceau du domaine commence ou finit par un tiret (« ' + labels[i] + ' ») : ce n\'est pas autorisé.';
        res.fix = labels.map(function (l) { return l.replace(/^-+|-+$/g, ''); }).join('.');
        return res;
      }
    }
    for (var j = 0; j < labels.length; j++) {
      if (labels[j].length > 63) { res.error = 'Un morceau du domaine dépasse 63 caractères : c\'est trop long pour un nom de domaine, et surtout impossible à dicter.'; return res; }
    }
    var tld = labels[labels.length - 1];
    if (!/^[a-z]{2,}$/.test(tld)) {
      res.error = 'L\'extension « .' + tld + ' » n\'est pas valide : elle doit contenir au moins deux lettres (ex. « .dz », « .com »).';
      return res;
    }
    if (FREE_DOMAINS.indexOf(s) !== -1) {
      res.error = 'Ce domaine appartient à un service de messagerie gratuite, pas à vous. Une adresse professionnelle utilise votre propre nom de domaine. Pas encore de domaine ? Utilisez l\'idée proposée à partir du nom de l\'activité.';
      res.free = true;
      return res;
    }
    return res;
  }

  function slug(s, sep) {
    return stripAccents(String(s || '').toLowerCase())
      .replace(/['’`´]/g, '')
      .replace(/[^a-z0-9]+/g, sep === undefined ? '-' : sep)
      .replace(/^-+|-+$/g, '');
  }

  /* ---------------- Adresses ---------------- */
  var ROLE_INFO = {
    contact: { label: 'Demandes générales', use: 'La porte d\'entrée : pied de page, page contact, mentions légales.' },
    commercial: { label: 'Rôle · ventes', use: 'Devis et prospects. Adresse de rôle : elle reste si la personne change.' },
    facturation: { label: 'Rôle · factures', use: 'Factures et paiements. Survit aux départs, comme toutes les adresses de rôle.' },
    recrutement: { label: 'Rôle · candidatures', use: 'Candidatures. Reste à l\'entreprise quand une personne part.' }
  };
  var ROLE_ORDER = ['contact', 'commercial', 'facturation', 'recrutement'];

  var current = { domain: EXAMPLE_DOMAIN, isExample: true, list: [] };

  function personLocal(p, fmt) {
    var pr = slug(p.prenom), nm = slug(p.nom);
    if (!pr && !nm) return '';
    if (fmt === 'prenom') return pr || nm;
    if (fmt === 'prenom.nom') return [pr, nm].filter(Boolean).join('.');
    if (fmt === 'p.nom') return pr && nm ? pr.charAt(0) + '.' + nm : (nm || pr);
    return pr || nm;
  }

  function spell(addr) {
    return addr.split(/([@.\-])/).filter(Boolean).map(function (t) {
      if (t === '@') return 'arobase';
      if (t === '.') return 'point';
      if (t === '-') return 'tiret';
      if (t.length <= 3 && !/[aeiouy]/.test(t)) return t.split('').join(' ');
      return t;
    }).join(' · ');
  }

  function computeAddresses() {
    var c = cleanDomain(state.domaine);
    var domain = (!c.empty && !c.error) ? c.value : EXAMPLE_DOMAIN;
    var list = [];
    ROLE_ORDER.forEach(function (r) {
      if (state.roles[r]) list.push({ kind: 'role', role: r, local: r, addr: r + '@' + domain, label: ROLE_INFO[r].label, use: ROLE_INFO[r].use });
    });
    var seen = {};
    state.people.forEach(function (p, i) {
      var local = personLocal(p, state.format);
      var hasInput = (p.prenom || '').trim() || (p.nom || '').trim();
      if (!hasInput) return;
      var item = { kind: 'person', idx: i, who: ((p.prenom || '') + ' ' + (p.nom || '')).trim(), label: 'Nominative', use: 'Contact personnel avec un client.' };
      if (!local) { item.addr = ''; item.warn = 'Nom illisible pour une adresse : saisissez-le en lettres latines.'; list.push(item); return; }
      item.local = local; item.addr = local + '@' + domain;
      if (ROLE_ORDER.indexOf(local) !== -1) item.warn = 'Cette adresse est déjà une adresse de rôle : choisissez un autre format.';
      else if (seen[local]) item.warn = 'Même adresse qu\'une autre personne : passez au format « prénom.nom@ ».';
      else if (state.format === 'prenom' && !slug(p.prenom)) item.warn = 'Pas de prénom : l\'adresse utilise le nom.';
      seen[local] = true;
      list.push(item);
    });
    current = { domain: domain, isExample: domain === EXAMPLE_DOMAIN && (c.empty || !!c.error), clean: c, list: list };
    return current;
  }

  function renderDomainMsg() {
    var box = $('#domaine-msg');
    var input = $('#domaine');
    var c = current.clean;
    var html = '';
    box.className = 'domain-msg';
    input.removeAttribute('aria-invalid');
    if (c.empty) {
      var idea = slug(state.activite);
      if (idea) {
        idea = idea + '.dz';
        html = '<p class="dm-title">Pas encore de domaine ?</p><p>Idée tirée du nom de l\'activité : <b>' + esc(idea) + '</b>. Disponibilité à vérifier vous-même auprès d\'un bureau d\'enregistrement : cet outil ne vérifie rien.</p>' +
          '<button type="button" class="btn btn--ghost dm-fix" data-fix="' + esc(idea) + '">Utiliser « ' + esc(idea) + ' »</button>';
      }
    } else if (c.error) {
      box.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      html = '<p class="dm-title">À corriger</p><p>' + esc(c.error) + '</p>';
      if (c.fix) html += '<button type="button" class="btn btn--ghost dm-fix" data-fix="' + esc(c.fix) + '">Utiliser « ' + esc(c.fix) + ' »</button>';
      else if (c.free && slug(state.activite)) {
        var id2 = slug(state.activite) + '.dz';
        html += '<button type="button" class="btn btn--ghost dm-fix" data-fix="' + esc(id2) + '">Essayer « ' + esc(id2) + ' »</button>';
      }
      html += '<p class="small">En attendant, les exemples utilisent « ' + EXAMPLE_DOMAIN + ' ».</p>';
    } else if (c.notes.length) {
      box.classList.add('is-ok');
      html = '<p class="dm-title">Lu comme : ' + esc(c.value) + '</p><ul class="dm-notes">' + c.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    }
    box.innerHTML = html;
  }

  function renderLabels() {
    var ul = $('#labels');
    var list = current.list;
    if (!list.length) {
      ul.innerHTML = '<li class="label-empty">Cochez au moins une adresse de rôle ou ajoutez une personne pour remplir le carnet.</li>';
    } else {
      ul.innerHTML = list.map(function (it, i) {
        var jumbo = i === 0 && it.addr;
        var addrHtml = it.addr ? esc(it.addr).replace('@', '<span class="at">@</span>') : '—';
        return '<li class="label' + (jumbo ? ' label--jumbo' : '') + '">' +
          '<div class="label-top"><span class="label-role' + (it.kind === 'person' ? ' label-role--person' : '') + '">' + esc(it.kind === 'person' ? (it.who || 'Nominative') : it.label) + '</span>' +
          (it.addr ? '<span class="label-len">' + it.addr.length + ' caractères</span>' : '') + '</div>' +
          '<p class="label-addr">' + addrHtml + '</p>' +
          '<p class="label-use">' + esc(it.use) + '</p>' +
          (it.warn ? '<p class="label-warn">' + esc(it.warn) + '</p>' : '') +
          (it.addr ? '<div class="label-actions"><button type="button" class="mini" data-spell="' + i + '" aria-expanded="false" aria-controls="spell-' + i + '">Comment la dicter</button>' +
            '<button type="button" class="mini" data-copy-one="' + i + '">Copier</button></div>' +
            '<p class="label-spell" id="spell-' + i + '" hidden>« ' + esc(spell(it.addr)) + ' »</p>' : '') +
          '</li>';
      }).join('');
    }
    $$('[data-live="domain"]').forEach(function (el) { el.textContent = current.domain; });
    $$('[data-live="example"]').forEach(function (el) { el.hidden = !current.isExample; });

    var heroFrom = list.filter(function (x) { return x.addr; })[0];
    var heroAddr = heroFrom ? heroFrom.addr : 'contact@' + current.domain;
    var heroEl = $('.live-address');
    if (heroEl.textContent !== heroAddr) {
      heroEl.textContent = heroAddr;
      heroEl.classList.remove('flash'); void heroEl.offsetWidth; heroEl.classList.add('flash');
    }
    var roles = ROLE_ORDER.filter(function (r) { return state.roles[r]; });
    $('#alias-demo').textContent = roles.length ? roles.map(function (r) { return r + '@' + current.domain; }).join(', ') : 'contact@, commercial@, facturation@';
  }

  function renderPeople() {
    var wrap = $('#people');
    wrap.innerHTML = state.people.map(function (p, i) {
      return '<div class="person">' +
        '<input type="text" data-person="' + i + '" data-key="prenom" value="' + esc(p.prenom || '') + '" placeholder="Prénom" aria-label="Prénom de la personne ' + (i + 1) + '" autocomplete="off" maxlength="40">' +
        '<input type="text" data-person="' + i + '" data-key="nom" value="' + esc(p.nom || '') + '" placeholder="Nom" aria-label="Nom de la personne ' + (i + 1) + '" autocomplete="off" maxlength="40">' +
        '<button type="button" class="person-remove" data-remove="' + i + '" aria-label="Retirer la personne ' + (i + 1) + '">×</button></div>';
    }).join('');
    $('#add-person').disabled = state.people.length >= 8;
  }

  function updateAddresses() {
    computeAddresses();
    renderDomainMsg();
    renderLabels();
    renderEmailSelect();
    renderSignature();
    save();
  }

  /* ---------------- Copie (presse-papiers avec replis) ---------------- */
  function legacyCopyText(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.left = '-9999px'; ta.style.top = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopyText(text); });
    }
    return Promise.resolve(legacyCopyText(text));
  }
  function copyRich(html, text) {
    function legacy() {
      var div = document.createElement('div');
      div.contentEditable = 'true';
      div.innerHTML = html;
      div.style.position = 'fixed'; div.style.left = '-9999px'; div.style.top = '0';
      document.body.appendChild(div);
      var sel = window.getSelection(); var range = document.createRange();
      range.selectNodeContents(div); sel.removeAllRanges(); sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      sel.removeAllRanges(); document.body.removeChild(div);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      try {
        var item = new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        });
        return navigator.clipboard.write([item]).then(function () { return true; }, function () { return legacy(); });
      } catch (e) { return Promise.resolve(legacy()); }
    }
    return Promise.resolve(legacy());
  }
  function setStatus(el, msg, cls) {
    el.className = 'status' + (cls ? ' ' + cls : '');
    el.textContent = '';
    setTimeout(function () { el.textContent = msg; }, 30);
  }

  /* ---------------- Signature ---------------- */
  var SIG_EX = { nom: 'Yasmine Larbi', fonction: 'Gérante', activite: 'Mon Activité', tel: '+213 00 00 00 00', ville: 'Oran' };

  function normPhone(v) {
    var raw = String(v || '').trim();
    if (!raw) return { display: SIG_EX.tel, digits: '213000000000', example: true };
    if (/[a-z]/i.test(raw)) return { display: raw, digits: '', warn: 'Le numéro contient des lettres : vérifiez-le.' };
    var d = raw.replace(/[^\d+]/g, '');
    var nat = null;
    if (/^0\d{9}$/.test(d)) nat = d.slice(1);
    else if (/^(\+|00)213\d{8,9}$/.test(d)) nat = d.replace(/^(\+|00)213/, '');
    else if (/^213\d{8,9}$/.test(d)) nat = d.slice(3);
    if (nat) {
      var g = nat.length === 9 ? [nat.slice(0, 3), nat.slice(3, 5), nat.slice(5, 7), nat.slice(7)] : [nat.slice(0, 2), nat.slice(2, 4), nat.slice(4, 6), nat.slice(6)];
      return { display: '+213 ' + g.join(' '), digits: '213' + nat, changed: true };
    }
    var plain = d.replace(/\D/g, '');
    if (plain.length < 8) return { display: raw, digits: plain, warn: 'Numéro incomplet ? Format conseillé : +213 suivi du numéro sans le 0.' };
    return { display: raw, digits: plain, warn: 'Format non reconnu : il sera affiché tel quel. Le format +213 est conseillé.' };
  }

  function renderEmailSelect() {
    var sel = $('#sig-email');
    var opts = current.list.filter(function (x) { return x.addr; }).map(function (x) { return x.addr; });
    if (!opts.length) opts = ['contact@' + current.domain];
    if (opts.indexOf(state.sig.email) === -1) {
      var person = current.list.filter(function (x) { return x.kind === 'person' && x.addr; })[0];
      state.sig.email = person ? person.addr : opts[0];
    }
    sel.innerHTML = opts.map(function (o) { return '<option' + (o === state.sig.email ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }

  function sigData() {
    var s = state.sig;
    var ph = normPhone(s.tel);
    return {
      nom: (s.nom || '').trim() || SIG_EX.nom,
      fonction: (s.fonction || '').trim() || SIG_EX.fonction,
      activite: (s.activite || '').trim() || (state.activite || '').trim() || SIG_EX.activite,
      tel: ph.display, telHref: '+' + (ph.digits || '213000000000').replace(/^\+/, ''), phone: ph,
      ville: (s.ville || '').trim() || SIG_EX.ville,
      email: s.email || ('contact@' + current.domain),
      site: s.site ? current.domain : '',
      wa: s.whatsapp ? 'https://wa.me/' + (ph.digits && ph.digits.length >= 8 ? ph.digits : '213000000000') : '',
      color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#6a4cff',
      layout: s.layout
    };
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'A';
  }

  function sigHTML(d) {
    var C = d.color, ink = '#17132e', soft = '#4a4766';
    var font = 'font-family:Arial,Helvetica,sans-serif;';
    var link = function (href, txt, col) { return '<a href="' + esc(href) + '" style="color:' + (col || C) + ';text-decoration:none;">' + esc(txt) + '</a>'; };
    var lines = [];
    lines.push('Tél.&nbsp;' + link('tel:' + d.telHref, d.tel, ink));
    lines.push(link('mailto:' + d.email, d.email));
    if (d.site) lines.push(link('https://' + d.site, d.site));
    if (d.wa) lines.push(link(d.wa, 'Écrire sur WhatsApp'));
    lines.push('<span style="color:' + soft + ';">' + esc(d.ville) + '</span>');

    if (d.layout === 'sobre') {
      return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;' + font + 'font-size:14px;line-height:1.5;color:' + ink + ';"><tr><td>' +
        '<div style="color:' + soft + ';">--</div>' +
        '<div><strong style="font-size:15px;">' + esc(d.nom) + '</strong> · ' + esc(d.fonction) + '</div>' +
        '<div style="color:' + C + ';font-weight:bold;">' + esc(d.activite) + '</div>' +
        '<div>' + lines.join(' &nbsp;|&nbsp; ') + '</div></td></tr></table>';
    }
    var ident = '<div style="font-size:17px;font-weight:bold;color:' + ink + ';">' + esc(d.nom) + '</div>' +
      '<div style="color:' + soft + ';">' + esc(d.fonction) + '</div>' +
      '<div style="font-weight:bold;color:' + C + ';">' + esc(d.activite) + '</div>';
    if (d.layout === 'carte') {
      return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;' + font + 'font-size:14px;line-height:1.5;color:' + ink + ';"><tr>' +
        '<td style="vertical-align:top;padding:0 14px 0 0;"><div style="width:56px;height:56px;line-height:56px;text-align:center;background:' + C + ';color:#ffffff;font-size:22px;font-weight:bold;">' + esc(initials(d.nom)) + '</div></td>' +
        '<td style="vertical-align:top;">' + ident + '<div style="margin-top:6px;padding-top:6px;border-top:2px solid ' + C + ';">' + lines.join('<br>') + '</div></td></tr></table>';
    }
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;' + font + 'font-size:14px;line-height:1.5;color:' + ink + ';"><tr>' +
      '<td style="vertical-align:top;padding:0 14px 0 0;border-right:3px solid ' + C + ';">' + ident + '</td>' +
      '<td style="vertical-align:top;padding:0 0 0 14px;">' + lines.join('<br>') + '</td></tr></table>';
  }

  function sigText(d) {
    var t = ['-- ', d.nom, d.fonction + ' · ' + d.activite, 'Tél. ' + d.tel, d.email];
    if (d.site) t.push(d.site);
    if (d.wa) t.push('WhatsApp : ' + d.wa);
    t.push(d.ville);
    return t.join('\n');
  }

  var lastSig = { html: '', text: '' };
  function renderSignature() {
    var d = sigData();
    var html = sigHTML(d), text = sigText(d);
    lastSig = { html: html, text: text };
    $('#sig-render').innerHTML = html;
    $('#card-sig').innerHTML = html;
    $('#card-plain').textContent = text;
    $$('.mail-head [data-live="from"]').forEach(function (el) { el.textContent = d.email; });
    var actInput = $('#sig-activite');
    actInput.placeholder = (state.activite || '').trim() || SIG_EX.activite;
    var hint = $('#sig-tel-msg');
    if (d.phone.warn) { hint.textContent = d.phone.warn; hint.style.color = 'var(--warn)'; }
    else if (d.phone.changed) { hint.textContent = 'Affiché : ' + d.tel; hint.style.color = ''; }
    else { hint.textContent = 'Format international +213 conseillé.'; hint.style.color = ''; }
    $('#sig-fallback').hidden = true;
  }

  /* ---------------- Comparateur ---------------- */
  var READINGS = {
    redirection: 'Piste : la réexpédition. Simple et souvent gratuite, elle convient aux freelances et très petites structures. Pour répondre depuis votre adresse, il faudra un serveur d\'envoi authentifié.',
    hebergeur: 'Piste : les boîtes de votre hébergeur, souvent incluses dans un hébergement mutualisé avec webmail. Vérifiez le stockage et le filtrage du spam, qui varient.',
    payante: 'Piste : une messagerie professionnelle payante, facturée par utilisateur et par mois. Astuce : une licence peut recevoir plusieurs alias (contact@, commercial@, facturation@).'
  };
  function renderCompare() {
    $$('.offer').forEach(function (o) { o.classList.toggle('is-pick', o.getAttribute('data-offer') === state.situation); });
    $('#compare-reading').textContent = state.situation ? READINGS[state.situation] + ' C\'est une piste, pas une obligation.' :
      'Choisissez votre situation pour mettre en avant la formule la plus proche. C\'est une piste, pas une obligation.';
  }

  /* ---------------- Simulation : le trajet de la lettre ---------------- */
  var DMARC_LABEL = { none: '« none »', quarantine: 'quarantaine', reject: 'rejet' };
  function simulate(o) {
    var r = { steps: [], tray: 'inbox', cls: 'is-inbox', title: '', details: [] };
    var any = o.spf || o.dkim;
    if (o.letter === 'vraie') {
      r.steps.push(o.spf ? ['pass', 'Serveur autorisé : reconnu'] : ['none', 'Aucune liste SPF à vérifier']);
      r.steps.push(o.dkim ? ['pass', 'Cachet DKIM valide'] : ['none', 'Pas de signature DKIM']);
      if (o.dmarc === 'absent') r.steps.push(['none', 'Aucune consigne publiée']);
      else if (any) r.steps.push(['pass', 'Contrôles réussis : consigne sans effet']);
      else r.steps.push(['fail', 'Contrôles échoués : consigne ' + DMARC_LABEL[o.dmarc] + ' appliquée']);

      if (!any && (o.dmarc === 'quarantine' || o.dmarc === 'reject')) {
        r.tray = o.dmarc === 'reject' ? 'reject' : 'spam'; r.cls = o.dmarc === 'reject' ? 'is-reject' : 'is-spam';
        r.title = 'Attention : votre propre lettre serait ' + (o.dmarc === 'reject' ? 'rejetée.' : 'mise en quarantaine.');
        r.details.push('Sans SPF ni DKIM, vos vrais messages échouent aux contrôles, et la consigne DMARC s\'applique à eux aussi.');
        r.details.push('C\'est pourquoi on commence souvent par « none » pour observer, puis on durcit.');
      } else if (o.spf && o.dkim) {
        r.title = 'Votre lettre arrive avec tous ses papiers en règle.';
        r.details.push('SPF et DKIM sont en place : c\'est ce que vérifient les destinataires.');
        if (o.dmarc === 'absent') r.details.push('Ajoutez une consigne DMARC : sans elle, rien n\'indique aux destinataires quoi faire des lettres usurpées.');
        if (o.dmarc === 'none') r.details.push('Consigne « none » : vous observez. L\'étape suivante consiste à durcir (quarantaine, puis rejet).');
      } else if (any) {
        r.tray = 'spam'; r.cls = 'is-spam';
        r.title = 'Elle peut arriver, mais le risque d\'indésirables augmente.';
        r.details.push('Il manque ' + (o.spf ? 'DKIM' : 'SPF') + ' : l\'absence de SPF ou de DKIM fait partie des erreurs fréquentes.');
        r.details.push('Même les petits domaines sans ces réglages sont plus souvent classés en spam.');
      } else {
        r.tray = 'spam'; r.cls = 'is-spam';
        r.title = 'Sans aucun réglage, votre lettre finit plus souvent en indésirables.';
        r.details.push('Depuis 2024, les grands fournisseurs de messagerie exigent l\'authentification des expéditeurs à gros volume ; même les petits domaines sans ces réglages sont plus souvent classés en spam.');
      }
    } else {
      r.steps.push(o.spf ? ['fail', 'Serveur absent de la liste SPF'] : ['none', 'Aucune liste SPF : rien à comparer']);
      r.steps.push(o.dkim ? ['fail', 'Pas de cachet DKIM valide'] : ['none', 'Aucune clé DKIM publiée']);
      if (o.dmarc === 'absent') {
        r.steps.push(['none', 'Aucune consigne publiée']);
        r.title = 'La lettre usurpée peut arriver chez votre client.';
        r.details.push('Sans consigne DMARC, rien n\'indique au destinataire quoi faire d\'un message qui échoue aux contrôles.');
      } else {
        r.steps.push(['fail', 'Contrôles échoués : consigne ' + DMARC_LABEL[o.dmarc] + ' appliquée']);
        if (o.dmarc === 'none') {
          r.title = 'Consigne « none » : la lettre usurpée n\'est pas bloquée.';
          r.details.push('« none » sert à observer. Une fois vos vrais envois bien authentifiés, on durcit vers la quarantaine ou le rejet.');
        } else if (o.dmarc === 'quarantine') {
          r.tray = 'spam'; r.cls = 'is-spam';
          r.title = 'Quarantaine : la lettre usurpée est mise à l\'écart.';
          r.details.push('Le destinataire la classe à part au lieu de la livrer normalement.');
        } else {
          r.tray = 'reject'; r.cls = 'is-reject';
          r.title = 'Rejet : la lettre usurpée est refusée à l\'arrivée.';
          r.details.push('C\'est la consigne la plus stricte. On y arrive après une période d\'observation.');
        }
      }
      if (!any && o.dmarc !== 'absent' && o.dmarc !== 'none') r.details.push('Attention : sans SPF ni DKIM, vos vraies lettres subiraient le même sort.');
      if (!any) r.details.push('Sans SPF ni DKIM, les destinataires n\'ont aucun moyen de distinguer vos lettres des imitations.');
    }
    return r;
  }

  var simToken = 0, simRunning = false;
  function letterTo(i, instant) {
    var route = $('#route'), letter = $('#letter');
    var st = $$('.station', route)[i];
    if (!st) return;
    var rr = route.getBoundingClientRect(), sr = st.getBoundingClientRect();
    var wide = window.matchMedia('(min-width: 900px)').matches;
    var x, y;
    if (wide) { x = sr.left - rr.left + 62 - 31; y = sr.top - rr.top + 70 - 108; }
    else { x = rr.width - 62 - 14; y = sr.top - rr.top + sr.height / 2 - 22; }
    if (instant) { letter.style.transition = 'none'; }
    letter.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    if (instant) { void letter.offsetWidth; letter.style.transition = ''; }
    else { letter.classList.remove('is-flying'); void letter.offsetWidth; letter.classList.add('is-flying'); }
  }
  var currentStation = 0;
  function resetSim(msg) {
    simToken++; simRunning = false;
    $('#sim-run').disabled = false; $('#sim-run').textContent = 'Suivre la lettre';
    $$('.station').forEach(function (s) { s.classList.remove('is-done', 'res-pass', 'res-fail', 'res-none'); });
    $$('.st-pm').forEach(function (p) { p.innerHTML = ''; });
    ['spf', 'dkim', 'dmarc'].forEach(function (k) { $('#res-' + k).textContent = 'En attente'; });
    $$('.trays li').forEach(function (t) { t.classList.remove('is-target'); });
    currentStation = 0; letterTo(0, true);
    var v = $('#sim-verdict');
    v.className = 'verdict';
    v.innerHTML = '<p class="verdict-title">La lettre attend au départ.</p><p>' + esc(msg || 'Lancez le trajet pour voir ce que deviendrait le message avec ces réglages.') + '</p>';
  }
  function runSim() {
    if (simRunning) return;
    resetSim();
    var token = ++simToken; simRunning = true;
    var btn = $('#sim-run'); btn.disabled = true; btn.textContent = 'Trajet en cours…';
    var r = simulate(state.sim);
    var keys = ['spf', 'dkim', 'dmarc'], names = ['SPF', 'DKIM', 'DMARC'];
    var hop = reduceMotion ? 0 : 750, pause = reduceMotion ? 0 : 420;
    var chain = Promise.resolve();
    keys.forEach(function (k, i) {
      chain = chain.then(function () {
        if (token !== simToken) throw 0;
        currentStation = i + 1; letterTo(i + 1, reduceMotion); return wait(hop);
      }).then(function () {
        if (token !== simToken) throw 0;
        var st = $$('.station')[i + 1];
        var res = r.steps[i];
        st.querySelector('.st-pm').innerHTML = postmark('CONTRÔLE', names[i], false);
        st.classList.add('is-done', 'res-' + res[0]);
        $('#res-' + k).textContent = res[1];
        return wait(pause);
      });
    });
    chain.then(function () {
      if (token !== simToken) throw 0;
      currentStation = 4; letterTo(4, reduceMotion); return wait(hop);
    }).then(function () {
      if (token !== simToken) throw 0;
      $$('.trays li').forEach(function (t) { t.classList.toggle('is-target', t.getAttribute('data-tray') === r.tray); });
      var v = $('#sim-verdict');
      v.className = 'verdict ' + r.cls;
      var trayName = { inbox: 'Boîte de réception', spam: 'Indésirables', reject: 'Refusée' }[r.tray];
      v.innerHTML = '<p class="verdict-title">' + esc(r.title) + '</p><p><b>Arrivée : ' + trayName + '.</b></p><ul>' +
        r.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>';
      simRunning = false; btn.disabled = false; btn.textContent = 'Relancer le trajet';
    }).catch(function () { /* trajet interrompu */ });
  }

  /* ---------------- Checklist + carnet de timbres ---------------- */
  var CHECK_SHORT = { domaine: 'domaine à votre nom', spfdkim: 'SPF et DKIM', unspf: 'un seul SPF', boites: 'une boîte par personne', site: 'adresse du site sur votre domaine' };
  function buildSheet() {
    var sheet = $('#stampsheet');
    var html = '';
    for (var i = 1; i <= 5; i++) {
      html += '<div class="sheet-stamp" data-stamp="' + i + '"><b>0' + i + '</b><span class="cancel">' + postmark('OBLITÉRÉ', 'EN ORDRE', true) + '</span></div>';
    }
    html += '<div class="sheet-stamp sheet-stamp--blank"></div>';
    sheet.innerHTML = html;
  }
  function renderChecklist() {
    var boxes = $$('#checklist input');
    var done = 0, left = [];
    boxes.forEach(function (b, i) {
      b.checked = !!state.checklist[b.value];
      if (b.checked) done++; else left.push(CHECK_SHORT[b.value]);
      var st = $('[data-stamp="' + (i + 1) + '"]');
      if (st) st.classList.toggle('is-cancelled', b.checked);
    });
    var msg;
    if (done === 0) msg = 'Aucun point coché pour l\'instant. Chacun se règle une fois pour toutes.';
    else if (done === 5) msg = 'Les cinq points sont en ordre : votre courrier part dans de bonnes conditions.';
    else msg = done + ' point' + (done > 1 ? 's' : '') + ' sur 5 en ordre. À regarder : ' + left.join(', ') + '.';
    $('#errors-score').textContent = msg;
  }

  /* ---------------- Onglets (motif ARIA tablist) ---------------- */
  var TABS = ['adresses', 'signature', 'reglages'];
  function selectTab(name, focus) {
    if (TABS.indexOf(name) === -1) name = 'adresses';
    TABS.forEach(function (t) {
      var tab = $('#tab-' + t), panel = $('#panel-' + t), on = t === name;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
    });
    state.tab = name; save();
    if (focus) $('#tab-' + name).focus();
    if (name === 'reglages') requestAnimationFrame(function () { letterTo(currentStation, true); });
  }
  function initTabs() {
    $$('[role="tab"]').forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(TABS[i]); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % 3;
        else if (e.key === 'ArrowLeft') n = (i + 2) % 3;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = 2;
        if (n !== null) { e.preventDefault(); selectTab(TABS[n], true); }
      });
    });
    $$('[data-goto]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        selectTab(a.getAttribute('data-goto'));
        var tool = $('#outil');
        tool.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        $('#tab-' + a.getAttribute('data-goto')).focus({ preventScroll: true });
      });
    });
  }

  /* ---------------- Remplir les champs depuis l'état ---------------- */
  function fillForms() {
    $('#activite').value = state.activite;
    $('#domaine').value = state.domaine;
    $$('input[name="role"]').forEach(function (c) { c.checked = !!state.roles[c.value]; });
    $$('input[name="format"]').forEach(function (r) { r.checked = r.value === state.format; });
    $$('input[name="situation"]').forEach(function (r) { r.checked = r.value === state.situation; });
    renderPeople();
    var s = state.sig;
    $('#sig-nom').value = s.nom; $('#sig-fonction').value = s.fonction; $('#sig-activite').value = s.activite;
    $('#sig-tel').value = s.tel; $('#sig-ville').value = s.ville;
    $('#sig-whatsapp').checked = !!s.whatsapp; $('#sig-site').checked = s.site !== false;
    $$('input[name="sig-layout"]').forEach(function (r) { r.checked = r.value === s.layout; });
    $$('input[name="sig-color"]').forEach(function (r) { r.checked = r.value === s.color; });
    $$('input[name="sim-letter"]').forEach(function (r) { r.checked = r.value === state.sim.letter; });
    $$('input[name="sim-dmarc"]').forEach(function (r) { r.checked = r.value === state.sim.dmarc; });
    $('#sim-spf').checked = !!state.sim.spf; $('#sim-dkim').checked = !!state.sim.dkim;
  }

  /* ---------------- Écouteurs ---------------- */
  function bind() {
    $$('form').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); }); });

    $('#activite').addEventListener('input', function (e) { state.activite = e.target.value; updateAddresses(); });
    $('#domaine').addEventListener('input', function (e) { state.domaine = e.target.value; updateAddresses(); });
    $('#domaine-msg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-fix]'); if (!b) return;
      state.domaine = b.getAttribute('data-fix'); $('#domaine').value = state.domaine; updateAddresses(); $('#domaine').focus();
    });
    $$('input[name="role"]').forEach(function (c) { c.addEventListener('change', function () { state.roles[c.value] = c.checked; updateAddresses(); }); });
    $$('input[name="format"]').forEach(function (r) { r.addEventListener('change', function () { state.format = r.value; updateAddresses(); }); });
    $('#people').addEventListener('input', function (e) {
      var i = e.target.getAttribute('data-person'); if (i === null) return;
      state.people[+i][e.target.getAttribute('data-key')] = e.target.value; updateAddresses();
    });
    $('#people').addEventListener('click', function (e) {
      var b = e.target.closest('[data-remove]'); if (!b) return;
      var i = +b.getAttribute('data-remove');
      state.people.splice(i, 1);
      if (!state.people.length) state.people.push({ prenom: '', nom: '' });
      renderPeople(); updateAddresses();
      var inputs = $$('#people input'); (inputs[Math.min(i, state.people.length - 1) * 2] || $('#add-person')).focus();
    });
    $('#add-person').addEventListener('click', function () {
      if (state.people.length >= 8) return;
      state.people.push({ prenom: '', nom: '' }); renderPeople(); save();
      var inputs = $$('#people input'); inputs[inputs.length - 2].focus();
    });
    $('#labels').addEventListener('click', function (e) {
      var sp = e.target.closest('[data-spell]');
      if (sp) {
        var p = $('#spell-' + sp.getAttribute('data-spell'));
        p.hidden = !p.hidden; sp.setAttribute('aria-expanded', String(!p.hidden));
        sp.textContent = p.hidden ? 'Comment la dicter' : 'Masquer la dictée';
        return;
      }
      var cp = e.target.closest('[data-copy-one]');
      if (cp) {
        var it = current.list[+cp.getAttribute('data-copy-one')];
        copyText(it.addr).then(function (ok) {
          setStatus($('#copy-list-status'), ok ? 'Copiée : ' + it.addr : 'Copie impossible ici : sélectionnez l\'adresse à la main.', ok ? 'is-ok' : 'is-warn');
        });
      }
    });
    $('#copy-list').addEventListener('click', function () {
      var items = current.list.filter(function (x) { return x.addr; });
      var status = $('#copy-list-status'), fb = $('#list-fallback');
      if (!items.length) { setStatus(status, 'Le carnet est vide : rien à copier.', 'is-warn'); return; }
      var text = items.map(function (x) { return x.addr + ' : ' + (x.kind === 'person' ? (x.who + ', ' + x.use.toLowerCase()) : x.use); }).join('\n');
      if (current.isExample) text = '(Exemple avec le domaine fictif ' + EXAMPLE_DOMAIN + ')\n' + text;
      copyText(text).then(function (ok) {
        if (ok) { fb.hidden = true; setStatus(status, items.length + ' adresse' + (items.length > 1 ? 's copiées' : ' copiée') + ' dans le presse-papiers.', 'is-ok'); }
        else { fb.hidden = false; fb.value = text; fb.focus(); fb.select(); setStatus(status, 'Copie automatique indisponible : la liste est sélectionnée ci-dessous, faites Ctrl+C.', 'is-warn'); }
      });
    });
    $$('input[name="situation"]').forEach(function (r) { r.addEventListener('change', function () { state.situation = r.value; renderCompare(); save(); }); });

    // Signature
    [['#sig-nom', 'nom'], ['#sig-fonction', 'fonction'], ['#sig-activite', 'activite'], ['#sig-tel', 'tel'], ['#sig-ville', 'ville']].forEach(function (p) {
      $(p[0]).addEventListener('input', function (e) { state.sig[p[1]] = e.target.value; renderSignature(); save(); });
    });
    $('#sig-email').addEventListener('change', function (e) { state.sig.email = e.target.value; renderSignature(); save(); });
    $('#sig-whatsapp').addEventListener('change', function (e) { state.sig.whatsapp = e.target.checked; renderSignature(); save(); });
    $('#sig-site').addEventListener('change', function (e) { state.sig.site = e.target.checked; renderSignature(); save(); });
    $$('input[name="sig-layout"]').forEach(function (r) { r.addEventListener('change', function () { state.sig.layout = r.value; renderSignature(); save(); }); });
    $$('input[name="sig-color"]').forEach(function (r) { r.addEventListener('change', function () { state.sig.color = r.value; renderSignature(); save(); }); });

    function setFlip(back) {
      var card = $('#card-flip'), btn = $('#flip-card');
      card.classList.toggle('is-flipped', back);
      btn.setAttribute('aria-pressed', String(back));
      $('#card-front').setAttribute('aria-hidden', String(back));
      $('#card-back').setAttribute('aria-hidden', String(!back));
    }
    $('#flip-card').addEventListener('click', function () { setFlip(!$('#card-flip').classList.contains('is-flipped')); });
    var copying = false;
    function showFallback(content, label) {
      var fb = $('#sig-fallback'); fb.hidden = false;
      $('label[for="sig-fallback-text"]').textContent = label;
      var ta = $('#sig-fallback-text'); ta.value = content; ta.focus(); ta.select();
    }
    $('#copy-html').addEventListener('click', function () {
      if (copying) return; copying = true; setFlip(false);
      copyRich(lastSig.html, lastSig.text).then(function (ok) {
        copying = false;
        if (ok) { $('#sig-fallback').hidden = true; setStatus($('#copy-sig-status'), 'Signature copiée avec sa mise en forme. Collez-la dans les réglages de votre messagerie.', 'is-ok'); }
        else { showFallback(lastSig.html, 'Code HTML de la signature (pour les messageries qui acceptent le HTML)'); setStatus($('#copy-sig-status'), 'Copie automatique indisponible : le code est sélectionné ci-dessous.', 'is-warn'); }
      });
    });
    $('#copy-text').addEventListener('click', function () {
      if (copying) return; copying = true; setFlip(true);
      copyText(lastSig.text).then(function (ok) {
        copying = false;
        if (ok) { $('#sig-fallback').hidden = true; setStatus($('#copy-sig-status'), 'Version texte brut copiée.', 'is-ok'); }
        else { showFallback(lastSig.text, 'Signature en texte brut'); setStatus($('#copy-sig-status'), 'Copie automatique indisponible : le texte est sélectionné ci-dessous.', 'is-warn'); }
      });
    });

    // Simulation
    function simChanged() { save(); if (simRunning || $$('.station.is-done').length) resetSim('Réglages modifiés : relancez le trajet.'); }
    $$('input[name="sim-letter"]').forEach(function (r) { r.addEventListener('change', function () { state.sim.letter = r.value; simChanged(); }); });
    $$('input[name="sim-dmarc"]').forEach(function (r) { r.addEventListener('change', function () { state.sim.dmarc = r.value; simChanged(); }); });
    $('#sim-spf').addEventListener('change', function (e) { state.sim.spf = e.target.checked; simChanged(); });
    $('#sim-dkim').addEventListener('change', function (e) { state.sim.dkim = e.target.checked; simChanged(); });
    $('#sim-run').addEventListener('click', runSim);
    $('#sim-reset').addEventListener('click', function () { resetSim(); });
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { letterTo(currentStation, true); }, 120); });

    // Checklist
    $$('#checklist input').forEach(function (b) { b.addEventListener('change', function () { state.checklist[b.value] = b.checked; renderChecklist(); save(); }); });

    // Réinitialisations, impression, effacement
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-action]'); if (!a) return;
      var act = a.getAttribute('data-action');
      if (act === 'print') window.print();
      if (act === 'reset-adresses') {
        var d = clone(DEFAULT_STATE);
        state.activite = d.activite; state.domaine = d.domaine; state.roles = d.roles; state.people = d.people; state.format = d.format; state.situation = d.situation;
        fillForms(); updateAddresses(); renderCompare(); $('#activite').focus();
      }
      if (act === 'reset-signature') {
        state.sig = clone(DEFAULT_STATE.sig); fillForms(); renderEmailSelect(); renderSignature(); save(); $('#sig-nom').focus();
      }
      if (act === 'clear-storage') {
        try { window.localStorage.removeItem(STORE_KEY); } catch (err) { /* ignoré */ }
        var tab = state.tab;
        state = clone(DEFAULT_STATE); state.tab = tab;
        fillForms(); computeAddresses(); renderDomainMsg(); renderLabels(); renderEmailSelect(); renderSignature(); renderCompare(); renderChecklist(); resetSim();
        clearTimeout(saveTimer);
        try { window.localStorage.removeItem(STORE_KEY); } catch (err2) { /* ignoré */ }
        var m = $('#clear-msg'); m.textContent = ''; setTimeout(function () { m.textContent = 'Saisies effacées de ce navigateur.'; }, 30);
      }
    });
  }

  /* ---------------- Apparitions au défilement ---------------- */
  function initReveal() {
    var els = $$('.panel-head, .rules, .compare-grid, .checkpoints .cp, .journey-head, .errors-head, .outro-title');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    els.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
    window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('is-in'); }); });
  }

  /* ---------------- Démarrage ---------------- */
  load();
  $('[data-postmark="hero"]').innerHTML = postmark('COURRIEL PRO', 'PAR AVION', true);
  buildSheet();
  fillForms();
  initTabs();
  bind();
  computeAddresses(); renderDomainMsg(); renderLabels(); renderEmailSelect(); renderSignature();
  renderCompare(); renderChecklist();
  selectTab(state.tab);
  resetSim();
  initReveal();
})();
