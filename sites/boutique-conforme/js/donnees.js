/* Tafoukt : désinscription (démo) et effacement des données locales. */
(function () {
  'use strict';
  var TF = window.TF;
  var form = document.getElementById('form-desinscription');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = document.getElementById('d-email'), err = document.getElementById('d-email-err'), ok = document.getElementById('d-ok');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) {
      err.textContent = 'Indiquez l\'adresse e-mail à désinscrire (exemple : nom@exemple.dz).'; err.hidden = false; el.setAttribute('aria-invalid', 'true'); ok.hidden = true; el.focus(); return;
    }
    err.hidden = true; el.removeAttribute('aria-invalid');
    ok.textContent = 'Démonstration : aucune donnée n\'est envoyée. Dans une vraie boutique, la désinscription serait prise en compte sous 24 heures.';
    ok.hidden = false; form.reset();
  });
  var b = document.getElementById('effacer-tout');
  if (b) b.addEventListener('click', function () {
    ['tafoukt-panier', 'tafoukt-derniere-commande', 'tafoukt-registre'].forEach(function (k) { TF.storage.remove('localStorage', k); });
    TF.storage.remove('sessionStorage', 'tafoukt-commande');
    TF.cart.save([]);
    var ok = document.getElementById('effacer-ok');
    ok.textContent = 'Panier, commande en cours, dernière commande et registre de démonstration effacés de ce navigateur.'; ok.hidden = false;
  });
})();
