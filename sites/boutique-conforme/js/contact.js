/* Tafoukt : formulaire de contact (validation locale, rien n'est envoyé). */
(function () {
  'use strict';
  var form = document.getElementById('form-contact');
  if (!form) return;
  var F = [['c-nom', 'Nom', function (v) { return v.trim().length >= 2 ? '' : 'Indiquez votre nom.'; }],
    ['c-joindre', 'Téléphone ou e-mail', function (v) { v = v.trim(); if (!v) return 'Indiquez un téléphone ou un e-mail pour la réponse.'; return (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || /^(\+213|0)\d{8,9}$/.test(v.replace(/[\s.\-()]/g, ''))) ? '' : 'Ni un e-mail ni un numéro reconnu (+213 ou 0, suivi de 8 ou 9 chiffres).'; }],
    ['c-msg', 'Message', function (v) { return v.trim().length >= 10 ? '' : 'Écrivez votre message (10 caractères au moins).'; }]];
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errs = [];
    F.forEach(function (f) {
      var el = document.getElementById(f[0]), out = document.getElementById(f[0] + '-err'), m = f[2](el.value);
      out.textContent = m; out.hidden = !m;
      if (m) { el.setAttribute('aria-invalid', 'true'); errs.push('<li><a href="#' + f[0] + '">' + f[1] + ' : ' + m + '</a></li>'); } else el.removeAttribute('aria-invalid');
    });
    var box = document.getElementById('err-contact'), ok = document.getElementById('c-ok');
    if (errs.length) { box.innerHTML = '<h3>À corriger avant l\'envoi</h3><ul>' + errs.join('') + '</ul>'; box.hidden = false; ok.hidden = true; box.focus(); return; }
    box.hidden = true;
    ok.textContent = 'Démonstration : aucune donnée n\'est envoyée. Dans une vraie boutique, l\'atelier vous répondrait sous un jour ouvrable.';
    ok.hidden = false;
    form.reset();
  });
  form.addEventListener('click', function (e) { var a = e.target.closest('.error-summary a'); if (a) { e.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).focus(); } });
})();
