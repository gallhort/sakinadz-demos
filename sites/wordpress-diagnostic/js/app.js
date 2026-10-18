/* =========================================================
   Banc d'essai WP — logique de l'outil (démo, aucune donnée envoyée)
   Seuils, causes, optimisations et critères de refonte :
   source-article.md uniquement (voir README, section « Traçabilité »).
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var STORE_KEY = 'banc-essai-wp-v1';

  /* ---------------------------------------------------------
     Persistance locale (facultative, dans try/catch)
     --------------------------------------------------------- */
  var state = { tab: 'mesures', measures: { lcp: '', inp: '', cls: '' }, answers: {}, step: 0, verdict: false, checks: {} };
  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        state.tab = s.tab === 'verdict' ? 'verdict' : 'mesures';
        if (s.measures) ['lcp', 'inp', 'cls'].forEach(function (k) { if (typeof s.measures[k] === 'string') state.measures[k] = s.measures[k].slice(0, 40); });
        if (s.answers && typeof s.answers === 'object') state.answers = s.answers;
        state.step = Math.max(0, Math.min(7, parseInt(s.step, 10) || 0));
        state.verdict = !!s.verdict;
        if (s.checks && typeof s.checks === 'object') state.checks = s.checks;
      }
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
  }
  function forget() {
    try { window.localStorage.removeItem(STORE_KEY); } catch (e) { /* ignoré */ }
  }

  /* ---------------------------------------------------------
     Seuils
     good : seuil de l'article (« 2,5 s ou moins », « 200 ms ou moins », « 0,1 ou moins »)
     limit : limite orange/rouge = CONVENTION DE L'OUTIL (double du seuil), à valider —
             l'article ne la donne pas.
     max : fin de cadran (affichage seulement).
     --------------------------------------------------------- */
  var METRICS = {
    lcp: { code: 'LCP', name: 'chargement', unit: 's', good: 2.5, limit: 5, max: 7.5, major: 2.5, minor: 0.5, dec: 2 },
    inp: { code: 'INP', name: 'réactivité', unit: 'ms', good: 200, limit: 400, max: 600, major: 200, minor: 50, dec: 0 },
    cls: { code: 'CLS', name: 'stabilité visuelle', unit: '', good: 0.1, limit: 0.2, max: 0.3, major: 0.1, minor: 0.025, dec: 3 }
  };

  function fr(n, dec) {
    return n.toLocaleString('fr-FR', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  }
  function fmt(key, v) {
    var m = METRICS[key];
    var dec = key === 'lcp' ? (v < 10 ? 2 : 1) : m.dec;
    return fr(v, dec) + (m.unit ? ' ' + m.unit : '');
  }

  /* ---------------------------------------------------------
     Lecture d'une saisie : virgule française, unités, cas limites
     Retourne { empty } | { error } | { value, notes[] }
     --------------------------------------------------------- */
  function parseMeasure(key, raw) {
    var s = String(raw || '').trim().toLowerCase();
    if (!s) return { empty: true };
    s = s.replace(/[  ]/g, ' ');
    // espaces de milliers entre chiffres : « 2 500 » -> « 2500 »
    s = s.replace(/(\d)\s+(?=\d)/g, '$1');
    var mt = s.match(/^([+-]?)\s*(\d+(?:[.,]\d+)?|[.,]\d+)\s*(ms|millisecondes?|s|sec|secondes?|%)?$/);
    if (!mt) {
      return { error: 'Saisie non reconnue. Tapez un nombre' + (key === 'cls' ? ', par exemple 0,08.' : key === 'inp' ? ', par exemple 240.' : ', par exemple 2,8.') };
    }
    var sign = mt[1];
    var v = parseFloat(mt[2].replace(',', '.'));
    var u = mt[3] || '';
    if (/^milli|^ms/.test(u)) u = 'ms'; else if (u && u !== '%') u = 's';
    var notes = [];
    if (sign === '-' && v !== 0) return { error: 'Une mesure ne peut pas être négative. Recopiez la valeur affichée par PageSpeed Insights.' };
    if (!isFinite(v)) return { error: 'Valeur illisible.' };

    if (key === 'lcp') {
      if (u === '%') return { error: 'Le LCP est une durée : indiquez des secondes (2,8) ou des millisecondes (2800 ms).' };
      if (u === 'ms') { v = v / 1000; notes.push('Converti : ' + fr(v * 1000, 0) + ' ms, soit ' + fr(v, 2) + ' s.'); }
      else if (!u && v >= 100) { v = v / 1000; notes.push('Sans unité et supérieur ou égal à 100 : lu en millisecondes, soit ' + fr(v, 2) + ' s.'); }
      if (v === 0) return { error: 'Un LCP de 0 seconde n\'est pas possible : relisez la valeur.' };
      if (v > 60) return { error: 'Plus d\'une minute : la valeur est peu plausible. S\'il s\'agit de millisecondes, ajoutez « ms ».' };
      if (v < 0.3) notes.push('Valeur très basse : vérifiez qu\'il s\'agit bien du LCP mobile.');
      return { value: v, notes: notes };
    }
    if (key === 'inp') {
      if (u === '%') return { error: 'L\'INP est une durée : indiquez des millisecondes, par exemple 240.' };
      if (u === 's') { v = v * 1000; notes.push('Converti : ' + fr(v, 0) + ' ms.'); }
      else if (!u && v > 0 && v < 1) { v = v * 1000; notes.push('Sans unité et inférieur à 1 : lu en secondes, soit ' + fr(v, 0) + ' ms.'); }
      if (v === 0) return { error: 'Un INP de 0 ms n\'est pas plausible : relisez la valeur.' };
      if (v > 20000) return { error: 'Plus de 20 secondes de réaction : la valeur est peu plausible. Vérifiez l\'unité.' };
      if (v < 10) notes.push('Valeur très basse : vérifiez qu\'il s\'agit bien de l\'INP, en millisecondes.');
      return { value: v, notes: notes };
    }
    // CLS
    if (u) return { error: 'Le CLS est un score sans unité (ni seconde, ni pourcentage). Tapez par exemple 0,08.' };
    if (v > 5) return { error: 'Valeur peu plausible pour un CLS. Recopiez le score tel qu\'il est affiché, par exemple 0,08.' };
    if (v > 1) notes.push('Valeur inhabituellement élevée : vérifiez la saisie.');
    return { value: v, notes: notes };
  }

  function grade(key, v) {
    var m = METRICS[key];
    if (v <= m.good) return 'ok';
    if (v <= m.limit) return 'warn';
    return 'bad';
  }
  var GRADE_LABEL = { ok: 'Vert : bon', warn: 'Orange : à améliorer', bad: 'Rouge : prioritaire' };

  var EXPLAIN = {
    lcp: {
      ok: 'Le contenu principal s\'affiche dans le seuil de 2,5 s. Sur WordPress, c\'est surtout le LCP qui pose problème : le vôtre est sous contrôle.',
      warn: 'Au-dessus du seuil de 2,5 s. C\'est l\'indicateur qui pose le plus souvent problème sur WordPress. À examiner : les images les plus lourdes, le thème et le constructeur de pages, le temps de réponse du serveur. Premières pistes sans refonte : compression et format moderne des images, cache bien configuré, hébergement adapté, CDN.',
      bad: 'Nettement au-dessus du seuil de 2,5 s. Commencez par le diagnostic : poids de la page, images les plus lourdes, temps de réponse du serveur, audit des extensions. Si un constructeur de pages lourd reste lent après optimisation, c\'est l\'un des critères de refonte.'
    },
    inp: {
      ok: 'La page réagit rapidement aux clics et aux saisies : le seuil de 200 ms est respecté.',
      warn: 'La réactivité dépasse le seuil de 200 ms. Parmi les causes listées dans l\'article, à examiner en priorité : scripts tiers, extensions nombreuses, thème et constructeur de pages lourds. Pistes : gestion des scripts tiers et nettoyage des extensions.',
      bad: 'Réactivité nettement au-dessus du seuil de 200 ms. Faites l\'audit des extensions et des scripts tiers : chaque élément inutile retiré allège la page. Si le constructeur de pages reste lent après optimisation, la refonte devient une option.'
    },
    cls: {
      ok: 'La mise en page reste stable pendant le chargement : le seuil de 0,1 est respecté.',
      warn: 'Des éléments se décalent pendant le chargement (seuil : 0,1). Le rapport PageSpeed Insights indique lesquels : c\'est le point de départ. Les causes précises sont à identifier lors d\'un audit (à valider).',
      bad: 'La page bouge nettement pendant le chargement (seuil : 0,1). Repérez dans PageSpeed Insights les éléments qui se décalent ; les causes précises sont à identifier lors d\'un audit (à valider).'
    }
  };

  /* ---------------------------------------------------------
     Cadrans SVG
     --------------------------------------------------------- */
  var A0 = -125, A1 = 125, CX = 150, CY = 150;
  function pt(r, a) { var t = a * Math.PI / 180; return [CX + r * Math.sin(t), CY - r * Math.cos(t)]; }
  function arc(r, a, b) {
    var p = pt(r, a), q = pt(r, b);
    return 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' A' + r + ' ' + r + ' 0 ' + (b - a > 180 ? 1 : 0) + ' 1 ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2);
  }
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function angleFor(key, v) {
    var m = METRICS[key];
    var f = Math.max(0, Math.min(1.035, v / m.max));
    return A0 + (A1 - A0) * f;
  }

  var gauges = {};
  function buildGauge(key) {
    var m = METRICS[key];
    var host = document.getElementById('dial-' + key);
    var svg = el('svg', { viewBox: '0 0 300 296', 'aria-hidden': 'true', focusable: 'false' });
    var defs = el('defs', {}, svg);
    var lg = el('linearGradient', { id: 'glass-' + key, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.10' }, lg);
    el('stop', { offset: '.5', 'stop-color': '#fff', 'stop-opacity': '0' }, lg);

    el('circle', { cx: CX, cy: CY, r: 140, class: 'g-bezel' }, svg);
    el('circle', { cx: CX, cy: CY, r: 130, class: 'g-face' }, svg);
    var span = A1 - A0;
    var aGood = A0 + span * (m.good / m.max), aLim = A0 + span * (m.limit / m.max);
    el('path', { d: arc(112, A0, aGood), class: 'g-zone g-zone--ok' }, svg);
    el('path', { d: arc(112, aGood, aLim), class: 'g-zone g-zone--warn' }, svg);
    el('path', { d: arc(112, aLim, A1), class: 'g-zone g-zone--bad' }, svg);

    var steps = Math.round(m.max / m.minor);
    for (var i = 0; i <= steps; i++) {
      var v = i * m.minor, a = A0 + span * (v / m.max);
      var isMajor = Math.abs(v / m.major - Math.round(v / m.major)) < 1e-6;
      var isMid = !isMajor && Math.abs((v / (m.major / 2)) - Math.round(v / (m.major / 2))) < 1e-6;
      var r1 = isMajor ? 86 : isMid ? 92 : 96, p = pt(r1, a), q = pt(103, a);
      el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'g-tick' + (isMajor || isMid ? ' g-tick--major' : '') }, svg);
      if (isMajor) {
        var lp = pt(68, a), cls = 'g-num';
        var label = fr(v, m.dec);
        if (Math.abs(v - m.good) < 1e-9) cls += ' g-num--seuil';
        if (Math.abs(v - m.limit) < 1e-9) { cls += ' g-num--limit'; label += '*'; }
        if (Math.abs(v - m.max) < 1e-9) label += '+';
        var t = el('text', { x: lp[0].toFixed(1), y: (lp[1] + 5).toFixed(1), 'text-anchor': 'middle', class: cls }, svg);
        t.textContent = label;
      }
    }
    var value = el('text', { x: CX, y: 222, 'text-anchor': 'middle', class: 'g-value' }, svg);
    value.textContent = '– –';
    var code = el('text', { x: CX, y: 252, 'text-anchor': 'middle', class: 'g-code' }, svg);
    code.textContent = m.code;
    var unit = el('text', { x: CX, y: 270, 'text-anchor': 'middle', class: 'g-unit' }, svg);
    unit.textContent = (m.unit ? m.unit.toUpperCase() + ' · ' : '') + 'MOBILE';

    // butée
    var stop = pt(118, A0 - 6);
    el('circle', { cx: stop[0], cy: stop[1], r: 4, fill: '#8b929b' }, svg);

    var shadow = el('g', { class: 'g-needle-shadow' }, svg);
    el('path', { d: 'M150 172 L145 150 L150 40 L155 150 Z', transform: 'translate(3 4)' }, shadow);
    var needle = el('g', { class: 'g-needle' }, svg);
    el('path', { d: 'M150 172 L145 150 L150 40 L155 150 Z' }, needle);
    el('circle', { cx: CX, cy: CY, r: 13, class: 'g-hub' }, svg);
    el('circle', { cx: CX, cy: CY, r: 4, class: 'g-hub-dot' }, svg);
    el('path', { d: 'M40 120 A112 112 0 0 1 260 120 L260 60 A140 140 0 0 0 40 60 Z', fill: 'url(#glass-' + key + ')', 'pointer-events': 'none' }, svg);

    host.appendChild(svg);
    var g = { svg: svg, needle: needle, shadow: shadow, value: value, angle: A0, vel: 0, target: A0 };
    gauges[key] = g;
    setNeedle(g, A0);
    svg.classList.add('g-off');
  }
  function setNeedle(g, a) {
    g.needle.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' ' + CX + ' ' + CY + ')');
    g.shadow.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' ' + CX + ' ' + CY + ')');
  }

  // Aiguilles amorties : ressort légèrement sous-amorti
  var rafId = null, lastT = 0;
  function tick(t) {
    var dt = Math.min(0.033, (t - lastT) / 1000 || 0.016);
    lastT = t;
    var moving = false;
    Object.keys(gauges).forEach(function (k) {
      var g = gauges[k];
      var acc = 90 * (g.target - g.angle) - 10 * g.vel;
      g.vel += acc * dt;
      g.angle += g.vel * dt;
      if (Math.abs(g.target - g.angle) > 0.05 || Math.abs(g.vel) > 0.05) moving = true;
      else { g.angle = g.target; g.vel = 0; }
      setNeedle(g, g.angle);
    });
    rafId = moving ? requestAnimationFrame(tick) : null;
  }
  function moveTo(key, a) {
    var g = gauges[key];
    g.target = a;
    if (reduceMotion) { g.angle = a; g.vel = 0; setNeedle(g, a); return; }
    if (!rafId) { lastT = performance.now(); rafId = requestAnimationFrame(tick); }
  }

  /* ---------------------------------------------------------
     Onglet 1 : mesures
     --------------------------------------------------------- */
  var results = { lcp: null, inp: null, cls: null };

  function readMetric(key, announce) {
    var input = document.getElementById('in-' + key);
    var msg = document.getElementById('msg-' + key);
    var lcd = input.parentNode;
    var r = parseMeasure(key, input.value);
    var g = gauges[key];
    state.measures[key] = input.value;
    if (r.empty || r.error) {
      results[key] = null;
      g.svg.classList.add('g-off');
      g.value.textContent = '– –';
      moveTo(key, A0);
      input.removeAttribute('aria-invalid');
      lcd.removeAttribute('data-state');
      if (r.error) {
        if (announce) {
          input.setAttribute('aria-invalid', 'true');
          lcd.setAttribute('data-state', 'error');
          msg.innerHTML = '<p class="msg msg--error">' + r.error + '</p>';
        } else msg.innerHTML = '';
      } else msg.innerHTML = '';
      return r;
    }
    var gr = grade(key, r.value);
    results[key] = { value: r.value, grade: gr };
    input.removeAttribute('aria-invalid');
    lcd.removeAttribute('data-state');
    g.svg.classList.remove('g-off');
    g.value.textContent = fmt(key, r.value).replace(/ (s|ms)$/, '');
    moveTo(key, angleFor(key, r.value));
    var html = '<p class="status status--' + gr + '">' + GRADE_LABEL[gr] + ' · ' + fmt(key, r.value) + '</p>' +
      '<p class="explain">' + EXPLAIN[key][gr] + '</p>';
    if (r.value > METRICS[key].max) html += '<p class="msg msg--note">Au-delà de la fin du cadran : l\'aiguille reste en butée.</p>';
    r.notes.forEach(function (n) { html += '<p class="msg msg--note">' + n + '</p>'; });
    msg.innerHTML = html;
    return r;
  }

  function renderReadout(focus) {
    var box = document.getElementById('readout');
    var keys = ['lcp', 'inp', 'cls'];
    var read = keys.filter(function (k) { return results[k]; });
    if (!read.length) { box.innerHTML = ''; return; }
    var greens = read.filter(function (k) { return results[k].grade === 'ok'; }).length;
    var order = { bad: 2, warn: 1, ok: 0 };
    var worst = read.slice().sort(function (a, b) { return order[results[b].grade] - order[results[a].grade]; })[0];
    var html = '<p class="readout__big"><em>' + greens + '</em> cadran' + (greens > 1 ? 's' : '') + ' sur ' + read.length + ' au vert</p>';
    if (read.length < 3) {
      var miss = keys.filter(function (k) { return !results[k]; }).map(function (k) { return METRICS[k].code; });
      html += '<p>Lecture partielle : il manque ' + miss.join(' et ') + '. Complétez pour un relevé complet.</p>';
    }
    if (greens === read.length) {
      html += '<p>Les valeurs saisies respectent les seuils de l\'article. Si le site vous semble pourtant lent, mesurez d\'autres pages importantes : la page d\'accueil n\'est pas toujours la plus lourde. Le second volet aide aussi à décider pour d\'autres raisons (design daté, piratage passé, accumulation d\'extensions).</p>';
    } else {
      html += '<p>Priorité : le <strong>' + METRICS[worst].code + '</strong> (' + METRICS[worst].name + '), en ' + (results[worst].grade === 'bad' ? 'rouge' : 'orange') + '. Une mesure hors seuil ne dit pas encore s\'il faut optimiser ou refaire : c\'est l\'objet du second volet.</p>';
    }
    html += '<button type="button" class="btn btn--orange" data-goto="verdict">Passer au volet 02 : optimiser ou refaire ?</button>';
    box.innerHTML = html;
    if (focus) box.focus({ preventScroll: false });
  }

  function initMesures() {
    ['lcp', 'inp', 'cls'].forEach(buildGauge);
    var form = document.getElementById('form-mesures');
    var timers = {};
    ['lcp', 'inp', 'cls'].forEach(function (k) {
      var input = document.getElementById('in-' + k);
      input.value = state.measures[k] || '';
      input.addEventListener('input', function () {
        clearTimeout(timers[k]);
        timers[k] = setTimeout(function () { readMetric(k, false); renderReadout(false); save(); }, 350);
      });
      input.addEventListener('blur', function () { clearTimeout(timers[k]); readMetric(k, true); renderReadout(false); save(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); });
      var firstErr = null, anyValue = false;
      ['lcp', 'inp', 'cls'].forEach(function (k) {
        var r = readMetric(k, true);
        if (r.error && !firstErr) firstErr = k;
        if (!r.empty && !r.error) anyValue = true;
      });
      save();
      if (firstErr) { document.getElementById('in-' + firstErr).focus(); renderReadout(false); return; }
      if (!anyValue) {
        document.getElementById('readout').innerHTML = '<p class="msg msg--error">Aucune mesure saisie. Relevez au moins une valeur dans PageSpeed Insights (version mobile), puis cliquez de nouveau sur « Lire les cadrans ».</p>';
        document.getElementById('in-lcp').focus();
        return;
      }
      renderReadout(true);
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        ['lcp', 'inp', 'cls'].forEach(function (k) { state.measures[k] = ''; readMetric(k, false); });
        document.getElementById('readout').innerHTML = '';
        save();
        document.getElementById('in-lcp').focus();
      }, 0);
    });
    document.getElementById('mesures-exemple').addEventListener('click', function () {
      // valeurs d'exemple fictives, sans lien avec un site réel
      var ex = { lcp: '3,9', inp: '180', cls: '0,14' };
      ['lcp', 'inp', 'cls'].forEach(function (k) { document.getElementById('in-' + k).value = ex[k]; readMetric(k, true); });
      save();
      renderReadout(false);
      var box = document.getElementById('readout');
      box.insertAdjacentHTML('afterbegin', '<p class="msg msg--note">Valeurs d\'exemple fictives, à remplacer par vos propres mesures.</p>');
    });
    document.getElementById('readout').addEventListener('click', function (e) {
      var b = e.target.closest('[data-goto]');
      if (b) { selectTab(b.getAttribute('data-goto'), true); }
    });
    // restauration
    var any = false;
    ['lcp', 'inp', 'cls'].forEach(function (k) { if (state.measures[k]) { readMetric(k, true); any = true; } });
    if (any) renderReadout(false);
  }

  /* ---------------------------------------------------------
     Onglet 2 : questions (critères tirés de l'article)
     r : poids « refonte » (critères « Quand refaire » de l'article)
     o : levier d'optimisation sans refonte (causes + optimisations de l'article)
     --------------------------------------------------------- */
  var QUESTIONS = [
    { id: 'builder', topic: 'Thème et constructeur de pages', q: 'Votre site repose-t-il sur un constructeur de pages ?',
      why: 'Un thème et un constructeur de pages lourds font partie des causes principales de lenteur. S\'il reste lent après optimisation, l\'article y voit un critère de refonte.',
      opts: [
        { t: 'Non', s: 'Éditeur standard et thème léger.' },
        { t: 'Oui, jamais optimisé', s: 'Aucune optimisation sérieuse n\'a encore été tentée.', o: ['builder'] },
        { t: 'Oui, et il reste lent malgré les optimisations', s: 'Cache, images, extensions : c\'est déjà fait, sans effet suffisant.', r: 2, key: 'builderStuck' },
        { t: 'Je ne sais pas', s: 'L\'audit du diagnostic vous le dira.', o: ['builder'] }
      ] },
    { id: 'plugins', topic: 'Extensions', q: 'Où en sont vos extensions ?',
      why: 'Des extensions nombreuses ralentissent le site ; leur accumulation figure parmi les critères de refonte.',
      opts: [
        { t: 'Peu nombreuses, toutes utiles', s: 'Chacune a un rôle clair.' },
        { t: 'Nombreuses, mais maîtrisées', s: 'Nous savons à quoi chacune sert.', o: ['plugins'] },
        { t: 'Accumulées au fil des années', s: 'Certaines ne servent plus, personne n\'ose y toucher.', r: 1, key: 'pluginsPile', o: ['plugins'] },
        { t: 'Je ne sais pas', s: '', o: ['plugins'] }
      ] },
    { id: 'images', topic: 'Images', q: 'Comment vos images sont-elles préparées ?',
      why: 'Les images non optimisées sont une cause principale de lenteur, et l\'une des plus simples à corriger.',
      opts: [
        { t: 'Compressées, au format moderne', s: 'Elles sont redimensionnées avant mise en ligne.' },
        { t: 'Mises en ligne telles quelles', s: 'Photos d\'appareil ou de téléphone, parfois très lourdes.', o: ['images'] },
        { t: 'Je ne sais pas', s: '', o: ['images'] }
      ] },
    { id: 'hosting', topic: 'Hébergement', q: 'Quel type d\'hébergement utilisez-vous ?',
      why: 'Un hébergement d\'entrée de gamme pèse sur le temps de réponse du serveur ; un hébergement adapté fait partie des optimisations sans refonte.',
      opts: [
        { t: 'Une offre adaptée au site', s: 'Choisie en fonction de son trafic et de ses besoins.' },
        { t: 'Une offre d\'entrée de gamme', s: 'La moins chère, souvent mutualisée.', o: ['hosting'] },
        { t: 'Je ne sais pas', s: '', o: ['hosting'] }
      ] },
    { id: 'scripts', topic: 'Scripts tiers', q: 'Combien de services extérieurs sont chargés sur vos pages ?',
      why: 'Fenêtre de discussion, outils de suivi, vidéos ou widgets intégrés : les scripts tiers sont une cause principale de lenteur, à gérer plutôt qu\'à subir.',
      opts: [
        { t: 'Aucun ou presque', s: '' },
        { t: 'Quelques-uns', s: 'Deux ou trois services, choisis volontairement.', o: ['scripts'] },
        { t: 'Beaucoup, ajoutés au fil du temps', s: 'Personne n\'en a la liste complète.', o: ['scripts'] },
        { t: 'Je ne sais pas', s: '', o: ['scripts'] }
      ] },
    { id: 'updates', topic: 'Fréquence de modification', q: 'À quelle fréquence le site est-il modifié ?',
      why: 'Un site vitrine peu modifié fait partie des cas où l\'article envisage une refonte.',
      opts: [
        { t: 'Très souvent', s: 'Actualités, articles ou produits ajoutés régulièrement.' },
        { t: 'De temps en temps', s: 'Quelques mises à jour dans l\'année.' },
        { t: 'Presque jamais', s: 'Un site vitrine qui change très peu.', r: 1, key: 'vitrine' }
      ] },
    { id: 'hacked', topic: 'Sécurité', q: 'Le site a-t-il déjà été piraté ?',
      why: 'Un piratage passé figure parmi les critères de refonte cités par l\'article.',
      opts: [
        { t: 'Non, à notre connaissance', s: '' },
        { t: 'Oui, au moins une fois', s: 'Même s\'il a été nettoyé depuis.', r: 1, key: 'hacked' },
        { t: 'Je ne sais pas', s: 'À vérifier lors de l\'audit.' }
      ] },
    { id: 'design', topic: 'Design', q: 'Que pensez-vous du design actuel ?',
      why: 'Un design daté est le dernier critère de refonte cité par l\'article.',
      opts: [
        { t: 'Il nous convient', s: 'Il reflète encore bien l\'activité.' },
        { t: 'Il commence à vieillir', s: 'Rien d\'urgent, mais on le remarque.' },
        { t: 'Il est daté', s: 'Il ne correspond plus à l\'image que nous voulons donner.', r: 1, key: 'design' }
      ] }
  ];

  var SIGNAL_TEXT = {
    builderStuck: 'Constructeur de pages lourd qui reste lent après optimisation.',
    pluginsPile: 'Accumulation d\'extensions.',
    vitrine: 'Site vitrine peu modifié.',
    hacked: 'Piratage passé.',
    design: 'Design daté.'
  };
  var LEVER_TEXT = {
    builder: 'Thème et constructeur de pages : à mesurer avant et après optimisation.',
    plugins: 'Extensions nombreuses : un nettoyage s\'impose.',
    images: 'Images : compression et format moderne à appliquer.',
    hosting: 'Hébergement : vérifier qu\'il est adapté, et le temps de réponse du serveur.',
    scripts: 'Scripts tiers : à recenser et à gérer.'
  };

  function computeVerdict() {
    var R = 0, signals = [], levers = [];
    QUESTIONS.forEach(function (q) {
      var i = state.answers[q.id];
      if (typeof i !== 'number' || !q.opts[i]) return;
      var o = q.opts[i];
      if (o.r) { R += o.r; signals.push(o.key); }
      (o.o || []).forEach(function (l) { if (levers.indexOf(l) < 0) levers.push(l); });
    });
    var stuck = signals.indexOf('builderStuck') >= 0;
    var v;
    if (R >= 3) v = 'refaire';
    else if (R === 2) v = (stuck && levers.length === 0) ? 'refaire' : 'reevaluer';
    else v = 'optimiser';
    return { verdict: v, score: R, signals: signals, levers: levers };
  }

  var quizStep = 0;
  function renderLamps() {
    var ol = document.getElementById('quiz-lamps');
    ol.innerHTML = QUESTIONS.map(function (q, i) {
      var c = (typeof state.answers[q.id] === 'number' ? 'is-done' : '') + (i === quizStep ? ' is-current' : '');
      return '<li class="' + c + '">' + (i + 1) + '</li>';
    }).join('');
  }
  function renderQuestion(focus) {
    var q = QUESTIONS[quizStep];
    var host = document.getElementById('quiz-question');
    var html = '<div class="q' + (focus && !reduceMotion ? ' q-enter' : '') + '"><fieldset aria-describedby="why-' + q.id + '">' +
      '<legend tabindex="-1" id="legend-' + q.id + '"><span class="q__topic">' + q.topic + '</span>' + q.q + '</legend>' +
      '<p class="q__why" id="why-' + q.id + '">' + q.why + '</p><div class="q__opts">';
    q.opts.forEach(function (o, i) {
      var id = 'q-' + q.id + '-' + i;
      html += '<label class="opt" for="' + id + '"><input type="radio" name="' + q.id + '" id="' + id + '" value="' + i + '"' +
        (state.answers[q.id] === i ? ' checked' : '') + '>' +
        '<span class="opt__box"><span class="opt__switch" aria-hidden="true"></span><span class="opt__text"><span class="opt__title">' + o.t + '</span>' +
        (o.s ? '<span class="opt__sub">' + o.s + '</span>' : '') + '</span></span></label>';
    });
    html += '</div></fieldset></div>';
    host.innerHTML = html;
    document.getElementById('quiz-count').textContent = 'Question ' + (quizStep + 1) + ' sur ' + QUESTIONS.length;
    document.getElementById('quiz-error').textContent = '';
    document.getElementById('quiz-prev').disabled = quizStep === 0;
    document.getElementById('quiz-next').textContent = quizStep === QUESTIONS.length - 1 ? 'Voir le verdict' : 'Suivant';
    renderLamps();
    if (focus) document.getElementById('legend-' + q.id).focus();
  }

  var busy = false;
  function showVerdict(focus) {
    var res = computeVerdict();
    var quiz = document.getElementById('quiz');
    var box = document.getElementById('verdict');
    quiz.hidden = true;
    box.hidden = false;
    box.innerHTML = verdictHTML(res);
    state.verdict = true;
    save();
    bindChecks(res.verdict);
    if (focus) {
      box.focus();
      box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    var on = box.querySelector('.lamp.is-on');
    if (on && !reduceMotion) on.classList.add('flick');
  }
  function hideVerdict() {
    document.getElementById('verdict').hidden = true;
    document.getElementById('quiz').hidden = false;
    state.verdict = false;
    save();
  }

  function check(id, html) {
    return '<li><label class="check"><input type="checkbox" data-check="' + id + '"><span class="check__t">' + html + '</span></label></li>';
  }

  function verdictHTML(res) {
    var v = res.verdict;
    var title, lead, lampOn;
    if (v === 'optimiser') {
      lampOn = 'green';
      title = 'Optimiser';
      lead = res.levers.length
        ? 'Vos réponses pointent surtout des causes qui se corrigent sans refonte. Commencez par là, puis remesurez.'
        : 'Vos réponses ne font apparaître ni cause évidente de lenteur, ni critère de refonte marqué. Le diagnostic complet (étapes ci-dessous) dira où se cache le problème.';
    } else if (v === 'reevaluer') {
      lampOn = 'amber';
      title = 'Optimiser<span class="then">puis</span>réévaluer';
      lead = 'Deux signaux de refonte apparaissent, mais des leviers d\'optimisation restent inexploités. Optimisez d\'abord : si le site reste lent ou si les critères de refonte se confirment, la refonte deviendra la bonne décision.';
    } else {
      lampOn = 'red';
      title = 'Refaire';
      lead = 'Plusieurs critères de refonte cités par l\'article se cumulent. Optimiser un site dans cette situation risque de coûter des efforts sans régler le fond. Une refonte bien préparée, qui protège votre référencement, est la voie la plus solide.';
    }

    var measuresLine = '';
    var read = ['lcp', 'inp', 'cls'].filter(function (k) { return results[k]; });
    if (read.length) {
      var allOk = read.every(function (k) { return results[k].grade === 'ok'; });
      measuresLine = '<p class="verdict__note"><strong>Vos mesures (volet 01) :</strong> ' + read.map(function (k) {
        var g = results[k].grade;
        return METRICS[k].code + ' ' + fmt(k, results[k].value) + ' (' + (g === 'ok' ? 'vert' : g === 'warn' ? 'orange' : 'rouge') + ')';
      }).join(' · ') + '.' + (allOk ? ' Elles respectent les seuils : la vitesse n\'est peut-être pas votre problème principal, et le verdict repose alors surtout sur les autres critères.' : '') + '</p>';
    } else {
      measuresLine = '<p class="verdict__note">Vous n\'avez pas encore saisi vos mesures. Le volet 01 permet de situer votre LCP, votre INP et votre CLS par rapport aux seuils.</p>';
    }

    var sig = '';
    res.signals.forEach(function (k) { sig += '<li><span class="tag tag--refonte">Refonte</span><span>' + SIGNAL_TEXT[k] + '</span></li>'; });
    res.levers.forEach(function (k) { sig += '<li><span class="tag tag--optim">Optimisable</span><span>' + LEVER_TEXT[k] + '</span></li>'; });
    if (!sig) sig = '<li><span class="tag tag--optim">Rien à signaler</span><span>Aucune de vos réponses ne correspond à une cause ou à un critère de refonte de l\'article.</span></li>';

    // ---- plan d'action
    var pre = check('d-psi', '<b>Mesurer</b> la page d\'accueil et les pages clés dans PageSpeed Insights, en version mobile.') +
      check('d-poids', '<b>Relever le poids de la page</b> et repérer les images les plus lourdes.') +
      check('d-ext', '<b>Auditer les extensions</b> : utilité, doublons, extensions abandonnées.') +
      check('d-ttfb', '<b>Mesurer le temps de réponse du serveur.</b>');

    var plan = '';
    if (v === 'refaire') {
      plan += '<p class="phase">Préparer la refonte</p><ol class="checks">' +
        check('r-cont', '<b>Reprendre les contenus utiles</b> : pages, textes et articles qui servent encore.') +
        check('r-url', '<b>Lister les adresses actuelles</b> pour les conserver ou préparer leurs redirections 301.') +
        check('r-leger', '<b>Construire léger</b> : ne pas reproduire les causes de lenteur (thème et constructeur lourds, extensions nombreuses, images non optimisées, hébergement d\'entrée de gamme, scripts tiers).') +
        '</ol><p class="phase">Après la mise en ligne</p><ol class="checks">' +
        check('r-sm', '<b>Soumettre le nouveau plan de site</b> à Search Console.') +
        check('r-mes', '<b>Remesurer</b> dans PageSpeed Insights (mobile) : LCP 2,5 s ou moins, INP 200 ms ou moins, CLS 0,1 ou moins.') +
        '</ol>';
    } else {
      var opt = '';
      if (res.levers.indexOf('images') >= 0) opt += check('o-img', '<b>Images</b> : compression et format moderne.');
      if (res.levers.indexOf('plugins') >= 0) opt += check('o-ext', '<b>Nettoyer les extensions</b> : retirer celles qui ne servent plus.');
      if (res.levers.indexOf('scripts') >= 0) opt += check('o-scr', '<b>Gérer les scripts tiers</b> : ne garder que ceux qui servent vraiment.');
      if (res.levers.indexOf('hosting') >= 0) opt += check('o-host', '<b>Passer à un hébergement adapté</b> si le temps de réponse du serveur est en cause.');
      opt += check('o-cache', '<b>Configurer correctement le cache.</b>');
      opt += check('o-font', '<b>Héberger les polices localement.</b>');
      opt += check('o-cdn', '<b>Envisager un CDN.</b>');
      if (res.levers.indexOf('builder') >= 0) opt += check('o-build', '<b>Remesurer les pages du constructeur</b> après ces réglages : s\'il reste lent, c\'est un critère de refonte.');
      plan += '<p class="phase">Optimiser sans refonte</p><ol class="checks">' + opt + '</ol>';
      plan += '<p class="phase">Contrôler</p><ol class="checks">' +
        check('c-mes', '<b>Remesurer</b> dans PageSpeed Insights (mobile) et comparer : LCP 2,5 s ou moins, INP 200 ms ou moins, CLS 0,1 ou moins.');
      if (v === 'reevaluer') {
        plan += check('c-reeval', '<b>Réévaluer</b> avec les critères de refonte : constructeur lourd toujours lent, site vitrine peu modifié, accumulation d\'extensions, piratage passé, design daté.');
      }
      plan += '</ol>';
    }

    var seoTitle = v === 'refaire' ? 'Pendant la refonte' : 'Si vous refaites un jour';
    var seo = '<ol class="checks">' +
      check('s-url', '<b>Conserver les adresses</b> des pages, ou mettre en place des <b>redirections 301</b> de chaque ancienne adresse vers la nouvelle.') +
      check('s-cont', '<b>Reprendre les contenus utiles</b> plutôt que repartir d\'une page blanche.') +
      check('s-sm', '<b>Soumettre le nouveau plan de site</b> à Search Console dès la mise en ligne.') +
      '</ol>';

    return '' +
      '<div class="verdict__top">' +
        '<div class="light-col"><div class="tlight" role="img" aria-label="Feu : ' + (lampOn === 'red' ? 'rouge, refaire' : lampOn === 'amber' ? 'orange, optimiser puis réévaluer' : 'vert, optimiser') + '">' +
          '<div class="lamp lamp--red' + (lampOn === 'red' ? ' is-on' : '') + '"><span>Refaire</span></div>' +
          '<div class="lamp lamp--amber' + (lampOn === 'amber' ? ' is-on' : '') + '"><span>Optimiser puis réévaluer</span></div>' +
          '<div class="lamp lamp--green' + (lampOn === 'green' ? ' is-on' : '') + '"><span>Optimiser</span></div>' +
        '</div></div>' +
        '<div class="verdict__main">' +
          '<p class="verdict__eyebrow">Verdict indicatif · ' + res.score + ' point' + (res.score > 1 ? 's' : '') + ' de refonte sur 6</p>' +
          '<h3 class="verdict__title" id="verdict-title">' + title + '</h3>' +
          '<p class="verdict__lead">' + lead + '</p>' + measuresLine +
          '<ul class="signals" aria-label="Ce qui fonde le verdict">' + sig + '</ul>' +
        '</div>' +
      '</div>' +
      '<div class="preflight">' +
        '<div class="preflight__col"><h4 class="preflight__h"><small>Check-list de pré-vol</small>Plan d\'action</h4>' +
          '<p class="phase">Diagnostic</p><ol class="checks">' + pre + '</ol>' + plan +
        '</div>' +
        '<div class="preflight__col preflight__col--seo"><h4 class="preflight__h"><small>Référencement</small>' + seoTitle + '</h4>' +
          '<p>Une refonte mal préparée peut faire perdre les positions acquises dans les résultats de recherche. Trois précautions relevées dans l\'article :</p>' + seo +
        '</div>' +
      '</div>' +
      '<div class="verdict__foot">' +
        '<div class="verdict__actions">' +
          '<button type="button" class="btn btn--dark" data-act="edit">Modifier mes réponses</button>' +
          '<button type="button" class="btn btn--ghost" data-act="print">Imprimer le diagnostic</button>' +
          '<button type="button" class="btn btn--ghost" data-act="restart">Recommencer</button>' +
        '</div>' +
        '<p class="verdict__contact">Pour approfondir, <a href="https://www.sakinadz.com/blog/services/wordpress-lent-optimiser-ou-refaire-site" rel="noopener">lisez l\'article complet</a>, ou parlez-en avec nous : <a href="tel:+213000000000">+213 00 00 00 00</a>, <a href="https://wa.me/213000000000" rel="noopener">WhatsApp</a>, <a href="mailto:contact@exemple.dz">contact@exemple.dz</a>.</p>' +
        '<p class="verdict__disclaimer">Verdict indicatif, calculé dans votre navigateur à partir de vos seules réponses et des critères de l\'article. Il ne remplace pas un audit du site. Démonstration : aucune donnée n\'est envoyée.</p>' +
      '</div>';
  }

  function bindChecks(v) {
    var box = document.getElementById('verdict');
    box.querySelectorAll('[data-check]').forEach(function (c) {
      var id = v + ':' + c.getAttribute('data-check');
      c.checked = !!state.checks[id];
      c.addEventListener('change', function () { state.checks[id] = c.checked; if (!c.checked) delete state.checks[id]; save(); });
    });
  }

  function initQuiz() {
    quizStep = state.step;
    var form = document.getElementById('quiz-form');
    form.addEventListener('change', function (e) {
      if (e.target.type !== 'radio') return;
      state.answers[e.target.name] = parseInt(e.target.value, 10);
      document.getElementById('quiz-error').textContent = '';
      renderLamps();
      save();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var q = QUESTIONS[quizStep];
      if (typeof state.answers[q.id] !== 'number') {
        document.getElementById('quiz-error').textContent = 'Choisissez une réponse pour continuer' + (q.opts.some(function (o) { return o.t === 'Je ne sais pas'; }) ? ' (« Je ne sais pas » est une réponse valable).' : '.');
        var first = form.querySelector('input[name="' + q.id + '"]');
        if (first) first.focus();
        return;
      }
      if (quizStep < QUESTIONS.length - 1) {
        quizStep++; state.step = quizStep; save();
        renderQuestion(true);
        return;
      }
      // toutes les réponses sont-elles là ?
      var missing = QUESTIONS.findIndex(function (qq) { return typeof state.answers[qq.id] !== 'number'; });
      if (missing >= 0) {
        quizStep = missing; state.step = missing; save();
        renderQuestion(true);
        document.getElementById('quiz-error').textContent = 'Cette question est restée sans réponse.';
        return;
      }
      busy = true;
      var btn = document.getElementById('quiz-next');
      btn.disabled = true;
      btn.textContent = 'Lecture des réponses…';
      setTimeout(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = 'Voir le verdict';
        showVerdict(true);
      }, reduceMotion ? 0 : 420);
    });
    document.getElementById('quiz-prev').addEventListener('click', function () {
      if (quizStep > 0) { quizStep--; state.step = quizStep; save(); renderQuestion(true); }
    });
    function restart() {
      state.answers = {}; state.checks = {}; state.step = 0; quizStep = 0;
      hideVerdict();
      renderQuestion(true);
    }
    document.getElementById('quiz-reset').addEventListener('click', restart);
    document.getElementById('verdict').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'edit') { hideVerdict(); quizStep = QUESTIONS.length - 1; state.step = quizStep; save(); renderQuestion(true); }
      else if (act === 'restart') restart();
      else if (act === 'print') window.print();
    });
    renderQuestion(false);
    var complete = QUESTIONS.every(function (q) { return typeof state.answers[q.id] === 'number'; });
    if (state.verdict && complete) showVerdict(false);
  }

  /* ---------------------------------------------------------
     Onglets (motif ARIA tablist, activation automatique)
     --------------------------------------------------------- */
  var tabs = [document.getElementById('tab-mesures'), document.getElementById('tab-verdict')];
  function selectTab(name, focusPanel) {
    tabs.forEach(function (t) {
      var on = t.id === 'tab-' + name;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    state.tab = name;
    save();
    if (name === 'verdict' && !document.getElementById('verdict').hidden) {
      // relevé de mesures éventuellement modifié entre-temps
      showVerdict(false);
    }
    if (focusPanel) {
      var tab = document.getElementById('tab-' + name);
      tab.focus();
      document.getElementById('outil').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function initTabs() {
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t.id.replace('tab-', ''), false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        selectTab(tabs[n].id.replace('tab-', ''), false);
        tabs[n].focus();
      });
    });
    selectTab(state.tab, false);
  }

  /* ---------------------------------------------------------
     Chronomètre signature (exemple illustratif, non mesuré)
     Cadran 0–10 s ; 2,5 s = 90°. « Après » s'arrête sous le repère,
     « avant » bien au-delà. Aucune valeur chiffrée n'est affichée.
     --------------------------------------------------------- */
  function initChrono() {
    var g = document.getElementById('chrono-ticks');
    var cx = 160, cy = 200;
    function p(r, a) { var t = a * Math.PI / 180; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; }
    for (var i = 0; i < 50; i++) {
      var a = i * 7.2, major = i % 5 === 0;
      var a1 = p(major ? 108 : 118, a), a2 = p(126, a);
      el('line', { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], class: 'chrono__tick' + (major ? ' chrono__tick--major' : '') }, g);
      if (major) {
        var tp = p(90, a);
        var t = el('text', { x: tp[0].toFixed(1), y: (tp[1] + 7).toFixed(1), 'text-anchor': 'middle', class: 'chrono__num' }, g);
        t.textContent = String(i / 5);
      }
    }
    var s = p(131, 0.5), e = p(131, 90);
    document.getElementById('chrono-good').setAttribute('d', 'M' + s[0] + ' ' + s[1] + ' A131 131 0 0 1 ' + e[0] + ' ' + e[1]);
    var lp = p(62, 45);
    var lab = el('text', { x: lp[0].toFixed(1), y: lp[1].toFixed(1), 'text-anchor': 'middle', class: 'chrono__seuil' }, g);
    lab.textContent = '2,5 s';

    var before = document.getElementById('hand-before'), after = document.getElementById('hand-after');
    var replay = document.getElementById('chrono-replay');
    function set(h, a) { h.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' 160 200)'); }
    if (reduceMotion || !window.requestAnimationFrame) return;
    replay.hidden = false;
    var running = false;
    function run() {
      if (running) return;
      running = true;
      var t0 = null, END_B = 252, END_A = 72, SPEED = 95; // degrés par seconde d'animation
      function frame(t) {
        if (t0 === null) t0 = t;
        var deg = (t - t0) / 1000 * SPEED;
        set(after, Math.min(deg, END_A));
        set(before, Math.min(deg, END_B));
        if (deg < END_B) requestAnimationFrame(frame); else running = false;
      }
      set(after, 0); set(before, 0);
      requestAnimationFrame(frame);
    }
    replay.addEventListener('click', run);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); setTimeout(run, 400); }
      }, { threshold: 0.5 });
      io.observe(document.querySelector('.chrono'));
    }
  }

  /* ---------------------------------------------------------
     Apparitions au défilement (contenu visible sans JS)
     --------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.tool__head, .tabs, .cta-band__title, .cta-band__text');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n) { n.classList.add('reveal'); io.observe(n); });
    window.addEventListener('beforeprint', function () { items.forEach(function (n) { n.classList.add('is-in'); }); });
  }

  function initForget() {
    document.getElementById('forget').addEventListener('click', function () {
      forget();
      state = { tab: state.tab, measures: { lcp: '', inp: '', cls: '' }, answers: {}, step: 0, verdict: false, checks: {} };
      ['lcp', 'inp', 'cls'].forEach(function (k) { document.getElementById('in-' + k).value = ''; readMetric(k, false); });
      document.getElementById('readout').innerHTML = '';
      quizStep = 0;
      document.getElementById('verdict').hidden = true;
      document.getElementById('quiz').hidden = false;
      renderQuestion(false);
      forget();
      document.getElementById('forget-msg').textContent = 'Données locales effacées.';
    });
  }

  load();
  initChrono();
  initMesures();
  initQuiz();
  initTabs();
  initReveal();
  initForget();
})();
