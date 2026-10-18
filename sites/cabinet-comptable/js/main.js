/* Équilibre Conseil – site de démonstration (contenu fictif) */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');
  if (toggle && menu) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var rv = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window) || reduce) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Horaires : jour courant ---------- */
  var today = new Date().getDay();
  var row = document.querySelector('.hours tr[data-day="' + today + '"]');
  if (row) row.classList.add('is-today');

  /* ---------- Balance : élément signature ---------- */
  var beam = document.getElementById('sc-beam');
  if (!beam) return;

  var panL = document.getElementById('sc-pan-l');
  var panR = document.getElementById('sc-pan-r');
  var stamp = document.getElementById('sc-stamp');
  var weights = document.querySelectorAll('.sc-w--r');
  var rows = document.querySelectorAll('[data-post]');
  var tD = document.getElementById('t-d');
  var tC = document.getElementById('t-c');
  var tG = document.getElementById('t-g');
  var gapBox = tG ? tG.parentNode : null;

  var CX = 210, CY = 100, HALF = 130, STEP = 3.6;
  var total = rows.length;
  var posted = -1;
  var angle = -total * STEP;   /* départ : penche côté débit */
  var target = angle;
  var vel = 0;
  var running = false;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function draw(a) {
    var r = a * Math.PI / 180;
    var c = Math.cos(r), s = Math.sin(r);
    beam.setAttribute('transform', 'rotate(' + a.toFixed(3) + ' ' + CX + ' ' + CY + ')');
    panL.setAttribute('transform', 'translate(' + (CX - HALF * c).toFixed(2) + ' ' + (CY - HALF * s).toFixed(2) + ')');
    panR.setAttribute('transform', 'translate(' + (CX + HALF * c).toFixed(2) + ' ' + (CY + HALF * s).toFixed(2) + ')');
  }

  function loop() {
    /* ressort amorti : la balance oscille un peu avant de se poser */
    vel += (target - angle) * 0.07;
    vel *= 0.84;
    angle += vel;
    draw(angle);
    if (Math.abs(vel) > 0.002 || Math.abs(target - angle) > 0.01) {
      requestAnimationFrame(loop);
    } else {
      angle = target;
      draw(angle);
      running = false;
    }
  }

  function setPosted(n) {
    if (n === posted) return;
    posted = n;
    target = -(total - n) * STEP;
    weights.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    rows.forEach(function (tr, i) { tr.classList.toggle('is-posted', i < n); });
    if (stamp) stamp.classList.toggle('on', n >= total);
    if (tD) tD.textContent = pad(total);
    if (tC) tC.textContent = pad(n);
    if (tG) tG.textContent = pad(total - n);
    if (gapBox) gapBox.classList.toggle('is-zero', n >= total);
    if (reduce) {
      angle = target;
      draw(angle);
    } else if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  function measure() {
    var line = window.innerHeight * (window.innerWidth <= 900 ? 0.72 : 0.62);
    var n = 0;
    rows.forEach(function (tr) {
      if (tr.getBoundingClientRect().top < line) n++;
    });
    setPosted(n);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; measure(); });
  }

  draw(angle);
  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
