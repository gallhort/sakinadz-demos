/* Tafoukt : page panier. */
(function () {
  'use strict';
  var TF = window.TF;
  var root = document.getElementById('panier');
  var lastRemoved = null;

  var emptyBowl = '<svg class="empty__bowl" viewBox="0 0 320 220" aria-hidden="true" focusable="false">' +
    '<ellipse cx="160" cy="200" rx="120" ry="12" fill="#2b1e17" opacity=".12"/>' +
    '<path d="M30 70 C34 150 90 196 160 196 C230 196 286 150 290 70" fill="#e3d5bf" stroke="#2b1e17" stroke-width="3"/>' +
    '<ellipse cx="160" cy="70" rx="130" ry="34" fill="#f4efe6" stroke="#2b1e17" stroke-width="3"/>' +
    '<ellipse cx="160" cy="74" rx="112" ry="26" fill="#ebe3d6"/>' +
    '<path d="M70 120 H250 M80 150 H240" stroke="#2b1e17" stroke-opacity=".12" stroke-width="2"/>' +
    '<path d="M300 40 v120 M294 40 h12 M294 160 h12" stroke="#c4633a" stroke-width="2"/></svg>';

  function render(focusSel, msg) {
    var cart = TF.cart.get();
    var t = TF.cart.totals(cart);
    var undo = lastRemoved ? '<div class="undo" role="status"><p>« ' + TF.esc(TF.byRef(lastRemoved.line.ref).nom) + ' » a été retiré du panier.</p><button type="button" data-undo>Annuler</button></div>' : '';
    if (!cart.length) {
      root.innerHTML = '<div>' + undo + '<div class="empty">' + emptyBowl +
        '<div><h2>Votre panier<br>est vide.</h2><p>Comme un bol qui attend d\'être rempli. Les douze pièces de l\'atelier vous attendent, prix TTC et disponibilité affichés.</p>' +
        '<p class="empty__actions"><a class="btn btn--terre btn--big" href="boutique.html">Voir la boutique</a><a class="btn btn--line" href="conformite.html">Ce que cette démo applique</a></p></div></div></div>';
      bindUndo(); if (focusSel) focus(focusSel); return;
    }
    var later = t.nLater ? '<div class="sum__later"><strong>Précommande :</strong> ' + TF.fmt(t.sousTotalLater) + ' TTC, réglés à la disponibilité de la pièce, plus les frais de livraison de cet envoi séparé.</div>' : '';
    root.innerHTML =
      '<section aria-labelledby="t-lignes"><h2 id="t-lignes" class="visually-hidden">Pièces dans le panier</h2>' + undo +
        (msg ? '<p class="notice" role="status">' + TF.esc(msg) + '</p>' : '') +
        '<ul class="cart__lines">' + t.lines.map(function (l) { return TF.lineHTML(l); }).join('') + '</ul>' +
        '<p><a class="link-arrow" href="boutique.html">Continuer mes achats</a></p></section>' +
      '<aside class="summary" aria-labelledby="t-sum"><h2 id="t-sum">Récapitulatif</h2>' +
        '<dl class="sum">' +
          '<div><dt>Pièces (' + t.count + ')</dt><dd>' + TF.fmt(t.sousTotalNow + t.sousTotalLater) + '</dd></div>' +
          (t.nLater ? '<div><dt>dont précommande</dt><dd>− ' + TF.fmt(t.sousTotalLater) + '</dd></div>' : '') +
          '<div><dt>Livraison</dt><dd>selon la zone</dd></div>' +
          '<div class="sum__total"><dt>Sous-total TTC' + (t.nLater ? ' à régler maintenant' : '') + '</dt><dd data-subtotal>' + TF.fmt(t.sousTotalNow) + '</dd></div>' +
        '</dl>' +
        '<p class="small">Frais de livraison de ' + TF.fmt(TF.ZONES[0].frais) + ' à ' + TF.fmt(TF.ZONES[2].frais) + ' selon votre zone, choisie et affichée à l\'étape 2, avant toute confirmation.</p>' + later +
        '<a class="btn btn--terre btn--big" href="commande.html">Commander : étape 1 sur 3</a>' +
        '<ul class="summary__reassure"><li>Aucune case pré-cochée</li><li>Tout reste modifiable jusqu\'à la confirmation</li><li>Paiement à la livraison possible</li></ul>' +
      '</aside>';
    TF.bindTurn(root);
    bindUndo();
    if (focusSel) focus(focusSel);
  }
  function focus(sel) { var el = root.querySelector(sel); if (el) el.focus(); }
  function bindUndo() {
    var b = root.querySelector('[data-undo]');
    if (!b) return;
    b.addEventListener('click', function () {
      var cart = TF.cart.get();
      cart.splice(Math.min(lastRemoved.idx, cart.length), 0, lastRemoved.line);
      var ref = lastRemoved.line.ref;
      lastRemoved = null;
      TF.cart.save(cart);
      render('.line[data-ref="' + ref + '"] [data-qty]');
      TF.announce('Pièce remise dans le panier.');
    });
  }
  TF.bindLines(root, function (type, ref, extra, msg) {
    if (type === 'rm') {
      lastRemoved = extra;
      render('[data-undo]');
      TF.announce('« ' + TF.byRef(ref).nom + ' » retiré du panier.');
    } else {
      lastRemoved = null;
      var which = document.activeElement && document.activeElement.hasAttribute('data-inc') ? '[data-inc]' : document.activeElement && document.activeElement.hasAttribute('data-dec') ? '[data-dec]' : '[data-qty]';
      render('.line[data-ref="' + ref + '"] ' + which, msg);
      var focused = root.querySelector('.line[data-ref="' + ref + '"] ' + which);
      if (focused && focused.disabled) focus('.line[data-ref="' + ref + '"] [data-qty]');
      var t = TF.cart.totals();
      TF.announce((msg ? msg + ' ' : '') + 'Quantité mise à jour. Sous-total : ' + TF.fmt(t.sousTotalNow) + '.');
    }
  });
  window.addEventListener('tf:cart', function () { if (!root.contains(document.activeElement)) render(); });
  render();
})();
