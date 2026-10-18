/* Tafoukt : lignes de panier modifiables (panier et étape 2 de la commande). */
(function () {
  'use strict';
  var TF = window.TF;
  TF.lineHTML = function (l, opts) {
    var p = l.p, max = TF.maxQty(p), id = 'q-' + (opts && opts.prefix || '') + p.ref;
    return '<li class="line" data-ref="' + p.ref + '">' +
      '<div class="line__thumb" style="--plinth:' + TF.plinth(p) + '">' + TF.potSVG(p, { decorative: true, uid: id }) + '</div>' +
      '<div class="line__info"><p class="line__ref">' + p.ref + ' · ' + TF.esc(p.type) + '</p>' +
        '<h3 class="line__name"><a href="produit.html?ref=' + p.ref + '">' + TF.esc(p.nom) + '</a></h3>' +
        '<p class="line__unit">' + TF.fmt(p.prix) + ' TTC l\'unité</p>' +
        (l.pre ? '<span class="line__pre">Précommande : réglée à la disponibilité (' + p.dispoLe + ')</span>' : '') +
      '</div>' +
      '<div class="line__ctrl">' +
        '<div class="qty"><label for="' + id + '" class="visually-hidden">Quantité de « ' + TF.esc(p.nom) + ' »</label>' +
        '<div class="qty__ctrl"><button type="button" class="qty__btn" data-dec aria-label="Diminuer la quantité de « ' + TF.esc(p.nom) + ' »"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button>' +
        '<input id="' + id + '" type="number" inputmode="numeric" min="1" max="' + max + '" value="' + l.qty + '" data-qty>' +
        '<button type="button" class="qty__btn" data-inc aria-label="Augmenter la quantité de « ' + TF.esc(p.nom) + ' »"' + (l.qty >= max ? ' disabled' : '') + '>+</button></div>' +
        '<p class="qty__max">Max. ' + max + '</p></div>' +
        '<p class="line__total" data-line-total>' + TF.fmt(l.total) + '</p>' +
        '<button type="button" class="line__rm" data-rm>Retirer<span class="visually-hidden"> « ' + TF.esc(p.nom) + ' » du panier</span></button>' +
      '</div></li>';
  };

  /* Branche les contrôles d'une liste ; onChange(type, ref, extra) appelé après chaque modification. */
  TF.bindLines = function (root, onChange) {
    root.addEventListener('click', function (e) {
      var li = e.target.closest('.line'); if (!li) return;
      var ref = li.getAttribute('data-ref'), input = li.querySelector('[data-qty]');
      var q = parseInt(input.value, 10) || 1;
      if (e.target.closest('[data-inc]')) { TF.cart.setQty(ref, q + 1); onChange('qty', ref, li); }
      else if (e.target.closest('[data-dec]')) { TF.cart.setQty(ref, q - 1); onChange('qty', ref, li); }
      else if (e.target.closest('[data-rm]')) {
        var before = TF.cart.get(), idx = -1, line = null;
        before.forEach(function (l, i) { if (l.ref === ref) { idx = i; line = l; } });
        TF.cart.remove(ref); onChange('rm', ref, { idx: idx, line: line });
      }
    });
    root.addEventListener('change', function (e) {
      if (!e.target.matches('[data-qty]')) return;
      var li = e.target.closest('.line'), ref = li.getAttribute('data-ref'), p = TF.byRef(ref);
      var v = parseInt(e.target.value, 10), max = TF.maxQty(p);
      var msg = '';
      if (isNaN(v) || v < 1) { v = 1; msg = 'Quantité minimale : 1. Pour retirer la pièce, utilisez « Retirer ».'; }
      if (v > max) { v = max; msg = 'Quantité limitée à ' + max + ' pour « ' + p.nom + ' ».'; }
      TF.cart.setQty(ref, v); onChange('qty', ref, li, msg);
    });
  };
})();
