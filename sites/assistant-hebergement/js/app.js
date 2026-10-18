/* Assistant hébergement — démonstration. Aucune donnée n'est envoyée. */
(function () {
  'use strict';

  /* ---------- Données (toutes issues de source-article.md) ---------- */
  var QUESTIONS = [
    {
      id: 'type', short: 'Type', field: 'Type de site',
      title: 'Quel type de site préparez-vous ?',
      hint: 'Choisissez ce qui ressemble le plus à votre projet.',
      options: [
        { v: 'vitrine', t: 'Site vitrine', d: 'Quelques pages pour présenter l’activité, les services et les coordonnées.', s: 'Vitrine' },
        { v: 'contenu', t: 'Site de contenu ou blog', d: 'Des articles publiés régulièrement, souvent avec WordPress.', s: 'Contenu / blog' },
        { v: 'boutique', t: 'Boutique en ligne', d: 'Un catalogue, un panier et des commandes.', s: 'Boutique' },
        { v: 'appli', t: 'Projet sur mesure', d: 'Espace client, réservations, outil métier…', s: 'Sur mesure' }
      ]
    },
    {
      id: 'bdd', short: 'BDD', field: 'Base de données',
      title: 'Votre site a-t-il besoin d’une base de données ?',
      hint: 'Une base de données stocke ce qui change : articles, comptes, commandes. WordPress en utilise une.',
      options: [
        { v: 'non', t: 'Non', d: 'Des pages fixes, mises à jour de temps en temps.', s: 'Non' },
        { v: 'oui', t: 'Oui', d: 'Contenus gérés depuis une interface, comptes, commandes…', s: 'Oui' },
        { v: 'nsp', t: 'Je ne sais pas', d: 'L’assistant raisonnera à partir du type de site.', s: 'À préciser' }
      ]
    },
    {
      id: 'vente', short: 'Vente', field: 'Vente en ligne',
      title: 'Allez-vous vendre en ligne, avec commande sur le site ?',
      hint: 'Un simple formulaire de contact ou de devis ne compte pas comme une vente en ligne.',
      options: [
        { v: 'non', t: 'Non', d: 'Les clients vous appellent, vous écrivent ou passent vous voir.', s: 'Non' },
        { v: 'oui', t: 'Oui', d: 'Les commandes se passent directement sur le site.', s: 'Oui' }
      ]
    },
    {
      id: 'usage', short: 'Usage', field: 'Usage',
      title: 'Le site sert-il une activité commerciale ?',
      hint: 'Certains plans gratuits réservent l’usage personnel et interdisent les sites commerciaux.',
      options: [
        { v: 'pro', t: 'Oui, usage commercial', d: 'Entreprise, commerce, profession libérale, prestataire.', s: 'Commercial' },
        { v: 'perso', t: 'Non, usage personnel', d: 'Projet personnel, portfolio, site non commercial.', s: 'Personnel' }
      ]
    },
    {
      id: 'budget', short: 'Budget', field: 'Budget visé',
      title: 'Quel budget annuel visez-vous pour l’hébergement ?',
      hint: 'Fourchettes relevées dans l’article, en équivalent euros, à titre indicatif. Le nom de domaine se paie à part.',
      options: [
        { v: 'zero', t: 'Le minimum, idéalement 0 €', d: 'Vous voulez éviter tout abonnement d’hébergement.', s: '0 €' },
        { v: 'moyen', t: 'Environ 35 à 65 € par an', d: 'Un abonnement abordable.', s: '~35–65 €' },
        { v: 'eleve', t: 'Environ 100 à 200 € par an', d: 'Un budget pour des ressources dédiées.', s: '~100–200 €' },
        { v: 'delegue', t: 'Mon prestataire s’en occupe', d: 'Vous préférez un hébergement inclus dans son offre.', s: 'Délégué' }
      ]
    }
  ];

  var TYPES = {
    STA: { code: 'STA', gate: '01', name: 'Hébergement statique', cost: '0 €' },
    MUT: { code: 'MUT', gate: '02', name: 'Hébergement mutualisé', cost: '~35–65 €' },
    VPS: { code: 'VPS', gate: '03', name: 'Serveur privé (VPS)', cost: '~100–200 €' },
    INC: { code: 'INC', gate: '04', name: 'Hébergement inclus par le prestataire', cost: 'Selon l’offre (à valider)' }
  };
  var GATE_ORDER = ['STA', 'MUT', 'VPS', 'INC'];
  var GATE_LABEL = { STA: 'STATIQUE', MUT: 'MUTUALISÉ', VPS: 'VPS', INC: 'INCLUS' };

  /* ---------- Table de décision (documentée dans README.md) ---------- */
  function needsDatabase(a) {
    if (a.bdd === 'oui') return true;
    if (a.vente === 'oui') return true;
    if (a.type === 'boutique' || a.type === 'appli') return true;
    if (a.bdd === 'nsp' && a.type === 'contenu') return true;
    return false;
  }

  function recommend(a) {
    var db = needsDatabase(a);
    var key, why = [], watch = [], alt = '';

    if (a.budget === 'delegue') {
      key = 'INC';
      why.push('Vous préférez déléguer : l’hébergement inclus par le prestataire est pratique, avec un seul interlocuteur.');
      why.push(db
        ? 'Votre projet utilise une base de données : demandez sur quel type de serveur il sera installé (mutualisé ou VPS).'
        : 'Pour un site sans base de données, demandez si un hébergement statique est prévu : c’est souvent gratuit.');
      watch.push('L’article prévient : c’est risqué si vous ne maîtrisez ni les accès ni la sortie. Exigez vos identifiants et la possibilité de déménager.');
      watch.push('Le compte d’hébergement doit être à votre nom, pas à celui du prestataire.');
      alt = db ? 'MUT' : 'STA';
    } else if (!db) {
      key = 'STA';
      why.push('Votre site n’a pas besoin de base de données : l’hébergement statique est adapté à un site vitrine simple.');
      why.push('Il est souvent gratuit, rapide et demande peu de maintenance.');
      why.push('Servi par un CDN, l’emplacement du serveur compte peu : pas besoin de chercher un serveur au plus près de vos visiteurs.');
      if (a.type === 'vitrine') {
        why.push('C’est aussi l’approche que recommande l’auteur de l’article pour un site vitrine : un compte au nom du client, sans abonnement d’hébergement.');
      }
      if (a.usage === 'pro') {
        watch.push('Usage commercial : certains plans gratuits réservent l’usage personnel et interdisent les sites commerciaux. D’autres l’acceptent dans la limite de leurs quotas : lisez les conditions.');
      }
      if (a.bdd === 'nsp') {
        watch.push('Vous n’étiez pas sûr pour la base de données : si le site doit finalement tourner sous WordPress, visez plutôt le mutualisé.');
      }
      if (a.type === 'contenu') {
        watch.push('Un blog statique se met à jour en republiant le site : vérifiez que cette façon de publier vous convient.');
      }
      alt = 'MUT';
    } else if (a.type === 'appli' || a.budget === 'eleve') {
      key = 'VPS';
      why.push('Votre projet repose sur une base de données : la proximité et la puissance du serveur comptent davantage.');
      why.push('Le VPS vous donne un serveur privé, dimensionné pour votre projet.');
      if (a.type === 'appli') why.push('Un projet sur mesure a souvent besoin de cette liberté de configuration.');
      watch.push('Un VPS s’administre : vous-même ou avec un prestataire. Prévoyez qui s’en charge avant de vous lancer.');
      if (a.budget === 'zero' || a.budget === 'moyen') {
        watch.push('La fourchette relevée dans l’article pour un VPS (~100–200 € par an) dépasse le budget indiqué : à réévaluer avec votre prestataire.');
      }
      alt = 'MUT';
    } else {
      key = 'MUT';
      why.push('Votre site utilise une base de données : le mutualisé est abordable et adapté à WordPress.');
      why.push('Les adresses e-mail sont souvent incluses dans l’offre.');
      if (a.budget === 'zero') {
        watch.push('Votre budget visé est de 0 €, mais seul l’hébergement statique est présenté comme gratuit dans l’article. Comptez environ 35 à 65 € par an pour un mutualisé (indicatif).');
      }
      if (a.bdd === 'nsp') {
        watch.push('Vous n’étiez pas sûr pour la base de données : un site de contenu ou une boutique en utilise presque toujours une. À confirmer avec votre prestataire.');
      }
      watch.push('Pour un site avec base de données, la proximité et la puissance du serveur comptent : demandez où il se trouve.');
      alt = 'VPS';
    }

    if (a.vente === 'oui' || a.type === 'boutique') {
      watch.unshift('Boutique en ligne : l’auteur de l’article affirme qu’elle doit être hébergée en Algérie (loi 18-05). Choisissez un hébergeur qui le permet et faites valider ce point par un juriste.');
    }
    watch.push('Vérifiez que l’offre inclut HTTPS, des sauvegardes, un support joignable et des conditions claires.');

    return { key: key, why: why, watch: watch, alt: alt, db: db };
  }

  var ALT_TEXT = {
    STA: 'Itinéraire bis : hébergement statique, si le site reste simple et sans base de données.',
    MUT: 'Itinéraire bis : hébergement mutualisé, si vous voulez WordPress ou des e-mails inclus.',
    VPS: 'Itinéraire bis : VPS, si le projet a besoin de plus de puissance (à administrer vous-même ou avec un prestataire).',
    INC: 'Itinéraire bis : hébergement inclus par votre prestataire, à condition de garder les accès et la possibilité de partir.'
  };

  /* ---------- État ---------- */
  var KEY = 'relais-hebergement-v1';
  var state = { step: 0, answers: {}, done: false, checks: [false, false, false, false, false] };
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        if (s.answers && typeof s.answers === 'object') {
          QUESTIONS.forEach(function (q) {
            var v = s.answers[q.id];
            if (q.options.some(function (o) { return o.v === v; })) state.answers[q.id] = v;
          });
        }
        var st = parseInt(s.step, 10);
        if (st >= 0 && st < QUESTIONS.length) state.step = st;
        state.done = !!s.done && answeredCount() === QUESTIONS.length;
        if (Array.isArray(s.checks)) state.checks = state.checks.map(function (_, i) { return !!s.checks[i]; });
      }
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
  }
  function answeredCount() {
    return QUESTIONS.filter(function (q) { return state.answers[q.id]; }).length;
  }

  /* ---------- Raccourcis DOM ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stepsEl = $('#steps'), form = $('#wizard'), errEl = $('#wizard-error');
  var btnBack = $('#btn-back'), btnNext = $('#btn-next'), live = $('#live');
  var resultEl = $('#result');
  var busy = false;

  /* ---------- Construction des étapes ---------- */
  function buildSteps() {
    var html = '';
    QUESTIONS.forEach(function (q, i) {
      html += '<fieldset class="step" data-step="' + i + '" data-count="' + q.options.length + '" hidden>' +
        '<legend class="step-legend"><span class="step-num mono">Q' + (i + 1) + '<span class="of">/5</span></span>' +
        '<span class="step-title" tabindex="-1">' + q.title + '</span></legend>' +
        '<p class="step-hint">' + q.hint + '</p><div class="tiles">';
      q.options.forEach(function (o, j) {
        var id = 'q-' + q.id + '-' + o.v;
        html += '<label class="tile" for="' + id + '">' +
          '<input type="radio" name="' + q.id + '" id="' + id + '" value="' + o.v + '">' +
          '<kbd class="tile-key" aria-hidden="true">' + (j + 1) + '</kbd>' +
          '<span class="tile-text"><span class="tile-t">' + o.t + '</span><span class="tile-d">' + o.d + '</span></span>' +
          '<svg class="tile-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6"/></svg>' +
          '</label>';
      });
      html += '</div></fieldset>';
    });
    stepsEl.innerHTML = html;
    // pré-cocher les réponses connues
    QUESTIONS.forEach(function (q) {
      var v = state.answers[q.id];
      if (v) { var inp = document.getElementById('q-' + q.id + '-' + v); if (inp) inp.checked = true; }
    });
  }

  /* ---------- Plan du réseau (SVG) ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  var RACK_X = [150, 290, 430, 570, 710];
  var GATE_Y = { STA: 34, MUT: 94, VPS: 156, INC: 216 };
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function buildMap() {
    var racks = $('#racks'), gates = $('#gates');
    if (!racks) return;
    RACK_X.forEach(function (x, i) {
      var g = el('g', { 'class': 'rack', 'data-rack': i, transform: 'translate(' + (x - 26) + ' 82)' }, racks);
      el('rect', { 'class': 'rack-body', x: 0, y: 0, width: 52, height: 86, rx: 2 }, g);
      for (var u = 0; u < 4; u++) {
        el('rect', { 'class': 'rack-unit', x: 6, y: 8 + u * 19, width: 40, height: 13 }, g);
        el('circle', { 'class': 'led', cx: 39, cy: 14.5 + u * 19, r: 2.4 }, g);
        el('path', { 'class': 'vent', d: 'M11 ' + (14.5 + u * 19) + 'h18' }, g);
      }
      var t = el('text', { 'class': 'rack-label', x: 26, y: 112, 'text-anchor': 'middle' }, g);
      t.textContent = 'Q' + (i + 1) + ' ' + QUESTIONS[i].short.toUpperCase();
      var a = el('text', { 'class': 'rack-answer', x: 26, y: -12, 'text-anchor': 'middle' }, g);
      a.textContent = '';
    });
    GATE_ORDER.forEach(function (k) {
      var y = GATE_Y[k];
      var g = el('g', { 'class': 'gate-node', 'data-gate': k, transform: 'translate(885 ' + (y - 19) + ')' }, gates);
      el('rect', { x: 0, y: 0, width: 108, height: 38, rx: 2 }, g);
      var t1 = el('text', { 'class': 'gate-code', x: 10, y: 25 }, g); t1.textContent = k;
      var t2 = el('text', { 'class': 'gate-num', x: 98, y: 25, 'text-anchor': 'end' }, g); t2.textContent = TYPES[k].gate;
    });
  }
  function updateMap(resultKey) {
    var n = answeredCount();
    var pos = Math.min(state.step, 4);
    $$('#routemap .seg:not(.branch)').forEach(function (p) {
      var i = +p.getAttribute('data-seg');
      var on = resultKey ? true : (i <= pos && (i === 0 || state.answers[QUESTIONS[i - 1].id]));
      p.classList.toggle('on', !!on);
    });
    $$('#routemap .rack').forEach(function (r) {
      var i = +r.getAttribute('data-rack');
      var q = QUESTIONS[i], v = state.answers[q.id];
      r.classList.toggle('answered', !!v);
      r.classList.toggle('current', !resultKey && i === state.step);
      var opt = q.options.filter(function (o) { return o.v === v; })[0];
      r.querySelector('.rack-answer').textContent = opt ? opt.s.toUpperCase() : '';
    });
    $$('#routemap .branch').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-branch') === resultKey); });
    $$('#routemap .gate-node').forEach(function (g) {
      g.classList.toggle('lit', g.getAttribute('data-gate') === resultKey);
      g.classList.toggle('dim', !!resultKey && g.getAttribute('data-gate') !== resultKey);
    });
    var packet = $('#packet');
    var x, y = 125;
    if (resultKey) { x = 940; y = GATE_Y[resultKey]; packet.classList.add('arrived'); }
    else { x = RACK_X[pos]; packet.classList.remove('arrived'); }
    if (n === 0 && state.step === 0 && !resultKey) x = 40;
    packet.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
    packet.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    camera(resultKey ? 1000 : x);
  }

  /* Sur petit écran, la « caméra » suit le paquet le long du réseau. */
  var camX = null, camRaf = 0, VIEW_W = 440;
  function camera(focusX) {
    var svg = $('#routemap');
    if (!svg) return;
    if (window.innerWidth > 640) { svg.setAttribute('viewBox', '0 0 1000 250'); camX = null; return; }
    var target = Math.max(0, Math.min(1000 - VIEW_W, focusX - VIEW_W * 0.45));
    if (camX === null || reduce) { camX = target; svg.setAttribute('viewBox', camX + ' 0 ' + VIEW_W + ' 250'); return; }
    cancelAnimationFrame(camRaf);
    var from = camX, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 650), e = 1 - Math.pow(1 - k, 3);
      camX = from + (target - from) * e;
      svg.setAttribute('viewBox', camX.toFixed(1) + ' 0 ' + VIEW_W + ' 250');
      if (k < 1) camRaf = requestAnimationFrame(step);
    }
    camRaf = requestAnimationFrame(step);
  }
  var rzT;
  window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { camX = null; updateMap(state.done ? recommend(state.answers).key : null); }, 150); });

  /* ---------- Rendu de l'assistant ---------- */
  function render(focus) {
    var steps = $$('.step', stepsEl);
    var n = answeredCount();
    var prog = $('#progress');
    prog.setAttribute('aria-valuenow', n);
    prog.setAttribute('aria-valuetext', n + ' réponse' + (n > 1 ? 's' : '') + ' sur 5');
    $$('span', prog).forEach(function (s, i) {
      var q = QUESTIONS[i];
      s.className = state.answers[q.id] ? 'done' : '';
      if (!state.done && i === state.step) s.className += ' current';
    });

    if (state.done) {
      form.hidden = true;
      showResult(focus);
      $('#step-label').textContent = 'Route calculée';
      $('#console-status').textContent = 'destination verrouillée';
      return;
    }
    resultEl.hidden = true;
    form.hidden = false;
    highlightBoard(null);
    steps.forEach(function (s, i) {
      var cur = i === state.step;
      s.hidden = !cur;
      s.classList.toggle('active', cur);
    });
    $('#step-label').textContent = 'Question ' + (state.step + 1) + ' / 5';
    $('#console-status').textContent = n === 0 ? 'route en préparation' : 'routage… ' + n + '/5 nœuds franchis';
    btnBack.disabled = state.step === 0;
    btnNext.innerHTML = state.step === QUESTIONS.length - 1 ? 'Calculer ma route <span aria-hidden="true">→</span>' : 'Suivant <span aria-hidden="true">→</span>';
    errEl.textContent = '';
    updateMap(null);
    if (focus) {
      var t = $('.step.active .step-title', stepsEl);
      if (t) t.focus({ preventScroll: true });
    }
  }

  function currentValue() {
    var q = QUESTIONS[state.step];
    var c = $('input[name="' + q.id + '"]:checked', stepsEl);
    return c ? c.value : null;
  }

  function next() {
    if (busy) return;
    var v = currentValue();
    var q = QUESTIONS[state.step];
    if (!v) {
      errEl.textContent = 'Choisissez une réponse pour continuer (touches 1 à ' + q.options.length + ').';
      var first = $('.step.active input', stepsEl);
      if (first) first.focus();
      return;
    }
    state.answers[q.id] = v;
    errEl.textContent = '';
    busy = true;
    var delay = reduce ? 0 : 260;
    if (state.step < QUESTIONS.length - 1) {
      state.step++;
      save();
      updateMapAfterAnswer();
      setTimeout(function () { busy = false; render(true); live.textContent = 'Question ' + (state.step + 1) + ' sur 5 : ' + QUESTIONS[state.step].title; }, delay);
    } else {
      // dernière question : vérifier que tout est rempli
      var missing = QUESTIONS.filter(function (qq) { return !state.answers[qq.id]; })[0];
      if (missing) {
        busy = false;
        state.step = QUESTIONS.indexOf(missing);
        render(true);
        errEl.textContent = 'Il manque une réponse à cette question.';
        return;
      }
      state.done = true;
      save();
      $('#console-status').textContent = 'calcul de la route…';
      setTimeout(function () { busy = false; render(true); }, reduce ? 0 : 420);
    }
  }
  function updateMapAfterAnswer() { updateMap(null); }

  function back() {
    if (busy) return;
    if (state.done) { state.done = false; state.step = QUESTIONS.length - 1; save(); render(true); return; }
    if (state.step > 0) { state.step--; save(); render(true); }
  }

  function resetAll(clearChecks) {
    state.step = 0; state.answers = {}; state.done = false;
    if (clearChecks) state.checks = [false, false, false, false, false];
    $$('input[type="radio"]', stepsEl).forEach(function (i) { i.checked = false; });
    save();
    if (clearChecks) { try { window.localStorage.removeItem(KEY); } catch (e) { /* ignoré */ } renderChecks(); }
    render(false);
    var t = $('.step.active .step-title', stepsEl);
    if (t) t.focus();
    live.textContent = clearChecks ? 'Réponses et checklist effacées.' : 'Assistant réinitialisé. Question 1 sur 5.';
  }

  /* ---------- Résultat ---------- */
  function routeCode(key) {
    var digits = QUESTIONS.map(function (q) {
      var idx = 0;
      q.options.forEach(function (o, j) { if (o.v === state.answers[q.id]) idx = j + 1; });
      return idx;
    }).join('');
    return key + '-' + digits;
  }
  function barcode(code) {
    var svg = $('#stub-bars');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var x = 0, seed = 0;
    for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) % 9973;
    while (x < 200) {
      seed = (seed * 37 + 11) % 9973;
      var w = 1 + (seed % 4);
      if ((seed >> 2) % 3 !== 0) el('rect', { x: x, y: 0, width: w, height: 44 }, svg);
      x += w + 1 + ((seed >> 3) % 3);
    }
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function showResult(focus) {
    var r = recommend(state.answers);
    var t = TYPES[r.key];
    $('#pass-code').textContent = t.code;
    $('#pass-name').textContent = t.name;
    var code = routeCode(r.key);
    $('#stub-code').textContent = code;
    $('#stub-gate').textContent = t.gate;
    try {
      $('#pass-date').textContent = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    } catch (e) { $('#pass-date').textContent = ''; }
    var f = '';
    QUESTIONS.forEach(function (q) {
      var o = q.options.filter(function (x) { return x.v === state.answers[q.id]; })[0];
      f += '<div><dt>' + esc(q.field) + '</dt><dd>' + esc(o ? o.s : '—') + '</dd></div>';
    });
    f += '<div class="cost"><dt>Coût annuel indicatif</dt><dd>' + esc(t.cost) + '</dd></div>';
    $('#pass-fields').innerHTML = f;
    $('#pass-why').innerHTML = r.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    $('#pass-watch').innerHTML = r.watch.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    $('#pass-alt').textContent = ALT_TEXT[r.alt] || '';
    barcode(code);
    resultEl.hidden = false;
    resultEl.classList.remove('reveal');
    void resultEl.offsetWidth;
    resultEl.classList.add('reveal');
    updateMap(r.key);
    highlightBoard(r.key);
    $$('#progress span').forEach(function (s) { s.className = 'done'; });
    live.textContent = 'Route calculée : ' + t.name + '.';
    if (focus) resultEl.focus({ preventScroll: false });
  }

  function highlightBoard(key) {
    $$('.board-table tbody tr').forEach(function (tr) {
      var on = tr.getAttribute('data-type') === key;
      tr.classList.toggle('mine', on);
      var badge = tr.querySelector('.mine-badge');
      if (on && !badge) {
        var b = document.createElement('span');
        b.className = 'mine-badge mono';
        b.textContent = 'Votre route';
        tr.querySelector('th').appendChild(b);
      } else if (!on && badge) badge.remove();
    });
  }

  /* ---------- Checklist ---------- */
  function renderChecks() {
    var boxes = $$('[data-check]');
    boxes.forEach(function (b) { b.checked = !!state.checks[+b.getAttribute('data-check')]; });
    var n = state.checks.filter(Boolean).length;
    $('#check-done').textContent = n;
    $('#check-state').textContent = n === 5 ? 'prêt au décollage' : n === 0 ? 'vérifications à faire' : (5 - n) + ' vérification' + (5 - n > 1 ? 's' : '') + ' restante' + (5 - n > 1 ? 's' : '');
    document.querySelector('.check-side').classList.toggle('all', n === 5);
  }

  /* ---------- Événements ---------- */
  var pointerPick = false;
  stepsEl.addEventListener('pointerdown', function (e) { if (e.target.closest('.tile')) pointerPick = true; });
  stepsEl.addEventListener('change', function (e) {
    if (e.target.type !== 'radio') return;
    errEl.textContent = '';
    var q = QUESTIONS[state.step];
    state.answers[q.id] = e.target.value;
    save();
    updateMap(null);
    var prog = $$('#progress span');
    if (prog[state.step]) prog[state.step].classList.add('done');
    if (pointerPick) { pointerPick = false; next(); }
  });
  document.addEventListener('pointerup', function () { setTimeout(function () { pointerPick = false; }, 0); });

  form.addEventListener('submit', function (e) { e.preventDefault(); next(); });
  btnBack.addEventListener('click', back);
  $('#btn-reset').addEventListener('click', function () { resetAll(false); });
  $('#btn-restart').addEventListener('click', function () { resetAll(false); });
  $('#btn-edit').addEventListener('click', back);
  $('#btn-print').addEventListener('click', function () { window.print(); });
  $('#btn-clear').addEventListener('click', function () { resetAll(true); });
  $$('[data-check]').forEach(function (b) {
    b.addEventListener('change', function () {
      state.checks[+b.getAttribute('data-check')] = b.checked;
      save(); renderChecks();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tg = e.target;
    var tag = tg && tg.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && tg.type !== 'radio')) return;
    if (form.hidden) return;
    // n'agir que si l'assistant est à l'écran
    var rect = form.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    if (/^[1-4]$/.test(e.key)) {
      if (busy) { e.preventDefault(); return; }
      var inputs = $$('.step.active input', stepsEl);
      var inp = inputs[+e.key - 1];
      if (!inp) return;
      e.preventDefault();
      inp.checked = true;
      inp.focus({ preventScroll: true });
      state.answers[QUESTIONS[state.step].id] = inp.value;
      save();
      updateMap(null);
      var lbl = inp.closest('.tile');
      lbl.classList.add('pressed');
      setTimeout(function () { lbl.classList.remove('pressed'); }, 200);
      next();
    } else if (e.key === 'Backspace') {
      if (state.step > 0) { e.preventDefault(); back(); }
    } else if (e.key === 'Enter' && tag === 'INPUT') {
      e.preventDefault(); next();
    }
  });

  /* ---------- Apparitions au défilement ---------- */
  function reveal() {
    var items = $$('.rv');
    if (!('IntersectionObserver' in window) || reduce) { items.forEach(function (i) { i.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (i) { io.observe(i); });
  }

  /* ---------- Démarrage ---------- */
  load();
  buildSteps();
  buildMap();
  renderChecks();
  render(false);
  reveal();
})();
