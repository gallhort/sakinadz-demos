/* Tafoukt : fiche produit pilotée par ?ref=TF-xx.
   Sans paramètre ou avec une référence inconnue, la page garde (ou affiche)
   la pièce TF-01 avec un message explicite : elle n'est jamais vide. */
(function () {
  'use strict';
  var TF = window.TF;
  var fiche = document.getElementById('fiche');
  var raw = TF.param('ref');
  var p = TF.byRef(raw), notice = '';
  if (!p) {
    p = TF.PRODUCTS[0];
    var list = TF.PRODUCTS.map(function (q) { return '<a href="produit.html?ref=' + q.ref + '">' + TF.esc(q.nom) + '</a>'; }).join(', ');
    notice = raw
      ? '<p class="notice" role="status">La référence « ' + TF.esc(raw) + ' » n\'existe pas dans le catalogue. Voici la pièce ' + p.ref + '. Autres pièces : ' + list + '.</p>'
      : '';
  }
  if (raw || notice) {
    fiche.innerHTML = TF.productHTML(p, notice);
  }
  document.title = p.type + ' « ' + p.nom + ' » – Tafoukt (démo)';
  var crumb = document.getElementById('crumb-nom');
  if (crumb) crumb.textContent = p.nom;
  // « D'autres pièces » : éviter de reproposer la pièce affichée
  var autres = document.getElementById('autres');
  if (autres && autres.querySelector('[data-ref="' + p.ref + '"]')) {
    var alt = TF.PRODUCTS.filter(function (q) { return q.ref !== p.ref && q.statut === 'dispo'; }).slice(0, 3);
    autres.innerHTML = alt.map(function (q) { return TF.cardHTML(q, 'c', 'h3'); }).join('');
  }
  TF.bindAdd(document);
  TF.bindTurn(document);

  // sélecteur de quantité
  var input = document.getElementById('qte');
  if (input) {
    var max = TF.maxQty(p);
    var sync = function () {
      var v = parseInt(input.value, 10);
      if (isNaN(v) || v < 1) v = 1;
      if (v > max) v = max;
      input.value = v;
      fiche.querySelector('[data-step="-1"]').disabled = v <= 1;
      fiche.querySelector('[data-step="1"]').disabled = v >= max;
    };
    fiche.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]');
      if (!b) return;
      input.value = (parseInt(input.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10);
      sync();
    });
    input.addEventListener('change', sync);
    var form = fiche.querySelector('[data-buy]');
    form.addEventListener('submit', function (e) { e.preventDefault(); form.querySelector('[data-add]').click(); });
    sync();
  }
  // ancre éventuelle (#prix, #livraison…) après rendu dynamique
  if (location.hash && raw) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function () { t.scrollIntoView(); }, 30);
  }
})();
