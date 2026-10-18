/* Tafoukt : fonctions communes (stockage, panier, totaux, en-tête, animations).
   Rien n'est envoyé à un serveur : le panier vit dans le localStorage du navigateur,
   la commande en cours dans le sessionStorage de l'onglet. */
(function (root) {
  'use strict';
  var TF = root.TF;
  var doc = root.document;
  var memory = {};
  var CART_KEY = 'tafoukt-panier';

  /* ---------- stockage protégé (navigation privée, stockage bloqué…) ---------- */
  function store(kind) {
    try { var s = root[kind]; var k = '__tf_test'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
  }
  function read(kind, key, fallback) {
    var s = store(kind);
    try {
      var raw = s ? s.getItem(key) : memory[kind + key];
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(kind, key, value) {
    var raw = JSON.stringify(value), s = store(kind);
    try { if (s) s.setItem(key, raw); else memory[kind + key] = raw; } catch (e) { memory[kind + key] = raw; }
  }
  function remove(kind, key) {
    var s = store(kind);
    try { if (s) s.removeItem(key); } catch (e) { /* rien */ }
    delete memory[kind + key];
  }
  TF.storage = { read: read, write: write, remove: remove, available: function () { return !!store('localStorage'); } };

  /* ---------- panier ---------- */
  function clampQty(p, q) {
    var max = TF.maxQty(p);
    q = parseInt(q, 10);
    if (isNaN(q) || q < 1) q = 1;
    return Math.min(q, max);
  }
  function getCart() {
    var raw = read('localStorage', CART_KEY, []);
    if (!Array.isArray(raw)) raw = [];
    var clean = [], seen = {};
    raw.forEach(function (l) {
      var p = l && TF.byRef(l.ref);
      if (!p || TF.maxQty(p) === 0 || seen[p.ref]) return;
      seen[p.ref] = true;
      clean.push({ ref: p.ref, qty: clampQty(p, l.qty) });
    });
    return clean;
  }
  function saveCart(cart) {
    write('localStorage', CART_KEY, cart);
    updateCount();
    try { root.dispatchEvent(new CustomEvent('tf:cart')); } catch (e) { /* ancien navigateur */ }
  }
  /* Renvoie { ok, qty, capped, message } */
  function addToCart(ref, qty) {
    var p = TF.byRef(ref);
    if (!p) return { ok: false, message: 'Référence inconnue.' };
    var max = TF.maxQty(p);
    if (max === 0) return { ok: false, message: 'Cette pièce est épuisée : elle ne peut pas être commandée.' };
    var cart = getCart(), line = null;
    cart.forEach(function (l) { if (l.ref === p.ref) line = l; });
    var wanted = (line ? line.qty : 0) + (parseInt(qty, 10) || 1);
    var finalQty = Math.min(wanted, max);
    if (line) line.qty = finalQty; else cart.push({ ref: p.ref, qty: finalQty });
    saveCart(cart);
    var capped = finalQty < wanted;
    return { ok: true, qty: finalQty, capped: capped, max: max };
  }
  function setQty(ref, qty) {
    var cart = getCart(), p = TF.byRef(ref);
    cart.forEach(function (l) { if (l.ref === ref) l.qty = clampQty(p, qty); });
    saveCart(cart);
  }
  function removeLine(ref) {
    saveCart(getCart().filter(function (l) { return l.ref !== ref; }));
  }
  function clearCart() { saveCart([]); }
  function count(cart) {
    return (cart || getCart()).reduce(function (s, l) { return s + l.qty; }, 0);
  }

  /* Totaux : les pièces en précommande sont réglées à leur disponibilité
     (avec leurs propres frais d'expédition) et ne sont pas dues maintenant. */
  function totals(cart, zoneId) {
    var z = TF.zone(zoneId), lines = [], now = 0, later = 0, nNow = 0, nLater = 0;
    (cart || getCart()).forEach(function (l) {
      var p = TF.byRef(l.ref); if (!p) return;
      var pre = p.statut === 'precommande', total = p.prix * l.qty;
      lines.push({ p: p, qty: l.qty, total: total, pre: pre });
      if (pre) { later += total; nLater += l.qty; } else { now += total; nNow += l.qty; }
    });
    var fNow = z && nNow ? z.frais : 0, fLater = z && nLater ? z.frais : 0;
    return {
      lines: lines, zone: z, nNow: nNow, nLater: nLater, count: nNow + nLater,
      sousTotalNow: now, fraisNow: fNow, totalNow: now + fNow,
      sousTotalLater: later, fraisLater: fLater, totalLater: later + fLater
    };
  }
  TF.cart = { get: getCart, add: addToCart, setQty: setQty, remove: removeLine, clear: clearCart, count: count, totals: totals, save: saveCart };

  /* ---------- utilitaires ---------- */
  TF.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  TF.announce = function (msg) {
    var live = doc.getElementById('annonce');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 60);
  };
  TF.reducedMotion = function () {
    return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  TF.param = function (name) {
    try { return new URLSearchParams(root.location.search).get(name); } catch (e) { return null; }
  };

  function updateCount() {
    var n = count();
    Array.prototype.forEach.call(doc.querySelectorAll('[data-cart-count]'), function (el) {
      el.textContent = n;
      el.closest('a') && el.closest('a').setAttribute('aria-label', 'Panier : ' + n + (n > 1 ? ' articles' : ' article'));
    });
  }

  /* ---------- tour de potier : faire tourner les décors ---------- */
  var spinning = new Set(), last = 0, rafId = 0;
  function setTurn(svg, off) {
    svg._turn = off;
    var x = -(((off % 200) + 200) % 200);
    Array.prototype.forEach.call(svg.querySelectorAll('.pot-spin'), function (g) { g.setAttribute('transform', 'translate(' + x.toFixed(2) + ' 0)'); });
    Array.prototype.forEach.call(svg.querySelectorAll('.pot-rot'), function (g) { g.setAttribute('transform', 'rotate(' + (off * 1.2 % 360).toFixed(2) + ')'); });
  }
  function loop(t) {
    var dt = last ? Math.min(t - last, 50) : 16; last = t;
    spinning.forEach(function (svg) { setTurn(svg, (svg._turn || 0) + dt * 0.05); });
    rafId = spinning.size ? root.requestAnimationFrame(loop) : 0;
    if (!rafId) last = 0;
  }
  function start(svg) { spinning.add(svg); if (!rafId) rafId = root.requestAnimationFrame(loop); }
  function stop(svg) { spinning.delete(svg); }
  TF.bindTurn = function (scope) {
    if (TF.reducedMotion()) return;
    Array.prototype.forEach.call((scope || doc).querySelectorAll('[data-turn]'), function (el) {
      if (el._turnBound) return; el._turnBound = true;
      var svgs = function () { return el.querySelectorAll('svg.pot'); };
      var on = function () { Array.prototype.forEach.call(svgs(), start); };
      var off = function () { Array.prototype.forEach.call(svgs(), stop); };
      el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
      el.addEventListener('focusin', on); el.addEventListener('focusout', off);
    });
  };
  function bindScrollTurn() {
    var els = doc.querySelectorAll('[data-scroll-turn] svg.pot');
    if (!els.length || TF.reducedMotion()) return;
    var ticking = false;
    var upd = function () { ticking = false; Array.prototype.forEach.call(els, function (s) { setTurn(s, root.scrollY * 0.35); }); };
    root.addEventListener('scroll', function () { if (!ticking) { ticking = true; root.requestAnimationFrame(upd); } }, { passive: true });
  }

  /* ---------- apparitions au défilement (contenu visible sans JS) ---------- */
  function reveal() {
    var items = doc.querySelectorAll('.rv');
    if (!('IntersectionObserver' in root) || TF.reducedMotion()) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }
    doc.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- menu mobile ---------- */
  function menu() {
    var btn = doc.querySelector('.menu-toggle'), nav = doc.getElementById('menu');
    if (!btn || !nav) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); btn.focus(); }
    });
  }

  /* ---------- panier d'exemple (page « Ce que cette démo applique ») ---------- */
  function demoCart() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-demo-cart]'), function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        saveCart([{ ref: 'TF-02', qty: 2 }, { ref: 'TF-07', qty: 1 }]);
        remove('sessionStorage', 'tafoukt-commande');
        root.location.href = b.getAttribute('href') || 'commande.html';
      });
    });
  }

  /* ---------- boutons « Ajouter au panier » génériques ---------- */
  function addButtons(scope) {
    Array.prototype.forEach.call((scope || doc).querySelectorAll('[data-add]'), function (b) {
      if (b._bound) return; b._bound = true;
      b.addEventListener('click', function () {
        var ref = b.getAttribute('data-add');
        var qInput = b.getAttribute('data-qty-from') ? doc.getElementById(b.getAttribute('data-qty-from')) : null;
        var res = addToCart(ref, qInput ? qInput.value : 1);
        var p = TF.byRef(ref), msg;
        if (!res.ok) msg = res.message;
        else if (res.capped) msg = 'Quantité limitée à ' + res.max + ' pour « ' + p.nom + ' » : votre panier en contient ' + res.qty + '.';
        else msg = '« ' + p.nom + ' » ajouté au panier (' + res.qty + ' dans le panier).';
        TF.announce(msg);
        var out = b.parentNode.querySelector('.add-feedback') || doc.getElementById(b.getAttribute('data-feedback') || '');
        if (out) { out.innerHTML = TF.esc(msg) + (res.ok ? ' <a href="panier.html">Voir le panier</a>' : ''); out.hidden = false; }
        b.classList.add('is-added');
        setTimeout(function () { b.classList.remove('is-added'); }, 900);
      });
    });
  }
  TF.bindAdd = addButtons;

  doc.documentElement.classList.add('js');
  function init() {
    updateCount(); menu(); reveal(); TF.bindTurn(); bindScrollTurn(); demoCart(); addButtons();
    root.addEventListener('storage', function (e) { if (e.key === CART_KEY) { updateCount(); root.dispatchEvent(new CustomEvent('tf:cart')); } });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})(window);
