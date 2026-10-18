/* Tafoukt : confirmation, copie du contrat et facture simulées, registre local. */
(function () {
  'use strict';
  var TF = window.TF, S = TF.SHOP, esc = TF.esc;
  var root = document.getElementById('confirmation');
  var o = TF.storage.read('localStorage', 'tafoukt-derniere-commande', null);

  function dt(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' à ' + p(d.getHours()) + ' h ' + p(d.getMinutes());
  }
  function registre() {
    var reg = TF.storage.read('localStorage', 'tafoukt-registre', []);
    if (!Array.isArray(reg)) reg = [];
    var rows = reg.length ? reg.map(function (r) {
      return '<tr><th scope="row">' + esc(r.no) + '</th><td>' + dt(r.date) + '</td><td>' + r.articles + '</td><td class="num">' + TF.fmt(r.total) + (r.totalPre ? ' (+ ' + TF.fmt(r.totalPre) + ' en précommande)' : '') + '</td><td>' + esc(r.paiement) + '</td></tr>';
    }).join('') : '<tr><td colspan="5">Aucune commande de démonstration enregistrée dans ce navigateur.</td></tr>';
    return '<section class="registre no-print" id="registre" aria-labelledby="t-reg"><p class="kicker">Registre des transactions</p>' +
      '<h2 id="t-reg" class="display-3">Le registre (démonstration)</h2>' +
      '<p>Chaque commande confirmée reçoit un numéro et un horodatage. Ici, le registre est gardé uniquement dans votre navigateur ; une vraie boutique le conserve côté serveur (durée de conservation : à valider).</p>' +
      '<div class="table-scroll"><table><caption class="visually-hidden">Commandes de démonstration</caption><thead><tr><th scope="col">Commande</th><th scope="col">Date</th><th scope="col">Pièces</th><th scope="col">Montant TTC</th><th scope="col">Paiement</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="confirm-actions"><a class="btn btn--terre" href="boutique.html">Retour à la boutique</a><button class="btn btn--line" type="button" id="vider-registre">Effacer le registre et la dernière commande</button></p></section>';
  }

  if (!o || !o.lignes) {
    root.innerHTML = '<header class="confirm-head"><h1>Rien<br>à confirmer.</h1><div><p class="confirm-head__txt">Aucune commande confirmée dans ce navigateur. La confirmation, la copie du contrat et la facture apparaissent ici à la fin des trois étapes.</p><p class="confirm-actions"><a class="btn btn--terre btn--big" href="boutique.html">Voir la boutique</a><a class="btn btn--line" href="conformite.html" data-demo-cart>Parcourir une commande d\'exemple</a></p></div></header><section class="docs" aria-label="Documents"><div class="doc" id="contrat"><div class="doc__bar"><h2>Copie du contrat</h2><span class="doc__stamp">En attente</span></div><p>Elle s\'affichera ici après la confirmation.</p></div><div class="doc" id="facture"><div class="doc__bar"><h2>Facture</h2><span class="doc__stamp">En attente</span></div><p>Elle s\'affichera ici après la confirmation.</p></div></section>' + registre();
    bind(); return;
  }

  var now = o.lignes.filter(function (l) { return !l.pre; }), pre = o.lignes.filter(function (l) { return l.pre; });
  var c = o.client;
  var payLabel = o.paiement === 'carte' ? 'Carte bancaire (simulation)' : 'Paiement à la livraison';
  var vendeur = '<p><strong>' + esc(S.exploitant) + '</strong><br>' + esc(S.adresse) + '<br>' + esc(S.immatriculation) + '<br>' + esc(S.nif) + '<br>' + S.tel + ' · ' + S.email + '</p>';
  var acheteur = '<p><strong>' + esc(c.nom) + '</strong><br>' + esc(c.adresse) + ', ' + esc(c.wilaya) + '<br>' + esc(c.tel) + (c.email ? ' · ' + esc(c.email) : '') + '</p>';
  function rows(list) {
    return list.map(function (l) { return '<tr><td>' + esc(l.type) + ' « ' + esc(l.nom) + ' » <span class="small">(' + l.ref + ')</span></td><td class="num">' + l.qty + '</td><td class="num">' + TF.fmt(l.prix) + '</td><td class="num">' + TF.fmt(l.total) + '</td></tr>'; }).join('');
  }
  var thead = '<thead><tr><th scope="col">Désignation</th><th scope="col" class="num">Qté</th><th scope="col" class="num">P. u. TTC</th><th scope="col" class="num">Total TTC</th></tr></thead>';
  var preBlock = pre.length ? '<h3>Précommande</h3><table>' + thead + '<tbody>' + rows(pre) + '</tbody></table><p>Réglée à la disponibilité de la pièce (' + esc(pre[0].dispoLe) + '), avec ses frais d\'envoi : ' + TF.fmt(o.fraisPre) + '. Montant prévu : ' + TF.fmt(o.totalPre) + ' TTC.</p>' : '';

  var contrat = '<article class="doc" id="contrat" aria-labelledby="t-contrat"><div class="doc__bar"><h2 id="t-contrat">Copie du contrat</h2><span class="doc__stamp">Démonstration</span></div>' +
    '<p>Commande <strong>' + esc(o.no) + '</strong>, confirmée le ' + dt(o.date) + '.</p>' +
    '<h3>Vendeur</h3>' + vendeur + '<h3>Acheteur</h3>' + acheteur +
    '<h3>Objet</h3>' + (now.length ? '<table>' + thead + '<tbody>' + rows(now) + '</tbody><tfoot><tr><th scope="row" colspan="3">Livraison (' + esc(o.zoneNom) + ')</th><td class="num">' + TF.fmt(o.frais) + '</td></tr><tr class="doc__grand"><th scope="row" colspan="3">Total TTC</th><td class="num">' + TF.fmt(o.total) + '</td></tr></tfoot></table>' : '<p>Uniquement des pièces en précommande.</p>') + preBlock +
    '<h3>Paiement</h3><p>' + payLabel + ' : ' + esc(o.paiementStatut) + '.</p>' +
    '<h3>Livraison</h3><p>' + esc(o.zoneNom) + '. Préparation ' + S.preparation + ', puis ' + esc(o.delai) + '.</p>' +
    '<h3>Retours</h3><p>Retour possible sous quatre jours ouvrables ; remboursement ou réparation sous quinze jours. Modalités : <a href="retours.html">retours et remboursements</a>.</p>' +
    '<h3>Conditions</h3><p>' + esc(o.cgv) + ', acceptées par l\'acheteur à l\'étape 1 de la commande. Prospection : ' + (o.prospection ? 'acceptée (désinscription gratuite à tout moment, prise en compte sous 24 heures)' : 'refusée') + '.</p>' +
    '<p class="small">Document de démonstration, contenu fictif, sans valeur contractuelle. Modèle à adapter.</p>' +
    '<p class="doc__print no-print"><button type="button" class="btn btn--ink" data-print="contrat">Imprimer le contrat</button></p></article>';

  var facture = '<article class="doc" id="facture" aria-labelledby="t-facture"><div class="doc__bar"><h2 id="t-facture">Facture</h2><span class="doc__stamp">Simulée</span></div>' +
    '<p>Facture n° <strong>F-' + esc(o.no.replace(/^TF-/, '')) + '</strong> du ' + dt(o.date).split(' à ')[0] + ' · Commande ' + esc(o.no) + '</p>' +
    '<h3>Émise par</h3>' + vendeur + '<h3>Facturé à</h3>' + acheteur +
    (now.length ? '<table>' + thead + '<tbody>' + rows(now) + '<tr><td>Livraison : ' + esc(o.zoneNom) + '</td><td class="num">1</td><td class="num">' + TF.fmt(o.frais) + '</td><td class="num">' + TF.fmt(o.frais) + '</td></tr></tbody><tfoot><tr class="doc__grand"><th scope="row" colspan="3">Total TTC</th><td class="num">' + TF.fmt(o.total) + '</td></tr></tfoot></table>' : '<p>Aucun montant facturé à ce jour.</p>') +
    (pre.length ? '<p>Les pièces en précommande seront facturées à leur disponibilité.</p>' : '') +
    '<p>Détail de la TVA : taux et montants à valider selon le régime fiscal du vendeur.</p>' +
    '<p>Mode de paiement : ' + payLabel + ' (' + esc(o.paiementStatut) + ').</p>' +
    '<p class="small">Facture simulée pour la démonstration : numéros, identifiants et montants fictifs.</p>' +
    '<p class="doc__print no-print"><button type="button" class="btn btn--ink" data-print="facture">Imprimer la facture</button></p></article>';

  root.innerHTML = '<header class="confirm-head"><h1>Merci.</h1><div><p class="confirm-head__no">Commande ' + esc(o.no) + ' confirmée</p>' +
    '<p class="confirm-head__txt">' + (now.length ? (o.paiement === 'carte' ? 'Paiement simulé accepté : ' + TF.fmt(o.total) + '. ' : 'Vous réglerez ' + TF.fmt(o.total) + ' à la livraison. ') : '') +
    'La copie du contrat et la facture sont ci-dessous, prêtes à imprimer' + (c.email ? ' (une vraie boutique les enverrait aussi à ' + esc(c.email) + ')' : '') + '.</p>' +
    '<p class="demo-note" role="note">Démonstration : aucune donnée n\'a été envoyée.</p></div></header>' +
    '<section class="docs" aria-label="Vos documents">' + contrat + facture + '</section>' + registre();
  document.title = 'Commande ' + o.no + ' confirmée – Tafoukt (démo)';
  bind();

  function bind() {
    Array.prototype.forEach.call(root.querySelectorAll('[data-print]'), function (b) {
      b.addEventListener('click', function () {
        document.body.setAttribute('data-print', b.getAttribute('data-print'));
        window.print();
      });
    });
    window.addEventListener('afterprint', function () { document.body.removeAttribute('data-print'); });
    var v = document.getElementById('vider-registre');
    if (v) v.addEventListener('click', function () {
      TF.storage.remove('localStorage', 'tafoukt-registre');
      TF.storage.remove('localStorage', 'tafoukt-derniere-commande');
      TF.announce('Registre de démonstration effacé.');
      window.location.reload();
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-demo-cart]'), function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); TF.cart.save([{ ref: 'TF-02', qty: 2 }, { ref: 'TF-07', qty: 1 }]); TF.storage.remove('sessionStorage', 'tafoukt-commande'); location.href = 'commande.html'; });
    });
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }
})();
