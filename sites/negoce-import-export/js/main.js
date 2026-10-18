/* Tamarisk Trade — demo website. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.textContent = open ? 'Menu' : 'Close';
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'Menu';
        nav.classList.remove('is-open');
        toggle.focus();
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- clocks (real time zones, nothing invented) ---------- */
  var clocks = document.querySelectorAll('[data-clock]');
  function fmt(tz) {
    try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date()); }
    catch (e) { return '--:--'; }
  }
  function officeStatus() {
    var el = document.querySelector('[data-office-status]');
    if (!el) return;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Algiers' }).formatToParts(new Date());
      var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
      var mins = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
      var workday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].indexOf(p.weekday) !== -1;
      var open = workday && mins >= 510 && mins < 1020;
      var wrap = el.closest('.clocks-status, .hours-status');
      if (wrap) wrap.classList.toggle('is-open', open);
      el.textContent = open
        ? 'Desk open now · Sunday to Thursday, 08:30–17:00, Algiers time'
        : 'Desk closed now · Sunday to Thursday, 08:30–17:00, Algiers time';
    } catch (e) { /* keep static text */ }
  }
  function tick() {
    clocks.forEach(function (el) {
      var t = fmt(el.getAttribute('data-clock'));
      el.textContent = el.getAttribute('data-format') === 'short' ? 'Algiers ' + t + ' local time' : t;
    });
    officeStatus();
  }
  if (clocks.length) { tick(); setInterval(tick, 15000); }

  /* ==========================================================================
     MAPS — dot-matrix base (img) + route overlay drawn here
     ========================================================================== */
  var PROJ = {
    world: function (lon, lat) { return [(lon + 180) * 1.25, (78 - lat) * 1.25]; },
    med: function (lon, lat) { return [(lon + 14) * 4, (52 - lat) * 4]; }
  };
  var HUB = { name: 'Algiers', lon: 3.06, lat: 36.75 };
  var LANES = {
    mrs: { city: 'Marseille', country: 'France', lon: 5.37, lat: 43.30, mode: 'Sea' },
    vlc: { city: 'Valencia', country: 'Spain', lon: -0.38, lat: 39.47, mode: 'Sea' },
    goa: { city: 'Genoa', country: 'Italy', lon: 8.93, lat: 44.41, mode: 'Sea' },
    rtm: { city: 'Rotterdam', country: 'Netherlands', lon: 4.48, lat: 51.92, mode: 'Sea' },
    ist: { city: 'Istanbul', country: 'Türkiye', lon: 28.98, lat: 41.01, mode: 'Sea' },
    dxb: { city: 'Jebel Ali', country: 'United Arab Emirates', lon: 55.03, lat: 25.01, mode: 'Sea' },
    sha: { city: 'Shanghai', country: 'China', lon: 121.47, lat: 31.23, mode: 'Sea' },
    ssz: { city: 'Santos', country: 'Brazil', lon: -46.33, lat: -23.96, mode: 'Sea' },
    hou: { city: 'Houston', country: 'United States', lon: -95.36, lat: 29.76, mode: 'Sea' },
    nim: { city: 'Niamey', country: 'Niger', lon: 2.11, lat: 13.51, mode: 'Road' },
    nkc: { city: 'Nouakchott', country: 'Mauritania', lon: -15.98, lat: 18.08, mode: 'Road' }
  };
  var LANE_CODES = { mrs: 'TT-01', vlc: 'TT-02', goa: 'TT-03', rtm: 'TT-04', ist: 'TT-05', dxb: 'TT-06', sha: 'TT-07', ssz: 'TT-08', hou: 'TT-09', nim: 'TT-10', nkc: 'TT-11' };

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function arcPath(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var len = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / len, ny = dx / len;
    if (ny > 0) { nx = -nx; ny = -ny; }           // bulge northwards
    var k = Math.min(0.32, 0.12 + len / 900);
    var cx = (a[0] + b[0]) / 2 + nx * len * k;
    var cy = (a[1] + b[1]) / 2 + ny * len * k;
    return 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'Q' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ' ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
  }

  function buildMap(svg) {
    var proj = PROJ[svg.getAttribute('data-map')] || PROJ.world;
    var mode = svg.getAttribute('data-mode');
    var hub = proj(HUB.lon, HUB.lat);
    var gRoutes = el('g', { 'class': 'routes' }, svg);
    var gPorts = el('g', { 'class': 'ports' }, svg);
    var gCargo = el('g', { 'class': 'cargos' }, svg);
    var items = {};
    var ids = (svg.getAttribute('data-lanes') || Object.keys(LANES).join(' ')).split(' ');

    ids.forEach(function (id, i) {
      var L = LANES[id]; if (!L) return;
      var b = proj(L.lon, L.lat);
      var d = arcPath(hub, b);
      if (mode === 'ambient') el('path', { d: d, 'class': 'route-glow' }, gRoutes);
      var path = el('path', { d: d, 'class': 'route' + (L.mode === 'Road' ? ' route--road' : ''), 'data-lane': id }, gRoutes);
      if (mode === 'ambient') {
        var len = path.getTotalLength();
        // non-scaling strokes dash in screen pixels: convert user units to px
        var scale = (svg.getBoundingClientRect().width || 1200) / 451;
        path.style.setProperty('--len', Math.ceil(len * scale + 4) + 'px');
        path.addEventListener('animationend', function () { path.classList.remove('route--draw'); });
        path.style.setProperty('--delay', (0.25 + i * 0.14).toFixed(2) + 's');
        path.classList.add('route--draw');
      }
      var port = el('circle', { cx: b[0], cy: b[1], r: mode === 'ambient' ? 1.1 : 1.3, 'class': 'port' }, gPorts);
      var label = null;
      if (mode === 'board') {
        var anchorEnd = b[0] > 300;
        label = el('text', { x: b[0] + (anchorEnd ? -3 : 3), y: b[1] - 2.5, 'class': 'map-label', 'text-anchor': anchorEnd ? 'end' : 'start' }, gPorts);
        label.textContent = L.city;
      }
      items[id] = { path: path, port: port, label: label, lane: L };
    });

    // hub
    el('circle', { cx: hub[0], cy: hub[1], r: 2, 'class': 'hub-ring' }, gPorts);
    el('circle', { cx: hub[0], cy: hub[1], r: 1.7, 'class': 'hub' }, gPorts);
    if (mode === 'board') {
      var hl = el('text', { x: hub[0] - 3, y: hub[1] + 6.5, 'class': 'map-label map-label--hub', 'text-anchor': 'end' }, gPorts);
      hl.textContent = 'Algiers';
    }

    return { svg: svg, items: items, gCargo: gCargo, mode: mode };
  }

  /* cargo animation: small dots travelling from the hub along each lane */
  function animateCargo(map, getActive) {
    if (reduceMotion) return;
    var cargos = [];
    Object.keys(map.items).forEach(function (id, i) {
      var it = map.items[id];
      var c = el('circle', { r: map.mode === 'ambient' ? 0.9 : 1.4, 'class': 'cargo', cx: -10, cy: -10 }, map.gCargo);
      cargos.push({ id: id, c: c, path: it.path, len: it.path.getTotalLength(), speed: 0.045 + (i % 4) * 0.008, t: (i * 0.137) % 1 });
    });
    var visible = true, last = null, start = performance.now();
    var delayMs = map.mode === 'ambient' ? 2600 : 0;
    function frame(now) {
      if (!visible) { last = null; return; }
      var dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      var active = getActive ? getActive() : null;
      cargos.forEach(function (o) {
        var show = (now - start > delayMs) && (!active || active === o.id) && (map.mode === 'ambient' || active === o.id);
        if (!show) { o.c.setAttribute('cx', -10); return; }
        o.t = (o.t + dt * o.speed * (active ? 2.2 : 1) * (60 / Math.max(30, o.len))) % 1;
        var p = o.path.getPointAtLength(o.t * o.len);
        o.c.setAttribute('cx', p.x.toFixed(2));
        o.c.setAttribute('cy', p.y.toFixed(2));
        o.c.style.opacity = Math.min(1, Math.sin(o.t * Math.PI) * 3).toFixed(2);
      });
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        var was = visible; visible = en[0].isIntersecting && !document.hidden;
        if (visible && !was) requestAnimationFrame(frame);
      }).observe(map.svg);
    }
    document.addEventListener('visibilitychange', function () {
      var was = visible; visible = !document.hidden;
      if (visible && !was) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  document.querySelectorAll('svg.map-routes[data-mode]').forEach(function (svg) {
    var map = buildMap(svg);
    if (map.mode === 'ambient') { animateCargo(map); return; }
    if (map.mode !== 'board') return;

    var active = null;
    var buttons = document.querySelectorAll('.lane[data-lane]');
    var capLabel = document.querySelector('.lanes-caption-label');
    var capText = document.querySelector('.lanes-caption-text');
    var defaultText = capText ? capText.textContent : '';

    function setActive(id) {
      active = id;
      svg.classList.toggle('has-active', !!id);
      Object.keys(map.items).forEach(function (k) {
        var it = map.items[k], on = k === id;
        it.path.classList.toggle('is-active', on);
        it.port.classList.toggle('is-active', on);
        if (it.label) it.label.classList.toggle('is-active', on);
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lane') === id)); });
      if (capLabel && capText) {
        if (id) {
          var L = LANES[id];
          capLabel.textContent = LANE_CODES[id] + ' · Algiers → ' + L.city;
          capText.textContent = L.country + ' · by ' + L.mode.toLowerCase() + ' · transit time confirmed per shipment';
        } else {
          capLabel.textContent = 'All lanes';
          capText.textContent = defaultText;
        }
      }
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-lane');
        setActive(active === id ? null : id);
      });
      b.addEventListener('mouseenter', function () { if (!active) highlightPreview(b.getAttribute('data-lane'), true); });
      b.addEventListener('mouseleave', function () { if (!active) highlightPreview(null, false); });
    });
    function highlightPreview(id) {
      svg.classList.toggle('has-active', !!id);
      Object.keys(map.items).forEach(function (k) {
        map.items[k].path.classList.toggle('is-active', k === id);
        map.items[k].port.classList.toggle('is-active', k === id);
        if (map.items[k].label) map.items[k].label.classList.toggle('is-active', k === id);
      });
    }
    animateCargo(map, function () { return active; });
  });
})();
