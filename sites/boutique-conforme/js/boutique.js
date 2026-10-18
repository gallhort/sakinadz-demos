/* Tafoukt : filtres de la boutique (les cartes sont déjà dans la page). */
(function () {
  'use strict';
  var TF = window.TF;
  var wrap = document.querySelector('.filters');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.catalog .card'));
  var count = document.getElementById('nb-pieces');
  var SLOTS = ['a', 'b', 'c', 'c', 'c', 'w'];
  if (!wrap) return;
  wrap.hidden = false;

  function apply(id) {
    var n = 0;
    cards.forEach(function (c) {
      var show = id === 'tout' || c.getAttribute('data-famille') === id;
      c.hidden = !show;
      c.classList.remove('card--a', 'card--b', 'card--c', 'card--w');
      if (show) { c.classList.add('card--' + (id === 'tout' ? SLOTS[n % 6] : (n === 0 ? 'a' : n === 1 ? 'b' : 'c'))); n++; }
    });
    count.textContent = n + (n > 1 ? ' pièces' : ' pièce');
    Array.prototype.forEach.call(wrap.querySelectorAll('.chip'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === id));
    });
  }
  wrap.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (b) apply(b.getAttribute('data-filter'));
  });
})();
