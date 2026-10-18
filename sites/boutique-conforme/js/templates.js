/* Tafoukt : gabarits HTML partagés (cartes produit, fiche produit).
   Les pages livrées contiennent déjà ce HTML (pré-rendu) ; les scripts
   l'utilisent ensuite pour la fiche ?ref=… et les mises à jour. */
(function (root) {
  'use strict';
  var TF = root.TF;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var PLINTH = {
    'TF-01': '#e3d5bf', 'TF-02': '#2f3b2c', 'TF-03': '#c4633a', 'TF-04': '#2b1e17',
    'TF-05': '#e9dcc6', 'TF-06': '#d9c4a5', 'TF-07': '#8a9a7b', 'TF-08': '#e6b98f',
    'TF-09': '#2f3b2c', 'TF-10': '#e3d5bf', 'TF-11': '#c4633a', 'TF-12': '#4c5a43'
  };
  TF.plinth = function (p) { return PLINTH[p.ref] || '#e3d5bf'; };

  function dispoClass(p) {
    return p.statut === 'epuise' ? 'dispo--out' : p.statut === 'precommande' ? 'dispo--pre' : 'dispo--ok';
  }
  function buyButton(p, extra) {
    extra = extra || '';
    if (p.statut === 'epuise') return '<button class="btn btn--line" type="button" disabled' + extra + '>Épuisé</button>';
    var label = p.statut === 'precommande' ? 'Précommander' : 'Ajouter au panier';
    return '<button class="btn btn--terre" type="button" data-add="' + p.ref + '"' + extra + '>' + label + '<span class="visually-hidden"> : ' + esc(p.nom) + '</span></button>';
  }
  TF.dispoClass = dispoClass;

  /* slot : a | b | c | w (large) — rythme éditorial de la grille */
  TF.cardHTML = function (p, slot, headingTag) {
    var h = headingTag || 'h2';
    var url = 'produit.html?ref=' + p.ref;
    return '<li class="card card--' + (slot || 'c') + '" data-famille="' + p.famille + '" data-ref="' + p.ref + '" data-turn style="--plinth:' + TF.plinth(p) + '">' +
      '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' + TF.potSVG(p, { decorative: true, uid: 'c' + p.ref }) + '</a>' +
      '<div class="card__body">' +
        '<p class="card__ref">' + p.ref + ' · ' + esc(p.type) + '</p>' +
        '<' + h + ' class="card__title"><a href="' + url + '">' + esc(p.nom) + '</a></' + h + '>' +
        '<p class="card__glaze">' + esc(p.glacure) + '</p>' +
        '<p class="card__price">' + TF.fmt(p.prix) + ' <abbr title="toutes taxes comprises">TTC</abbr></p>' +
        '<p class="dispo ' + dispoClass(p) + '">' + esc(TF.dispoText(p)) + '</p>' +
        '<div class="card__actions">' + buyButton(p) + '<p class="add-feedback" hidden></p></div>' +
      '</div></li>';
  };

  function zonesTable(caption) {
    var rows = TF.ZONES.map(function (z) {
      return '<tr><th scope="row">' + esc(z.court) + '</th><td>' + TF.fmt(z.frais) + '</td><td>' + z.delai + '</td></tr>';
    }).join('');
    return '<table class="zones"><caption>' + (caption || 'Frais et délais de livraison par zone') + '</caption>' +
      '<thead><tr><th scope="col">Zone</th><th scope="col">Frais TTC</th><th scope="col">Délai après expédition</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  TF.zonesTable = zonesTable;

  /* Fiche produit complète (contenu de <div id="fiche">). notice : HTML optionnel. */
  TF.productHTML = function (p, notice) {
    var S = TF.SHOP, max = TF.maxQty(p);
    var dispoLong = p.statut === 'epuise'
      ? 'Épuisé. La pièce ne peut pas être ajoutée au panier : aucune commande n\'est validée sur un produit indisponible.'
      : p.statut === 'precommande'
        ? 'En précommande, disponible le ' + p.dispoLe + '. Vous ne réglez cette pièce qu\'à sa disponibilité ; elle est expédiée séparément, avec ses propres frais de livraison. Précommande limitée à ' + p.maxPrecommande + ' pièces.'
        : (p.unique ? 'Pièce unique en stock, expédiée sous ' + S.preparation + '.' : p.stock + ' pièces en stock, expédiées sous ' + S.preparation + '.');
    var qtyField = max > 0
      ? '<form class="buy" data-buy novalidate><div class="qty"><label for="qte">Quantité</label>' +
          '<div class="qty__ctrl"><button type="button" class="qty__btn" data-step="-1" aria-label="Diminuer la quantité">−</button>' +
          '<input id="qte" name="qte" type="number" inputmode="numeric" min="1" max="' + max + '" value="1" aria-describedby="qte-max">' +
          '<button type="button" class="qty__btn" data-step="1" aria-label="Augmenter la quantité">+</button></div>' +
          '<p class="qty__max" id="qte-max">Maximum ' + max + (p.statut === 'precommande' ? ' en précommande' : ' (stock disponible)') + '</p></div>' +
          buyButton(p, ' data-qty-from="qte" data-feedback="fb-fiche"') + '</form>' +
          '<p class="add-feedback" id="fb-fiche" hidden></p>'
      : '<p class="buy-off">' + buyButton(p) + ' <a href="boutique.html">Voir les pièces disponibles</a></p>';
    return (notice || '') +
    '<article class="product" aria-labelledby="nom-produit">' +
      '<div class="product__stage" data-turn style="--plinth:' + TF.plinth(p) + '">' +
        '<div class="product__pot">' + TF.potSVG(p, { uid: 'f' + p.ref }) + '</div>' +
        '<p class="product__refstamp" aria-hidden="true">' + p.ref + '</p>' +
        '<p class="product__hint">Survolez ou parcourez au clavier : la pièce tourne.</p>' +
      '</div>' +
      '<div class="product__buy">' +
        '<p class="kicker">' + p.ref + ' · ' + esc(p.type) + '</p>' +
        '<h1 class="product__name" id="nom-produit">' + esc(p.nom) + '</h1>' +
        '<p class="product__glaze">' + esc(p.glacure) + '</p>' +
        '<p class="product__price" id="prix"><span class="product__amount">' + TF.fmt(p.prix) + '</span> <span class="product__ttc">TTC, prix unitaire</span></p>' +
        '<p class="dispo ' + dispoClass(p) + '" id="disponibilite">' + esc(TF.dispoText(p)) + '</p>' +
        qtyField +
        '<ul class="product__quick">' +
          '<li>Livraison de ' + TF.fmt(TF.ZONES[0].frais) + ' à ' + TF.fmt(TF.ZONES[TF.ZONES.length - 1].frais) + ' selon la zone</li>' +
          '<li>Paiement à la livraison possible</li>' +
          '<li>Retour sous quatre jours ouvrables</li>' +
        '</ul>' +
        '<p><a class="link-arrow" href="#infos-achat">Toutes les informations avant achat</a></p>' +
      '</div>' +
    '</article>' +
    '<section class="infos-achat" id="infos-achat" aria-labelledby="t-infos">' +
      '<div class="infos-achat__head"><p class="kicker">Avant d\'acheter</p><h2 id="t-infos">Tout est écrit, avant le panier.</h2>' +
      '<p>Prix, stock, livraison, retours, paiement et vendeur : ces informations sont affichées sur chaque fiche, au même endroit.</p></div>' +
      '<dl class="facts">' +
        '<div class="fact"><dt>Prix</dt><dd><strong>' + TF.fmt(p.prix) + ' TTC</strong> par pièce. Les frais de livraison s\'ajoutent selon votre zone (ci-dessous) et sont affichés avant toute confirmation.</dd></div>' +
        '<div class="fact"><dt>Disponibilité</dt><dd>' + esc(dispoLong) + '</dd></div>' +
        '<div class="fact fact--wide" id="livraison"><dt>Délais et frais de livraison</dt><dd><p>Préparation en atelier : ' + S.preparation + ', puis livraison à domicile selon la zone :</p>' + zonesTable() + '<p class="small">Délais indicatifs de la boutique fictive, à adapter au transporteur réel.</p></dd></div>' +
        '<div class="fact" id="retours"><dt>Retours</dt><dd>Retour possible sous <strong>quatre jours ouvrables</strong> ; remboursement ou réparation sous <strong>quinze jours</strong>. Point de départ du délai et frais de retour : à valider. <a href="retours.html">Retours et remboursements</a></dd></div>' +
        '<div class="fact"><dt>Paiement</dt><dd>À la livraison, ou par carte bancaire (simulation : aucun paiement réel dans cette démo). <a href="cgv.html#paiement">Modalités</a></dd></div>' +
        '<div class="fact"><dt>Garantie</dt><dd>Garantie légale applicable : modalités à valider. Une pièce arrivée cassée est remplacée ou remboursée. <a href="cgv.html#garantie">Conditions</a></dd></div>' +
        '<div class="fact"><dt>Vendeur</dt><dd>' + esc(S.exploitant) + '. ' + esc(S.immatriculation) + ', ' + esc(S.nif) + '. <a href="mentions-legales.html">Mentions légales</a></dd></div>' +
      '</dl>' +
    '</section>' +
    '<section class="story" aria-labelledby="t-story">' +
      '<h2 id="t-story" class="story__title">La pièce</h2>' +
      '<p class="story__text">' + esc(p.texte) + '</p>' +
      '<dl class="story__specs"><div><dt>Dimensions</dt><dd>' + esc(p.dim) + '</dd></div><div><dt>Poids</dt><dd>' + esc(p.poids) + '</dd></div>' +
      '<div><dt>Glaçure</dt><dd>' + esc(p.glacure) + '</dd></div><div><dt>Usage et entretien</dt><dd>' + esc(p.usage) + '</dd></div>' +
      '<div><dt>Référence</dt><dd>' + p.ref + '</dd></div></dl>' +
    '</section>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
