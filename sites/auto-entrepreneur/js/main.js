/* Bois & Main – interactions (JavaScript vanilla, aucune dépendance) */
(function () {
  'use strict';

  var WA_BASE = 'https://wa.me/213000000000';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;

  /* ---------- Hauteur réelle de la barre du haut ---------- */
  var top = document.getElementById('top');
  function setTopHeight() {
    if (top) root.style.setProperty('--top-h', top.offsetHeight + 'px');
  }
  setTopHeight();
  window.addEventListener('resize', setTopHeight);

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      setTopHeight();
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Mètre ruban : progression de lecture ---------- */
  var blade = document.querySelector('.tape__blade');
  var ruler = document.querySelector('.tape__ruler');
  var reading = document.querySelector('.tape__read');
  var PX_PER_CM = 8;
  function buildRuler() {
    if (!ruler) return;
    var w = Math.max(window.innerWidth, 400);
    ruler.style.width = w + 'px';
    var html = '';
    for (var cm = 10, x = 80; x < w; cm += 10, x += 80) {
      html += '<span' + (cm % 50 === 0 ? ' class="r"' : '') + ' style="left:' + x + 'px">' + cm + '</span>';
    }
    ruler.innerHTML = html;
  }

  /* ---------- Plan qui se trace au défilement ---------- */
  var plan = document.querySelector('.plan');
  var drawing = plan && plan.querySelector('.drawing');
  var steps = plan ? plan.querySelectorAll('.step') : [];
  function seg(p, a, b) { return Math.min(1, Math.max(0, (p - a) / (b - a))); }

  function onScroll() {
    var vh = window.innerHeight;
    // Mètre ruban
    if (blade) {
      var max = document.documentElement.scrollHeight - vh;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      var full = blade.parentNode.clientWidth - blade.offsetLeft;
      var w = Math.round(p * full);
      blade.style.width = w + 'px';
      if (reading) reading.textContent = Math.round(w / PX_PER_CM);
    }
    // Plan
    if (drawing && !reduceMotion.matches) {
      var r = plan.getBoundingClientRect();
      var start = vh * 0.75;               // le tracé commence quand la section entre
      var span = Math.max(r.height - vh * 0.6, vh * 0.8);
      var q = Math.min(1, Math.max(0, (start - r.top) / span));
      drawing.style.setProperty('--p1', seg(q, 0, 0.3).toFixed(3));
      drawing.style.setProperty('--p2', seg(q, 0.22, 0.55).toFixed(3));
      drawing.style.setProperty('--p3', seg(q, 0.48, 0.78).toFixed(3));
      drawing.style.setProperty('--p4', seg(q, 0.72, 0.95).toFixed(3));
      var active = q < 0.25 ? 1 : q < 0.5 ? 2 : q < 0.75 ? 3 : 4;
      for (var i = 0; i < steps.length; i++) {
        steps[i].classList.toggle('is-on', i + 1 <= active);
      }
    }
  }
  if (plan && !reduceMotion.matches) plan.classList.add('is-live');

  var ticking = false;
  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; onScroll(); });
    }
  }
  buildRuler();
  onScroll();
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () { buildRuler(); requestTick(); });

  /* ---------- Apparitions au défilement ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- WhatsApp : message prérempli selon la prestation ---------- */
  var SERVICES = {
    porte: { short: 'Devis porte', label: 'une porte (intérieure ou d’entrée)', ask: 'Type de porte et dimensions de l’ouverture (approximatives) : ' },
    placard: { short: 'Devis placard', label: 'un placard ou un dressing sur mesure', ask: 'Largeur et hauteur du mur, portes battantes ou coulissantes : ' },
    cuisine: { short: 'Devis cuisine', label: 'une cuisine sur mesure', ask: 'Forme de la cuisine (droite, en L, en U) et longueur des murs : ' },
    meuble: { short: 'Devis meuble', label: 'un meuble sur mesure', ask: 'Type de meuble et dimensions souhaitées : ' },
    escalier: { short: 'Devis escalier', label: 'un escalier ou un garde-corps en bois', ask: 'Hauteur à franchir et place disponible : ' },
    renovation: { short: 'Réparation', label: 'une réparation ou une rénovation', ask: 'Ce qui est à réparer (porte, meuble, tiroirs…) : ' }
  };
  var DEFAULT_MSG = 'Bonjour, je vous contacte depuis votre site Bois & Main. J’aimerais parler d’un projet de menuiserie.';

  var waLinks = document.querySelectorAll('.js-wa');
  var floatBtn = document.querySelector('.wa-float');
  var floatLabel = document.getElementById('wa-float-label');
  var preview = document.getElementById('wa-preview');
  var status = document.querySelector('.pick-status');
  var picks = document.querySelectorAll('.cut__pick');
  var chips = document.querySelectorAll('.chip');
  var current = null;

  function buildMessage(key) {
    var s = SERVICES[key];
    if (!s) return DEFAULT_MSG;
    return 'Bonjour, je vous contacte depuis votre site Bois & Main. Je souhaite un devis pour ' + s.label + '.\n' +
      'Ma wilaya : \n' + s.ask;
  }

  function select(key, origin) {
    current = (current === key) ? null : key;
    var msg = buildMessage(current);
    var href = WA_BASE + '?text=' + encodeURIComponent(msg);
    waLinks.forEach(function (a) { a.href = href; });

    picks.forEach(function (b) {
      var li = b.closest('.cut');
      var on = li && li.getAttribute('data-service') === current;
      b.setAttribute('aria-pressed', String(!!on));
      b.firstChild.nodeValue = on ? 'Choisie' : 'Choisir';
      if (li) li.classList.toggle('is-picked', !!on);
    });
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', String(c.getAttribute('data-service') === current));
    });

    if (preview) preview.textContent = msg;
    if (floatLabel) floatLabel.textContent = current ? SERVICES[current].short : 'Demander un devis';
    if (status) {
      status.textContent = current
        ? 'Prestation choisie : ' + SERVICES[current].label + '. Le bouton WhatsApp en bas de l’écran contient maintenant un message adapté.'
        : 'Aucune prestation choisie : le bouton WhatsApp ouvre un message général.';
    }
    if (floatBtn && origin === 'pick' && !reduceMotion.matches) {
      floatBtn.classList.remove('is-bump');
      void floatBtn.offsetWidth;
      floatBtn.classList.add('is-bump');
    }
  }

  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.closest('.cut');
      if (li) select(li.getAttribute('data-service'), 'pick');
    });
  });
  chips.forEach(function (c) {
    c.addEventListener('click', function () { select(c.getAttribute('data-service'), 'chip'); });
  });

  // Lien direct vers une prestation : index.html?prestation=cuisine
  try {
    var q = new URLSearchParams(window.location.search).get('prestation');
    if (q && SERVICES[q]) select(q, 'init');
  } catch (e) { /* navigateur ancien : on garde le message général */ }
})();
