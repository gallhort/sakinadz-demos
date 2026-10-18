/* Horizon Immobilier — interactions (JavaScript natif, sans dépendance).
   - Menu mobile
   - Apparitions au défilement et tracé des plans
   - Écran partagé « Lire un plan » : les pièces s'éclairent selon le texte lu
   - Formulaire de démonstration (vérification locale, aucun envoi) */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  try {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hasIO = 'IntersectionObserver' in window;

    /* Menu mobile */
    var toggle = document.querySelector('.nav__toggle');
    var menu = document.getElementById('menu');
    if (toggle && menu) {
      var setOpen = function (open) {
        toggle.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('is-open', open);
      };
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (menu.classList.contains('is-open') && !menu.contains(e.target) && e.target !== toggle) setOpen(false);
      });
    }

    /* Apparitions + tracé des plans */
    var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal], .plan'));
    if (!hasIO || reduce) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }

    /* Écran partagé : le texte pilote le plan collant */
    var split = document.querySelector('[data-split]');
    if (split) {
      var svg = split.querySelector('.plan');
      var steps = Array.prototype.slice.call(split.querySelectorAll('[data-rooms]'));
      var caption = split.querySelector('[data-split-caption]');
      var defaultCaption = caption ? caption.textContent : '';
      var rooms = svg ? Array.prototype.slice.call(svg.querySelectorAll('.p-room')) : [];
      var current = null;
      var activate = function (step) {
        if (step === current) return;
        current = step;
        var keys = step ? (step.getAttribute('data-rooms') || '').split(' ') : [];
        steps.forEach(function (s) { s.classList.toggle('is-active', s === step); });
        rooms.forEach(function (r) { r.classList.toggle('is-lit', keys.indexOf(r.getAttribute('data-k')) > -1); });
        if (caption) caption.textContent = step ? step.getAttribute('data-caption') : defaultCaption;
      };
      if (hasIO) {
        var sio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { if (entry.isIntersecting) activate(entry.target); });
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
        steps.forEach(function (s) { sio.observe(s); });
        // Retour à l'état neutre quand on remonte au-dessus des étapes
        var intro = split.querySelector('.reading__intro');
        if (intro) {
          new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) { if (entry.isIntersecting) activate(null); });
          }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 }).observe(intro);
        }
      }
    }

    /* Formulaire de démonstration */
    var form = document.getElementById('form');
    if (form) {
      var status = form.querySelector('.form__status');
      var rules = [
        { id: 'f-nom', test: function (v) { return v.trim().length >= 2; }, msg: 'Indiquez votre nom et prénom.' },
        { id: 'f-tel', test: function (v) { return /^\+?[0-9 .\-]{9,}$/.test(v.trim()); }, msg: 'Indiquez un numéro de téléphone valide, par exemple +213 00 00 00 00.' },
        { id: 'f-msg', test: function (v) { return v.trim().length >= 10; }, msg: 'Écrivez quelques mots sur votre projet (10 caractères minimum).' }
      ];
      var check = function (rule) {
        var input = document.getElementById(rule.id);
        var err = document.getElementById('e-' + rule.id.slice(2));
        var ok = rule.test(input.value);
        input.setAttribute('aria-invalid', ok ? 'false' : 'true');
        err.textContent = ok ? '' : rule.msg;
        return ok;
      };
      rules.forEach(function (rule) {
        var input = document.getElementById(rule.id);
        // Une fois signalé, le champ est revérifié pendant la saisie (pas au blur, pour éviter un décalage de mise en page au clic).
        input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') check(rule); });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        rules.forEach(function (rule) { if (!check(rule) && !firstBad) firstBad = document.getElementById(rule.id); });
        if (firstBad) {
          status.classList.remove('is-ok');
          status.textContent = 'Merci de corriger les champs signalés.';
          firstBad.focus();
          return;
        }
        status.classList.add('is-ok');
        status.textContent = 'Démonstration : aucune donnée n\'est envoyée. Sur le site réel, l\'agence recevrait votre message.';
        form.reset();
        rules.forEach(function (rule) { document.getElementById(rule.id).removeAttribute('aria-invalid'); });
      });
    }
  } catch (err) {
    // En cas d'erreur, on retire le mode animé pour que tout reste visible.
    root.classList.remove('js');
  }
})();
