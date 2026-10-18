/* Pupitre maintenance – calculateur du coût annuel (démonstration).
   Aucun envoi de données : tout est calculé dans le navigateur.
   Montants : EXCLUSIVEMENT ceux de l'article (source-article.md). */
(function () {
  'use strict';

  /* ---------- Fourchettes relevées dans l'article (équivalent euros) ---------- */
  var SRC = {
    dzAnnuel: { label: "Forfaits annuels simples, Algérie", min: 65, max: 330, per: 'an', ht: false,
      phrase: "forfaits annuels simples en Algérie environ 65 à 330 € par an" },
    dzPack: { label: "Pack maintenance d'agence, Algérie", min: 65, max: 65, per: 'mois', ht: false,
      phrase: "pack maintenance d'agence en Algérie environ 65 € par mois" },
    dzSeo: { label: "Pack maintenance et référencement, Algérie", min: 230, max: 230, per: 'mois', ht: false,
      phrase: "pack maintenance et référencement en Algérie environ 230 € par mois" },
    frBasique: { label: "Forfait basique pour site vitrine, France", min: 80, max: 250, per: 'mois', ht: false,
      phrase: "forfait basique pour site vitrine en France environ 80 à 250 € par mois" },
    frCorr: { label: "Maintenance corrective seule, France", min: 50, max: 90, per: 'mois', ht: true,
      phrase: "maintenance corrective seule en France environ 50 à 90 € HT par mois" },
    frEvo: { label: "Maintenance évolutive, France", min: 150, max: 300, per: 'mois', ht: true,
      phrase: "maintenance évolutive en France environ 150 à 300 € HT par mois" }
  };
  function yearly(v, ref) { return ref.per === 'mois' ? v * 12 : v; }

  var VOLUME = [
    { name: 'Rares', desc: "Quelques retouches dans l'année : vous restez probablement dans le bas de la fourchette." },
    { name: 'Régulières', desc: "Des changements réguliers : faites préciser combien de demandes le forfait couvre chaque mois." },
    { name: 'Fréquentes', desc: "Beaucoup de demandes : exigez un plafond mensuel écrit, et méfiez-vous d'un forfait « illimité »." }
  ];
  var DELAI = [
    { name: 'Souple', desc: "Pas d'urgence : un traitement dans un délai raisonnable vous suffit." },
    { name: 'Défini', desc: "Vous voulez un délai de traitement écrit dans le contrat, comme le recommande l'article." },
    { name: 'Prioritaire', desc: "Vous attendez un traitement rapide : c'est un facteur qui fait monter le prix." }
  ];
  var TREND = ['bas', 'milieu', 'haut'];
  var DEFAULTS = { tech: 'cms', market: 'dz', needs: ['technique'], volume: 1, delai: 1, creation: '', hyp: 'high' };
  var STORE_KEY = 'pupitre-maintenance-v1';
  var MAX_CREATION = 1000000;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var form = $('#console');
  if (!form) return;

  /* ---------- Formatage ---------- */
  function fmt(n) {
    var s = Math.round(n).toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  function fmtEur(n) { return fmt(n) + ' €'; }
  function fmtNbsp(n) { return fmt(n).replace(/ /g, ' ') + ' €'; }
  function refAmount(ref) {
    var unit = ref.per === 'mois' ? ' € ' + (ref.ht ? 'HT ' : '') + 'par mois' : ' € ' + (ref.ht ? 'HT ' : '') + 'par an';
    return (ref.min === ref.max ? 'environ ' + fmt(ref.min) : fmt(ref.min) + ' à ' + fmt(ref.max)) + unit;
  }

  /* ---------- État ---------- */
  function readForm() {
    return {
      tech: (form.querySelector('input[name="tech"]:checked') || {}).value || 'cms',
      market: (form.querySelector('input[name="market"]:checked') || {}).value || 'dz',
      needs: $$('input[name="need"]:checked', form).map(function (i) { return i.value; }),
      volume: +$('#volume').value,
      delai: +$('#delai').value,
      creation: $('#creation').value,
      hyp: ($('input[name="hyp"]:checked') || {}).value || 'high'
    };
  }
  function writeForm(s) {
    $$('input[name="tech"]', form).forEach(function (i) { i.checked = i.value === s.tech; });
    $$('input[name="market"]', form).forEach(function (i) { i.checked = i.value === s.market; });
    $$('input[name="need"]', form).forEach(function (i) { i.checked = s.needs.indexOf(i.value) > -1; });
    $('#volume').value = s.volume; $('#delai').value = s.delai;
    $('#creation').value = s.creation || '';
    $$('input[name="hyp"]').forEach(function (i) { i.checked = i.value === s.hyp; });
  }
  function save(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return null;
      return {
        tech: s.tech === 'static' ? 'static' : 'cms',
        market: s.market === 'fr' ? 'fr' : 'dz',
        needs: Array.isArray(s.needs) ? s.needs.filter(function (n) { return ['technique', 'editoriale', 'seo', 'evolution'].indexOf(n) > -1; }) : DEFAULTS.needs,
        volume: [0, 1, 2].indexOf(+s.volume) > -1 ? +s.volume : 1,
        delai: [0, 1, 2].indexOf(+s.delai) > -1 ? +s.delai : 1,
        creation: typeof s.creation === 'string' ? s.creation.slice(0, 40) : '',
        hyp: s.hyp === 'low' ? 'low' : 'high'
      };
    } catch (e) { return null; }
  }

  /* ---------- Calcul : choisit la fourchette publiée la plus proche ---------- */
  function compute(s) {
    var has = function (n) { return s.needs.indexOf(n) > -1; };
    var tech = has('technique'), edit = has('editoriale'), seo = has('seo'), evo = has('evolution');
    var core = tech || edit || seo;
    var r = { status: 'ok', bases: [], notes: [], min: 0, max: 0, ht: false, evo: null };

    if (evo) {
      if (s.market === 'fr') {
        r.evo = { ref: SRC.frEvo, text: "Évolution : du développement, facturé à part. Pour la France, l'article relève une maintenance évolutive de 150 à 300 € HT par mois (1 800 à 3 600 € HT par an), non ajoutée à la fourchette." };
      } else {
        r.evo = { ref: null, text: "Évolution : du développement, facturé à part. L'article ne publie pas de tarif d'évolution pour l'Algérie : comptez un devis séparé, non inclus ici." };
      }
      r.notes.push({ warn: false, text: r.evo.text });
    }

    if (!core) {
      r.status = evo ? 'evo-only' : 'empty';
      if (!evo) r.reason = "Activez au moins un canal (technique, éditoriale ou référencement) pour lire une fourchette.";
      else r.reason = "L'évolution n'est pas de la maintenance : c'est du développement, facturé à part. Ajoutez un canal de maintenance pour lire une fourchette annuelle.";
      return finish(r, s);
    }

    if (s.market === 'dz') {
      if (seo) {
        r.bases = [SRC.dzSeo];
        r.min = r.max = yearly(230, SRC.dzSeo);
        r.status = 'single';
        if (s.tech === 'static' && !edit) r.notes.push({ warn: true, text: "Ce pack combine maintenance et référencement : pour un site statique qui change peu, la partie maintenance technique est très réduite." });
      } else if (s.tech === 'static') {
        r.bases = [SRC.dzAnnuel];
        r.min = 65; r.max = 330;
      } else {
        r.bases = [SRC.dzAnnuel, SRC.dzPack];
        r.min = 65; r.max = yearly(65, SRC.dzPack);
        r.notes.push({ warn: false, text: "Pour un CMS, la fourchette va du forfait annuel simple le plus bas (65 € par an) au pack d'agence (65 € par mois, soit 780 € par an)." });
      }
    } else {
      if (!tech && !edit) {
        r.status = 'none';
        r.reason = "L'article ne chiffre pas de forfait de référencement pour la France. Le calculateur préfère ne pas inventer de montant.";
        return finish(r, s);
      }
      if (edit) {
        r.bases = [SRC.frBasique];
        r.min = yearly(80, SRC.frBasique); r.max = yearly(250, SRC.frBasique);
      } else {
        r.bases = [SRC.frCorr];
        r.min = yearly(50, SRC.frCorr); r.max = yearly(90, SRC.frCorr); r.ht = true;
      }
      if (seo) r.notes.push({ warn: true, text: "Référencement : l'article ne le chiffre pas pour la France. Il n'est pas inclus dans cette fourchette." });
      if (s.tech === 'static') r.notes.push({ warn: true, text: "L'article ne publie pas de tarif spécifique au site statique pour la France : ces forfaits peuvent être surdimensionnés pour un site qui change peu." });
    }

    if (s.tech === 'static') {
      if (tech) r.notes.push({ warn: false, text: "Site statique : la maintenance technique est très réduite. Une maintenance n'est pas forcément nécessaire s'il change peu." });
    } else {
      if (!tech) r.notes.push({ warn: true, text: "Vous utilisez un CMS sans maintenance technique : l'article la juge indispensable pour WordPress ou tout CMS (mises à jour, failles, sauvegardes)." });
    }
    if (edit && s.volume === 2) r.notes.push({ warn: false, text: "Informations qui changent souvent : c'est précisément le cas où une maintenance éditoriale est utile." });
    return finish(r, s);
  }
  function finish(r, s) {
    var score = s.volume + s.delai;
    r.trend = r.status === 'ok' ? (score <= 1 ? 0 : score === 2 ? 1 : 2) : null;
    if (s.volume === 2) r.notes.push({ warn: true, text: "Volume fréquent : demandez un plafond de demandes mensuelles écrit. Un forfait « illimité » fait partie des formules à éviter." });
    if (s.delai === 2) r.notes.push({ warn: false, text: "Délai prioritaire : faites inscrire le délai de traitement au contrat ; c'est un élément de la formule saine." });
    r.notes.push({ warn: false, text: "Avant de signer : liste fermée de prestations, plafond de demandes, délai défini, et sortie sans conséquence. Aucun abonnement ne devrait conditionner la mise en ligne du site." });
    return r;
  }

  /* ---------- Odomètre ---------- */
  function buildOdo(el, str) {
    var chars = str.split('');
    var same = el.dataset.layout === chars.map(function (c) { return /\d/.test(c) ? 'd' : c; }).join('');
    if (!same) {
      el.innerHTML = '';
      chars.forEach(function (c, i) {
        if (/\d/.test(c)) {
          var col = document.createElement('span'); col.className = 'odo__col';
          var strip = document.createElement('span'); strip.className = 'odo__strip';
          for (var d = 0; d <= 9; d++) { var sp = document.createElement('span'); sp.textContent = d; strip.appendChild(sp); }
          strip.style.transitionDelay = reduce ? '0s' : ((chars.length - i) * 0.06) + 's';
          col.appendChild(strip); el.appendChild(col);
        } else {
          var sep = document.createElement('span');
          sep.className = c === ' ' ? 'odo__sep' : 'odo__sym';
          sep.textContent = c === ' ' ? '' : c;
          el.appendChild(sep);
        }
      });
      el.dataset.layout = chars.map(function (c) { return /\d/.test(c) ? 'd' : c; }).join('');
      // force le reflow pour que la première valeur roule depuis 0
      void el.offsetWidth;
    }
    var strips = $$('.odo__strip', el), k = 0;
    chars.forEach(function (c) {
      if (/\d/.test(c)) { strips[k].style.transform = 'translateY(' + (-c * 10) + '%)'; k++; }
    });
  }

  /* ---------- Rendu du pupitre ---------- */
  var liveTimer;
  function setLed(id, state, text) {
    var li = $('#' + id); li.dataset.state = state; $('.led__state', li).textContent = text;
  }
  function render(s, r) {
    // Faders
    [['volume', VOLUME], ['delai', DELAI]].forEach(function (p) {
      var v = s[p[0]], input = $('#' + p[0]);
      input.setAttribute('aria-valuetext', p[1][v].name);
      $('#' + p[0] + '-desc').textContent = p[1][v].desc;
      $$('span', input.parentNode.querySelector('.fader__ticks')).forEach(function (t, i) { t.classList.toggle('is-on', i === v); });
    });

    $('#ro-market').textContent = 'Tarifs : ' + (s.market === 'dz' ? 'Algérie' : 'France');
    var hasRange = r.status === 'ok' || r.status === 'single';
    $('#ro-value').hidden = !hasRange;
    var nd = $('#ro-nodata');
    nd.hidden = hasRange;
    if (!hasRange) { nd.textContent = r.reason; nd.dataset.kind = r.status === 'empty' ? 'empty' : 'none'; }

    var live, mini;
    if (hasRange) {
      buildOdo($('#odo-min'), fmt(r.min));
      $('#row-max').hidden = r.status === 'single';
      $('#row-min-k').textContent = r.status === 'single' ? '≈' : 'de';
      if (r.status !== 'single') buildOdo($('#odo-max'), fmt(r.max));
      var ht = r.ht ? ' HT' : '';
      $('#ro-sub').innerHTML = r.status === 'single'
        ? '<strong>Environ ' + fmtNbsp(r.min) + ht + ' par an</strong>, soit ' + fmtNbsp(r.min / 12) + ' par mois. Un seul montant relevé&nbsp;: pas de fourchette.'
        : '<strong>' + fmtNbsp(r.min) + ' à ' + fmtNbsp(r.max) + ht + ' par an</strong>, soit environ ' + fmtNbsp(r.min / 12) + ' à ' + fmtNbsp(r.max / 12) + ' par mois.';
      live = r.status === 'single' ? 'Estimation : environ ' + fmt(r.min) + ' euros' + ht + ' par an.' : 'Estimation : de ' + fmt(r.min) + ' à ' + fmt(r.max) + ' euros' + ht + ' par an.';
      mini = (r.status === 'single' ? '≈ ' + fmtNbsp(r.min) : fmt(r.min).replace(/ /g, ' ') + '–' + fmtNbsp(r.max)) + ht + '/an';
    } else {
      $('#ro-sub').textContent = r.evo ? r.evo.text : '';
      live = r.reason; mini = r.status === 'empty' ? 'En attente' : 'Non chiffrable';
    }
    $('#minibar-value').textContent = mini;
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { $('#ro-live').textContent = live; }, 600);

    // Tendance
    var trend = $('#trend');
    trend.hidden = r.trend === null;
    if (r.trend !== null) {
      $('#trend-cursor').style.left = (r.trend * 100 / 3) + '%';
      $('#trend-text').textContent = 'Avec un volume « ' + VOLUME[s.volume].name.toLowerCase() + ' » et un délai « ' + DELAI[s.delai].name.toLowerCase() + ' », vous vous situez probablement vers le ' + TREND[r.trend] + ' de la fourchette. L\'article cite ces deux facteurs sans les chiffrer.';
    }

    // Voyants
    if (s.tech === 'cms') setLed('led-tech', s.needs.indexOf('technique') > -1 ? 'ok' : 'warn', s.needs.indexOf('technique') > -1 ? 'Indispensable (CMS) : incluse' : 'Indispensable (CMS) : absente');
    else setLed('led-tech', 'info', 'Très réduite (site statique)');
    if (hasRange) setLed('led-src', 'ok', 'Trouvée dans l\'article');
    else if (r.status === 'empty') setLed('led-src', 'off', 'En attente de réglages');
    else setLed('led-src', 'warn', 'Non chiffrable avec la source');
    if (r.evo) setLed('led-evo', 'info', 'Développement facturé à part');
    else setLed('led-evo', 'off', 'Non demandée');
    if (s.volume === 2 || s.delai === 2) setLed('led-frame', 'warn', 'À écrire au contrat');
    else setLed('led-frame', 'ok', 'Demandes modérées');

    // Pourquoi
    var bases = $('#why-bases'); bases.innerHTML = '';
    if (r.bases.length) {
      r.bases.forEach(function (b) {
        var li = document.createElement('li');
        var yr = b.per === 'mois' ? ' (' + (b.min === b.max ? fmtNbsp(b.min * 12) : fmtNbsp(b.min * 12) + ' à ' + fmtNbsp(b.max * 12)) + (b.ht ? ' HT' : '') + ' par an)' : '';
        li.innerHTML = '<b>' + b.label + '</b><span class="mono">' + refAmount(b) + yr + '</span><q>' + b.phrase + '</q>';
        bases.appendChild(li);
      });
    } else {
      var li0 = document.createElement('li');
      li0.innerHTML = '<b>Aucune fourchette retenue</b><span>' + r.reason + '</span>';
      bases.appendChild(li0);
    }
    if (r.evo && r.evo.ref) {
      var le = document.createElement('li');
      le.innerHTML = '<b>À part : ' + r.evo.ref.label + '</b><span class="mono">' + refAmount(r.evo.ref) + '</span><q>' + r.evo.ref.phrase + '</q>';
      bases.appendChild(le);
    }
    var notes = $('#why-notes'); notes.innerHTML = '';
    r.notes.forEach(function (n) { var li = document.createElement('li'); li.textContent = n.text; if (n.warn) li.className = 'is-warn'; notes.appendChild(li); });

    var labels = { technique: 'technique', editoriale: 'éditoriale', seo: 'référencement', evolution: 'évolution (à part)' };
    var recap = [
      ['Technologie', s.tech === 'cms' ? 'CMS (WordPress ou autre)' : 'Site statique'],
      ['Tarifs', s.market === 'dz' ? 'relevés en Algérie' : 'relevés en France'],
      ['Contenu', s.needs.length ? s.needs.map(function (n) { return labels[n]; }).join(', ') : 'aucun'],
      ['Volume', VOLUME[s.volume].name], ['Délai', DELAI[s.delai].name]
    ];
    $('#why-recap').innerHTML = recap.map(function (p) { return '<dt>' + p[0] + '</dt><dd>' + p[1] + '</dd>'; }).join('');
  }

  /* ---------- Saisie du prix de création ---------- */
  function parseMoney(raw) {
    var v = (raw || '').trim();
    if (!v) return { state: 'empty' };
    v = v.replace(/[\s  ]/g, '').replace(/€|eur(os?)?$/i, '');
    if (/^-/.test(v)) return { state: 'error', msg: "le prix ne peut pas être négatif." };
    if (v.indexOf(',') > -1 && v.indexOf('.') > -1) v = v.replace(/\./g, '').replace(',', '.');
    else if (v.indexOf(',') > -1) v = v.replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
    if (!/^\d+(\.\d+)?$/.test(v)) return { state: 'error', msg: "saisissez un montant en chiffres, par exemple 1 500 ou 1 250,50." };
    var n = parseFloat(v);
    if (!isFinite(n)) return { state: 'error', msg: "montant illisible." };
    if (n === 0) return { state: 'error', msg: "le prix de création doit être supérieur à 0 €." };
    if (n > MAX_CREATION) return { state: 'error', msg: "montant très élevé (plus de 1 000 000 €) : vérifiez qu'il n'y a pas un zéro de trop." };
    return { state: 'ok', value: n };
  }

  function renderYears(s, r) {
    var p = parseMoney(s.creation);
    var input = $('#creation'), msg = $('#creation-msg');
    input.setAttribute('aria-invalid', p.state === 'error' ? 'true' : 'false');
    msg.classList.toggle('is-error', p.state === 'error');
    var hasRange = r.status === 'ok' || r.status === 'single';
    var low = hasRange ? r.min * 3 : 0, high = hasRange ? r.max * 3 : 0;
    var creation = p.state === 'ok' ? p.value : 0;
    var ht = r.ht ? ' HT' : '';

    if (p.state === 'error') msg.textContent = p.msg;
    else if (p.state === 'empty') msg.textContent = 'Saisissez un montant pour lancer la comparaison.';
    else msg.textContent = 'Prix retenu : ' + creation.toLocaleString('fr-FR', { minimumFractionDigits: creation % 1 ? 2 : 0, maximumFractionDigits: 2 }) + '\u00a0€.';

    var bc = $('#bar-creation'), bl = $('#bar-low'), bh = $('#bar-high');
    bh.hidden = r.status === 'single';
    $('.bar__label', bl).textContent = r.status === 'single' ? 'Maintenance 3 ans' : 'Maintenance 3 ans, bas';
    var top = Math.max(creation, high, 1);
    function setBar(el, val, show) {
      el.classList.toggle('is-empty', !show);
      $('.bar__value', el).textContent = show ? fmtNbsp(val) : '—';
      var pct = show ? Math.max(1.5, val / top * 100) : 1.5;
      var fill = $('.bar__fill', el);
      if (window.matchMedia('(min-width: 700px)').matches) { fill.style.height = (pct * 0.7) + '%'; fill.style.width = ''; }
      else { fill.style.width = pct + '%'; fill.style.height = ''; }
    }
    setBar(bc, creation, p.state === 'ok');
    setBar(bl, low, hasRange);
    setBar(bh, high, hasRange);

    // Anneau
    var maint = s.hyp === 'low' ? low : high;
    var ringOk = p.state === 'ok' && hasRange;
    var total = creation + maint;
    var cPart = ringOk ? Math.round(creation / total * 1000) : 0;
    var mPart = ringOk ? 1000 - cPart : 0;
    var gap = ringOk && cPart > 6 && mPart > 6 ? 6 : 0;
    $('#ring-creation').style.strokeDasharray = Math.max(0, cPart - gap) + ' 1000';
    $('#ring-maint').style.strokeDasharray = Math.max(0, mPart - gap) + ' 1000';
    $('#ring-maint').style.strokeDashoffset = -cPart;
    $('#ring-pct').textContent = ringOk ? Math.round(maint / total * 100) + ' %' : '–';
    $('#lg-creation').textContent = p.state === 'ok' ? fmtNbsp(creation) : '–';
    $('#lg-maint').textContent = hasRange ? fmtNbsp(maint) + ht : '–';
    $('#ring-desc').textContent = ringOk
      ? 'Sur trois ans, hypothèse ' + (s.hyp === 'low' ? 'basse' : 'haute') + ' : création ' + fmt(creation) + ' euros, maintenance ' + fmt(maint) + ' euros, soit ' + Math.round(maint / total * 100) + ' % du total.'
      : 'Répartition indisponible : il manque le prix de création ou une fourchette chiffrée.';
    $('#bars-desc').textContent = 'Création : ' + (p.state === 'ok' ? fmt(creation) + ' euros' : 'non saisie') + '. Maintenance sur trois ans : ' + (hasRange ? (r.status === 'single' ? 'environ ' + fmt(low) : 'de ' + fmt(low) + ' à ' + fmt(high)) + ' euros' + ht : 'non chiffrable') + '.';

    // Verdict
    var v = $('#verdict');
    if (!hasRange) {
      v.innerHTML = 'Pas de comparaison possible pour l\'instant&nbsp;: la lecture du pupitre n\'est pas chiffrée.<small>' + (r.reason || '') + '</small>';
    } else if (p.state !== 'ok') {
      v.innerHTML = 'Sur trois ans, votre maintenance représente ' + (r.status === 'single' ? 'environ ' + fmtNbsp(low) : 'de ' + fmtNbsp(low) + ' à ' + fmtNbsp(high)) + ht + '.<small>' + (p.state === 'error' ? 'Corrigez la saisie du prix de création pour savoir si elle le dépasse.' : 'Ajoutez le prix de création pour savoir si elle le dépasse.') + '</small>';
    } else {
      var txt;
      var note = r.ht ? ' Attention : la maintenance est exprimée HT ; vérifiez si votre prix de création l\'est aussi.' : '';
      if (low > creation) txt = 'Même en bas de fourchette, trois ans de maintenance (' + fmtNbsp(low) + ') dépassent le prix de création (' + fmtNbsp(creation) + '). Cela vaut la peine de vérifier ce que contient le forfait.';
      else if (high > creation && r.status !== 'single') txt = 'En haut de fourchette, trois ans de maintenance (' + fmtNbsp(high) + ') dépassent le prix de création (' + fmtNbsp(creation) + '). En bas de fourchette (' + fmtNbsp(low) + '), ils restent en dessous.';
      else if (high === creation) txt = 'Trois ans de maintenance égalent le prix de création (' + fmtNbsp(creation) + ').';
      else txt = 'Sur trois ans, la maintenance (' + (r.status === 'single' ? fmtNbsp(low) : 'jusqu\'à ' + fmtNbsp(high)) + ') reste inférieure au prix de création (' + fmtNbsp(creation) + ').';
      v.innerHTML = txt + '<small>Calcul : coût annuel lu sur le pupitre × 3, sans évolution ni hausse de prix. Fourchettes relevées dans l\'article, à titre indicatif.' + note + '</small>';
    }
  }

  /* ---------- Orchestration ---------- */
  var state;
  function update(opts) {
    state = readForm();
    var r = compute(state);
    render(state, r);
    renderYears(state, r);
    if (!opts || !opts.noSave) save(state);
  }

  form.addEventListener('input', function () { update(); });
  form.addEventListener('change', function () { update(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  var ctimer;
  $('#creation').addEventListener('input', function () { clearTimeout(ctimer); ctimer = setTimeout(update, 250); });
  $('#creation').addEventListener('blur', function () { clearTimeout(ctimer); update(); });
  $('#creation').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(ctimer); update(); } });
  $$('input[name="hyp"]').forEach(function (i) { i.addEventListener('change', function () { update(); }); });

  $('#reset').addEventListener('click', function () {
    writeForm(DEFAULTS); update();
    $('#console-status').textContent = 'Pupitre remis à zéro.';
  });
  $('#forget').addEventListener('click', function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    writeForm(DEFAULTS); update({ noSave: true });
    $('#console-status').textContent = 'Réglages enregistrés effacés de ce navigateur.';
  });
  $('#print').addEventListener('click', function () { window.print(); });

  var mq = window.matchMedia('(min-width: 700px)');
  if (mq.addEventListener) mq.addEventListener('change', function () { update({ noSave: true }); });

  // État initial
  var saved = load();
  writeForm(saved || DEFAULTS);
  update({ noSave: true });

  /* ---------- Mini-barre mobile ---------- */
  if ('IntersectionObserver' in window) {
    var mini = $('#minibar'), consoleIn = false, readoutIn = true;
    var sync = function () { mini.classList.toggle('is-visible', consoleIn && !readoutIn); };
    new IntersectionObserver(function (es) { es.forEach(function (e) { consoleIn = e.isIntersecting; }); sync(); }, { rootMargin: '0px 0px -30% 0px' }).observe($('.controls'));
    new IntersectionObserver(function (es) { es.forEach(function (e) { readoutIn = e.isIntersecting; }); sync(); }, { threshold: 0.15 }).observe($('#readout'));

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }
  window.addEventListener('beforeprint', function () { $$('.reveal').forEach(function (el) { el.classList.add('is-in'); }); });
})();
