/* Tafoukt : tunnel de commande en trois étapes.
   1. Conditions (case à cocher soi-même)  2. Récapitulatif modifiable  3. Confirmation.
   L'état vit dans le sessionStorage de l'onglet : il survit au rechargement
   et au bouton Précédent, et rien n'est envoyé nulle part. */
(function () {
  'use strict';
  var TF = window.TF;
  var KEY = 'tafoukt-commande';
  var NAMES = { 1: 'Conditions', 2: 'Récapitulatif', 3: 'Confirmation' };
  var state = TF.storage.read('sessionStorage', KEY, null) || {};
  state.form = state.form || {};
  var current = 0;
  var $ = function (id) { return document.getElementById(id); };
  function save() { TF.storage.write('sessionStorage', KEY, state); }

  /* ---------- validation ---------- */
  var FIELDS = ['nom', 'tel', 'zone', 'wilaya', 'adresse', 'email'];
  var LABELS = { nom: 'Nom et prénom', tel: 'Téléphone', zone: 'Zone de livraison', wilaya: 'Wilaya et commune', adresse: 'Adresse de livraison', email: 'E-mail', paiement: 'Mode de paiement' };
  function telOk(v) { return /^(\+213|0)\d{8,9}$/.test(String(v || '').replace(/[\s.\-()]/g, '')); }
  function checkForm(f, pay) {
    var e = {};
    if (!f.nom || f.nom.trim().length < 2) e.nom = 'Indiquez votre nom et votre prénom.';
    if (!f.tel || !f.tel.trim()) e.tel = 'Indiquez un numéro de téléphone pour la livraison.';
    else if (!telOk(f.tel)) e.tel = 'Numéro non reconnu : +213 ou 0, suivi de 8 ou 9 chiffres.';
    if (!TF.zone(f.zone)) e.zone = 'Choisissez une zone de livraison : elle fixe les frais et le délai.';
    if (!f.wilaya || !f.wilaya.trim()) e.wilaya = 'Indiquez la wilaya et la commune.';
    if (!f.adresse || f.adresse.trim().length < 5) e.adresse = 'Indiquez une adresse de livraison complète.';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Adresse e-mail non valide (exemple : nom@exemple.dz), ou laissez le champ vide.';
    if (pay !== 'livraison' && pay !== 'carte') e.paiement = 'Choisissez un mode de paiement : aucun n\'est sélectionné par défaut.';
    return e;
  }
  function allowed() {
    if (!TF.cart.get().length) return 0;
    if (!state.cgv) return 1;
    if (Object.keys(checkForm(state.form, state.paiement)).length) return 2;
    return 3;
  }

  /* ---------- erreurs ---------- */
  function summary(box, title, errs) {
    box.innerHTML = '<h3>' + title + '</h3><ul>' + errs.map(function (x) { return '<li><a href="#' + x[0] + '">' + TF.esc(x[1]) + '</a></li>'; }).join('') + '</ul>';
    box.hidden = false;
    box.focus();
  }
  function clearSummary(box) { box.hidden = true; box.innerHTML = ''; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('.error-summary a');
    if (!a) return;
    var t = $(a.getAttribute('href').slice(1));
    if (t) { e.preventDefault(); t.focus(); t.scrollIntoView({ block: 'center' }); }
  });
  function fieldError(id, msg) {
    var input = $(id), out = $(id + '-err');
    if (!out) return;
    if (msg) { out.textContent = msg; out.hidden = false; if (input) input.setAttribute('aria-invalid', 'true'); }
    else { out.hidden = true; out.textContent = ''; if (input) input.removeAttribute('aria-invalid'); }
  }

  /* ---------- indicateur d'étapes ---------- */
  function paintStepper(n) {
    Array.prototype.forEach.call(document.querySelectorAll('#stepper li'), function (li) {
      var s = +li.getAttribute('data-s');
      li.classList.toggle('is-current', s === n);
      li.classList.toggle('is-done', s < n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.querySelector('.stepper__state').textContent = s === n ? 'En cours' : s < n ? 'Faite' : 'À venir';
      // étape faite : on peut y revenir d'un clic
      var inner = li.querySelector('.stepper__back');
      if (s < n && !inner) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'stepper__back';
        b.setAttribute('data-goto', s);
        while (li.firstChild) b.appendChild(li.firstChild);
        b.insertAdjacentHTML('beforeend', '<span class="visually-hidden"> : revenir à cette étape</span>');
        li.appendChild(b);
      } else if (s >= n && inner) {
        var hid = inner.querySelector('.visually-hidden:last-child'); if (hid && /revenir/.test(hid.textContent)) hid.remove();
        while (inner.firstChild) li.appendChild(inner.firstChild);
        inner.remove();
      }
    });
  }

  /* ---------- navigation ---------- */
  function go(n, opts) {
    opts = opts || {};
    var max = allowed();
    if (max === 0) return showEmpty();
    var blocked = n > max;
    if (blocked) n = max;
    current = n; state.step = n; save();
    Array.prototype.forEach.call(document.querySelectorAll('.step'), function (s) { s.hidden = +s.getAttribute('data-step') !== n; });
    $('vide').hidden = true;
    paintStepper(n);
    $('etape-txt').textContent = ': étape ' + n + ' sur 3';
    document.title = 'Étape ' + n + ' sur 3 : ' + NAMES[n] + ' – Tafoukt (démo)';
    var hash = '#etape-' + n;
    if (opts.push) history.pushState({ step: n }, '', hash);
    else history.replaceState({ step: n }, '', hash);
    if (n === 1) renderStep1();
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    if (blocked && opts.explain) {
      var box = $('err-' + n);
      var why = n === 1 ? 'Pour continuer, acceptez d\'abord les conditions de vente.' : 'Pour confirmer, complétez d\'abord le récapitulatif.';
      box.innerHTML = '<h3>Étape précédente à terminer</h3><p>' + why + '</p>'; box.hidden = false;
    }
    if (opts.focus !== false) {
      var target = opts.focusId ? $(opts.focusId) : $('t-e' + n);
      if (target) { target.focus({ preventScroll: true }); }
      window.scrollTo({ top: opts.focusId && target ? target.getBoundingClientRect().top + window.scrollY - 140 : 0, behavior: 'auto' });
    }
    TF.announce('Étape ' + n + ' sur 3 : ' + NAMES[n] + '.');
  }
  function showEmpty() {
    current = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.step'), function (s) { s.hidden = true; });
    paintStepper(0);
    var last = TF.storage.read('localStorage', 'tafoukt-derniere-commande', null);
    var box = $('vide');
    box.innerHTML = '<h2 class="display-3">Votre panier est vide.</h2><p>La commande se fait en trois étapes à partir du panier. Ajoutez d\'abord une ou plusieurs pièces.</p>' +
      '<p class="empty__actions"><a class="btn btn--terre btn--big" href="boutique.html">Voir la boutique</a> <a class="btn btn--line" href="conformite.html" data-demo-cart-here>Remplir un panier d\'exemple</a>' +
      (last ? ' <a class="btn btn--line" href="confirmation.html">Revoir la dernière commande confirmée</a>' : '') + '</p>';
    box.hidden = false;
    var demo = box.querySelector('[data-demo-cart-here]');
    demo.addEventListener('click', function (e) {
      e.preventDefault();
      TF.cart.save([{ ref: 'TF-02', qty: 2 }, { ref: 'TF-07', qty: 1 }]);
      go(1);
    });
    $('etape-txt').textContent = 'en trois étapes';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-goto]');
    if (!b) return;
    go(+b.getAttribute('data-goto'), { push: true, focusId: b.getAttribute('data-focus') || null });
  });
  window.addEventListener('popstate', function () {
    var m = /etape-(\d)/.exec(location.hash);
    go(m ? +m[1] : 1, { explain: true });
  });

  /* ---------- étape 1 ---------- */
  var cgv = $('cgv');
  function renderStep1() {
    cgv.checked = !!state.cgv;
    var t = TF.cart.totals();
    var aside = document.querySelector('[data-mini-summary]');
    aside.innerHTML = '<div class="summary"><h2>Votre panier</h2><ul class="summary__reassure" style="color:inherit;font-size:1rem;margin:0 0 1rem">' +
      t.lines.map(function (l) { return '<li>' + l.qty + ' × ' + TF.esc(l.p.nom) + (l.pre ? ' (précommande)' : '') + ' <strong style="float:right">' + TF.fmt(l.total) + '</strong></li>'; }).join('') +
      '</ul><dl class="sum"><div class="sum__total"><dt>Sous-total TTC</dt><dd>' + TF.fmt(t.sousTotalNow) + '</dd></div></dl><p class="small">Hors livraison ; frais selon la zone, affichés à l\'étape 2.</p>' +
      '<p><a href="panier.html">Modifier le panier</a></p></div>';
  }
  cgv.addEventListener('change', function () {
    state.cgv = cgv.checked; save();
    if (cgv.checked) { fieldError('cgv', ''); $('f-cgv').classList.remove('is-invalid'); clearSummary($('err-1')); }
  });
  $('form-1').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cgv.checked) {
      var msg = 'Cochez la case pour accepter les conditions générales de vente : sans votre accord, la commande ne peut pas continuer.';
      fieldError('cgv', msg);
      $('f-cgv').classList.add('is-invalid');
      summary($('err-1'), 'La commande ne peut pas continuer', [['cgv', msg]]);
      return;
    }
    state.cgv = true; save();
    go(2, { push: true });
  });

  /* ---------- étape 2 ---------- */
  var form2 = $('form-2');
  var linesBox = form2.querySelector('[data-lines]');
  var totalsBox = form2.querySelector('[data-totals]');
  FIELDS.forEach(function (id) {
    var el = $(id);
    el.addEventListener('input', function () { state.form[id] = el.value; save(); if (el.getAttribute('aria-invalid')) fieldError(id, checkForm(state.form, 'livraison')[id] || ''); });
    el.addEventListener('change', function () { state.form[id] = el.value; save(); if (id === 'zone') renderTotals(); });
  });
  Array.prototype.forEach.call(form2.querySelectorAll('[name="paiement"]'), function (r) {
    r.addEventListener('change', function () { state.paiement = r.value; save(); fieldError('pay', ''); $('bloc-paiement').classList.remove('is-invalid'); renderTotals(); });
  });
  $('prospection').addEventListener('change', function (e) { state.prospection = e.target.checked; save(); });

  function renderLines(focusSel) {
    var t = TF.cart.totals();
    if (!t.lines.length) { showEmpty(); return; }
    linesBox.innerHTML = '<ul class="cart__lines cl">' + t.lines.map(function (l) { return TF.lineHTML(l, { prefix: 'c' }); }).join('') + '</ul>' +
      '<p class="small">Une pièce retirée ici est retirée du panier. <a href="boutique.html">Ajouter une autre pièce</a></p>';
    TF.bindTurn(linesBox);
    if (focusSel) { var f = linesBox.querySelector(focusSel); if (f && !f.disabled) f.focus(); else { f = linesBox.querySelector('[data-qty]'); if (f) f.focus(); } }
    renderTotals();
  }
  TF.bindLines(linesBox, function (type, ref, extra, msg) {
    if (type === 'rm') {
      TF.announce('« ' + TF.byRef(ref).nom + ' » retiré de la commande.');
      renderLines('[data-qty]');
      if (current) { var h = $('bloc-articles'); }
    } else {
      var which = document.activeElement && document.activeElement.hasAttribute('data-inc') ? '[data-inc]' : document.activeElement && document.activeElement.hasAttribute('data-dec') ? '[data-dec]' : '[data-qty]';
      renderLines('.line[data-ref="' + ref + '"] ' + which);
      TF.announce((msg ? msg + ' ' : '') + 'Quantité mise à jour. Total : ' + TF.fmt(TF.cart.totals(null, state.form.zone).totalNow) + '.');
    }
  });

  function totalsHTML(t, final) {
    var z = t.zone;
    var html = '<dl class="sum">' +
      '<div><dt>Pièces' + (t.nLater ? ' disponibles' : '') + ' (' + t.nNow + ')</dt><dd data-t="sous-total">' + TF.fmt(t.sousTotalNow) + '</dd></div>' +
      '<div><dt>Livraison' + (z ? ' : ' + TF.esc(z.court) : '') + '</dt><dd data-t="frais">' + (z ? (t.nNow ? TF.fmt(t.fraisNow) : TF.fmt(0)) : 'choisissez une zone') + '</dd></div>' +
      '<div class="sum__total"><dt>Total TTC à régler' + (t.nLater ? ' maintenant' : '') + '</dt><dd data-t="total">' + (z || !t.nNow ? TF.fmt(t.totalNow) : TF.fmt(t.sousTotalNow) + ' + livraison') + '</dd></div></dl>';
    if (t.nLater) {
      html += '<div class="sum__later"><strong>Précommande (' + t.nLater + ') :</strong> ' + TF.fmt(t.sousTotalLater) + ' + livraison ' + (z ? TF.fmt(t.fraisLater) : 'selon la zone') +
        (z ? ' = <strong data-t="total-later">' + TF.fmt(t.totalLater) + '</strong>' : '') + ', réglés à la disponibilité de la pièce, lors d\'un envoi séparé.</div>';
    }
    if (z && !final) html += '<p class="small">Délai : préparation ' + TF.SHOP.preparation + ', puis ' + z.delai + '.</p>';
    return html;
  }
  function renderTotals() {
    totalsBox.innerHTML = '<h3 class="block__title" style="float:none">Total</h3>' + totalsHTML(TF.cart.totals(null, state.form.zone));
  }
  function renderStep2() {
    FIELDS.forEach(function (id) { $(id).value = state.form[id] || ''; });
    Array.prototype.forEach.call(form2.querySelectorAll('[name="paiement"]'), function (r) { r.checked = state.paiement === r.value; });
    $('prospection').checked = !!state.prospection;
    renderLines();
  }
  form2.addEventListener('submit', function (e) {
    e.preventDefault();
    FIELDS.forEach(function (id) { state.form[id] = $(id).value; });
    save();
    var errs = checkForm(state.form, state.paiement), list = [];
    FIELDS.forEach(function (id) { fieldError(id, errs[id] || ''); if (errs[id]) list.push([id, LABELS[id] + ' : ' + errs[id]]); });
    fieldError('pay', errs.paiement || '');
    $('bloc-paiement').classList.toggle('is-invalid', !!errs.paiement);
    if (errs.paiement) list.push(['pay-livraison', LABELS.paiement + ' : ' + errs.paiement]);
    if (!TF.cart.get().length) return showEmpty();
    if (list.length) {
      summary($('err-2'), list.length > 1 ? list.length + ' points à corriger avant de continuer' : 'Un point à corriger avant de continuer', list);
      return;
    }
    clearSummary($('err-2'));
    go(3, { push: true });
  });

  /* ---------- étape 3 ---------- */
  function renderStep3() {
    var t = TF.cart.totals(null, state.form.zone), f = state.form, z = t.zone;
    clearSummary($('err-3'));
    $('paysim').hidden = true;
    var lines = t.lines.map(function (l) {
      return '<li>' + l.qty + ' × <strong>' + TF.esc(l.p.nom) + '</strong> (' + l.p.ref + ', ' + TF.esc(l.p.type.toLowerCase()) + ') à ' + TF.fmt(l.p.prix) + ' = ' + TF.fmt(l.total) + (l.pre ? ' <em>(précommande, réglée à la disponibilité)</em>' : '') + '</li>';
    }).join('');
    var payTxt = state.paiement === 'carte' ? 'Carte bancaire (simulation) : aucun numéro demandé, rien n\'est débité.' : 'Paiement à la livraison, en espèces, au livreur.';
    var due = t.nNow
      ? (state.paiement === 'carte' ? 'À régler maintenant par carte (simulation) : ' : 'À régler à la livraison : ') + '<strong data-t="due">' + TF.fmt(t.totalNow) + '</strong>'
      : 'Rien à régler maintenant : votre précommande sera réglée à la disponibilité.';
    document.querySelector('[data-final]').innerHTML = '<div class="final">' +
      card('Vos pièces', '<ul>' + lines + '</ul>', 2, 'bloc-articles', true) +
      card('Livraison', '<p><strong>' + TF.esc(f.nom) + '</strong>, ' + TF.esc(f.tel) + '</p><p>' + TF.esc(f.adresse) + ', ' + TF.esc(f.wilaya) + '</p><p>' + TF.esc(z.nom) + ' : préparation ' + TF.SHOP.preparation + ', puis ' + z.delai + '.</p>' + (f.email ? '<p>Copie du contrat à : ' + TF.esc(f.email) + '</p>' : ''), 2, 'nom') +
      card('Paiement', '<p>' + payTxt + '</p>', 2, state.paiement === 'carte' ? 'pay-carte' : 'pay-livraison') +
      card('Conditions acceptées', '<p>' + TF.SHOP.versionCgv + ', acceptées à l\'étape 1.</p><p>Nouvelles de l\'atelier : ' + (state.prospection ? 'oui, vous l\'avez accepté' : 'non') + '.</p>', 1, 'cgv') +
      '<div class="final__card final__card--wide"><div class="final__head"><h3>Montants</h3></div>' + totalsHTML(t, true) + '<p class="pay-due">' + due + '</p></div>' +
      '</div>';
    $('confirm-note').textContent = 'En cliquant sur « Confirmer la commande », vous validez la commande et ses conditions. Démonstration : aucune commande n\'est réellement passée, aucune donnée n\'est envoyée.';
  }
  function card(title, body, step, focusId, wide) {
    return '<div class="final__card' + (wide ? ' final__card--wide' : '') + '"><div class="final__head"><h3>' + title + '</h3>' +
      '<button type="button" class="edit" data-goto="' + step + '" data-focus="' + focusId + '">Modifier<span class="visually-hidden"> : ' + title.toLowerCase() + '</span></button></div>' + body + '</div>';
  }

  function paysim() {
    var box = $('paysim'), t = TF.cart.totals(null, state.form.zone);
    box.innerHTML = '<h3>Simulation de paiement par carte</h3>' +
      '<p>Dans une vraie boutique, vous seriez maintenant redirigé vers la page de paiement sécurisée de la banque du vendeur. Ici, rien n\'est débité et <strong>aucun numéro de carte n\'est demandé</strong>.</p>' +
      '<p>Montant simulé : <strong>' + TF.fmt(t.totalNow) + '</strong></p>' +
      '<div class="paysim__actions"><button type="button" class="btn btn--terre" data-sim="ok">Simuler un paiement accepté</button>' +
      '<button type="button" class="btn btn--line" data-sim="ko">Simuler un paiement refusé</button>' +
      '<button type="button" class="btn btn--line" data-sim="cancel">Annuler</button></div>';
    box.hidden = false; box.tabIndex = -1; box.focus();
  }
  $('paysim').addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]'); if (!b) return;
    var v = b.getAttribute('data-sim');
    if (v === 'ok') return finalize('payé (simulation)');
    $('paysim').hidden = true;
    if (v === 'ko') {
      $('err-3').innerHTML = '<h3>Paiement refusé (simulation)</h3><p>Votre commande n\'est pas validée et aucune somme n\'a été débitée. Vous pouvez réessayer, ou <button type="button" class="edit" data-goto="2" data-focus="pay-livraison">choisir le paiement à la livraison</button>.</p>';
      $('err-3').hidden = false; $('err-3').focus();
    } else { $('confirmer').focus(); }
  });

  $('confirmer').addEventListener('click', function () {
    var max = allowed();
    if (max < 3) { go(max || 1, { push: true, explain: true }); return; }
    var t = TF.cart.totals(null, state.form.zone);
    if (state.paiement === 'carte' && t.nNow) return paysim();
    finalize(state.paiement === 'carte' ? 'précommande : réglée à la disponibilité' : 'montant dû à la réception des pièces');
  });

  function finalize(statut) {
    var t = TF.cart.totals(null, state.form.zone), now = new Date();
    var no = 'TF-' + now.getFullYear() + '-' + String(Math.floor(10000 + Math.random() * 89999));
    var order = {
      no: no, date: now.toISOString(),
      lignes: t.lines.map(function (l) { return { ref: l.p.ref, nom: l.p.nom, type: l.p.type, prix: l.p.prix, qty: l.qty, total: l.total, pre: l.pre, dispoLe: l.p.dispoLe || '' }; }),
      zone: t.zone.id, zoneNom: t.zone.nom, delai: t.zone.delai,
      sousTotal: t.sousTotalNow, frais: t.fraisNow, total: t.totalNow,
      sousTotalPre: t.sousTotalLater, fraisPre: t.fraisLater, totalPre: t.totalLater,
      client: { nom: state.form.nom, tel: state.form.tel, wilaya: state.form.wilaya, adresse: state.form.adresse, email: state.form.email || '' },
      paiement: state.paiement, paiementStatut: statut,
      prospection: !!state.prospection, cgv: TF.SHOP.versionCgv
    };
    TF.storage.write('localStorage', 'tafoukt-derniere-commande', order);
    var reg = TF.storage.read('localStorage', 'tafoukt-registre', []);
    if (!Array.isArray(reg)) reg = [];
    reg.unshift({ no: no, date: order.date, total: order.total, totalPre: order.totalPre, paiement: statut, articles: t.count });
    TF.storage.write('localStorage', 'tafoukt-registre', reg.slice(0, 25));
    TF.cart.clear();
    TF.storage.remove('sessionStorage', KEY);
    window.location.href = 'confirmation.html';
  }

  /* ---------- démarrage ---------- */
  var m = /etape-(\d)/.exec(location.hash);
  var want = m ? +m[1] : (state.step || 1);
  if (allowed() === 0) showEmpty();
  else go(want, { focus: false, explain: !!m && want > allowed() });
})();
