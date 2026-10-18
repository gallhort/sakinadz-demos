/* Contrôle Devis – logique de l'outil (démo, aucune donnée envoyée). */
(function () {
  "use strict";

  var D = window.CQ_DATA;
  if (!D) return;

  var KEY = "controle-devis-demo-v1";
  var COLS = ["A", "B", "C"];
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var plural = function (n, one, many) { return n + " " + (n > 1 ? many : one); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- État et stockage local ---------- */
  function emptyState() {
    var comp = {};
    COLS.forEach(function (c) { comp[c] = {}; });
    return { tab: "eval", answers: {}, signals: {}, name: "", ptype: "", cols: 2, names: { A: "", B: "", C: "" }, comp: comp };
  }
  var state = emptyState();

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s && typeof s === "object") {
        var base = emptyState();
        state = Object.assign(base, s);
        COLS.forEach(function (c) { state.comp[c] = state.comp[c] || {}; });
        state.names = Object.assign(base.names, s.names || {});
      }
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ }
    }, 150);
  }
  function clearStore() {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* ignoré */ }
  }

  /* ---------- Onglets (motif ARIA tablist) ---------- */
  var tabs = $$('[role="tab"]');
  var panels = $$('[role="tabpanel"]');

  function selectTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.id === "tab-" + id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) { p.hidden = p.id !== "panel-" + id; });
    document.body.classList.toggle("on-eval", id === "eval");
    document.body.classList.toggle("on-comp", id === "comp");
    state.tab = id;
    save();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t.id.replace("tab-", ""), false); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, j = null;
      if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % tabs.length;
      else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") j = 0;
      else if (k === "End") j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j].id.replace("tab-", ""), true); }
    });
  });

  function gotoTab(id) {
    selectTab(id, false);
    var tool = $("#outil");
    tool.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    $("#tab-" + id).focus({ preventScroll: true });
  }

  /* ---------- Onglet 1 : évaluation ---------- */
  var form = $("#evalForm");
  var qById = {};
  D.questions.forEach(function (q) { qById[q.n] = q; });
  var themeTitle = {};
  D.themes.forEach(function (t) { themeTitle[t.id] = t.title; });
  var sigById = {};
  D.signals.forEach(function (s) { sigById[s.id] = s; });
  var LABEL = { oui: "Oui", non: "Non", nsp: "Je ne sais pas" };
  var MARK = { oui: "Oui", non: "Non", nsp: "À clarifier" };

  // Construction des bandes graduées (relevé, barre mobile, règle)
  function buildStrip(el) {
    var html = "";
    for (var n = 1; n <= 12; n++) html += '<li data-n="' + n + '"></li>';
    el.innerHTML = html;
  }
  buildStrip($("#tallyStrip"));
  buildStrip($("#miniStrip"));
  (function () {
    var html = "";
    for (var n = 1; n <= 12; n++) html += '<li data-n="' + n + '"><span>' + pad(n) + "</span></li>";
    $("#rulerCells").innerHTML = html;
  })();

  // Tampon sur chaque question
  $$(".q").forEach(function (fs) {
    var m = fs.querySelector(".q-mark");
    m.className = "q-mark stamp";
    m.innerHTML = "<b></b>";
  });

  function applyAnswersToForm() {
    D.questions.forEach(function (q) {
      $$('input[name="q' + q.n + '"]').forEach(function (r) { r.checked = state.answers[q.n] === r.value; });
    });
    D.signals.forEach(function (s) { var cb = form.querySelector('input[name="' + s.id + '"]'); if (cb) cb.checked = !!state.signals[s.id]; });
    $("#provName").value = state.name || "";
    $$('input[name="ptype"]').forEach(function (r) { r.checked = r.value === state.ptype; });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); });
  form.addEventListener("change", function (e) {
    var t = e.target;
    var m = /^q(\d+)$/.exec(t.name || "");
    if (m) { state.answers[m[1]] = t.value; renderEval(Number(m[1])); save(); return; }
    if (sigById[t.name]) { state.signals[t.name] = t.checked; renderEval(); save(); return; }
    if (t.name === "ptype") { state.ptype = t.value; renderEval(); save(); }
  });
  $("#provName").addEventListener("input", function (e) { state.name = e.target.value.slice(0, 80); renderMeta(); save(); });

  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-clear]");
    if (!b) return;
    var n = b.getAttribute("data-clear");
    delete state.answers[n];
    $$('input[name="q' + n + '"]').forEach(function (r) { r.checked = false; });
    renderEval();
    save();
    var first = $('input[name="q' + n + '"]');
    if (first) first.focus();
  });

  function counts() {
    var c = { oui: 0, non: 0, nsp: 0, answered: 0 };
    D.questions.forEach(function (q) {
      var a = state.answers[q.n];
      if (a && c[a] !== undefined) { c[a]++; c.answered++; }
    });
    return c;
  }

  function detectedSignals() {
    var list = [];
    D.signals.forEach(function (s) {
      var sources = [];
      if (state.signals[s.id]) sources.push("Constaté par vous");
      D.questions.forEach(function (q) {
        if (q.signal === s.id && state.answers[q.n] === "non") sources.push("Déduit de la question " + q.n);
      });
      if (sources.length) list.push({ s: s, sources: sources });
    });
    return list;
  }

  function renderMeta() {
    var parts = [];
    var name = (state.name || "").trim();
    parts.push(name ? "Prestataire : " + name : "Prestataire non renseigné");
    var pt = D.providerTypes.filter(function (p) { return p.id === state.ptype; })[0];
    if (pt) parts.push(pt.label);
    $("#reportMeta").textContent = parts.join(" · ");
  }

  var lastVerdict = null;
  function setStamp(el, cls, top, main, label) {
    el.classList.remove("stamp--green", "stamp--red", "stamp--blue", "stamp--ink");
    el.classList.add(cls);
    el.setAttribute("aria-label", label);
    var t = el.querySelector("span"), m = el.querySelector("b");
    if (t) t.textContent = top;
    m.textContent = main;
  }
  function slam(el) {
    if (reduceMotion) return;
    el.classList.remove("is-slam");
    void el.offsetWidth;
    el.classList.add("is-slam");
  }

  function renderEval(changedQ) {
    var c = counts();

    // Questions : état visuel + tampon + bouton effacer
    D.questions.forEach(function (q) {
      var fs = $("#q" + q.n), a = state.answers[q.n];
      if (a) fs.setAttribute("data-answer", a); else fs.removeAttribute("data-answer");
      var mark = fs.querySelector(".q-mark");
      mark.classList.remove("stamp--green", "stamp--red", "stamp--blue");
      if (a) {
        mark.classList.add(a === "oui" ? "stamp--green" : a === "non" ? "stamp--red" : "stamp--blue");
        mark.querySelector("b").textContent = MARK[a];
        mark.style.setProperty("--rot", (q.n % 2 ? -9 : 7) + "deg");
        if (changedQ === q.n) slam(mark);
      }
      fs.querySelector(".q-clear").hidden = !a;
    });

    // Bandes graduées
    [$("#tallyStrip"), $("#miniStrip"), $("#rulerCells")].forEach(function (strip) {
      $$("li", strip).forEach(function (li) {
        var a = state.answers[li.getAttribute("data-n")];
        if (a) li.setAttribute("data-s", a); else li.removeAttribute("data-s");
      });
    });
    $("#tallyCount").textContent = c.answered + " sur 12 répondues";
    $("#miniCount").textContent = c.answered + "/12";
    $("#tOui").textContent = c.oui;
    $("#tNsp").textContent = c.nsp;
    $("#tNon").textContent = c.non;

    // Jauge
    $("#gaugeBig").textContent = c.oui;
    $("#needle").style.setProperty("--pos", c.oui);
    $("#needleLabel").textContent = "Score " + c.oui;
    var rest = 12 - c.answered;
    $("#gaugeDetail").textContent = c.answered === 0
      ? "Aucune réponse pour l’instant : commencez par la question 1."
      : [plural(c.oui, "Oui", "Oui"), c.nsp + " à clarifier", plural(c.non, "Non", "Non"), rest + " sans réponse"].join(" · ") + ".";

    // Verdict
    var stamp = $("#verdictStamp"), v;
    if (c.answered === 0) v = ["stamp--ink", "Inspection", "En attente", "Verdict : en attente de réponses"];
    else if (c.answered < 12) v = ["stamp--ink", "Provisoire " + c.answered + "/12", "En cours", "Verdict provisoire : inspection en cours, " + c.answered + " questions sur 12 répondues"];
    else if (c.non > 0) v = ["stamp--red", state.answers[7] === "non" ? "Domaine d’abord" : "Avant signature", "À renégocier", "Verdict : à renégocier avant de signer, " + plural(c.non, "point faible", "points faibles")];
    else if (c.nsp > 0) v = ["stamp--blue", "Avant signature", "À clarifier", "Verdict : à clarifier avant de signer, " + plural(c.nsp, "question ouverte", "questions ouvertes")];
    else v = ["stamp--green", "Contrôlé", "Sans case vide", "Verdict : sans case vide, 12 réponses sur 12"];
    setStamp(stamp, v[0], v[1], v[2], v[3]);
    var key = v[2] + v[1];
    if (lastVerdict !== null && key !== lastVerdict) slam(stamp);
    lastVerdict = key;

    // Signaux
    var sigs = detectedSignals();
    var sStamp = $("#signalStamp");
    if (sigs.length) setStamp(sStamp, "stamp--red", "Signaux", sigs.length + " détecté" + (sigs.length > 1 ? "s" : ""), "Signaux d’alerte : " + sigs.length + " détecté" + (sigs.length > 1 ? "s" : ""));
    else if (c.answered === 0) setStamp(sStamp, "stamp--ink", "Signaux", "—", "Signaux d’alerte : pas encore évalués");
    else setStamp(sStamp, "stamp--green", "Signaux", "Aucun", "Signaux d’alerte : aucun détecté");

    D.signals.forEach(function (s) {
      var lab = $("#sig-" + s.id), em = lab.querySelector(".sig-auto");
      var from = D.questions.filter(function (q) { return q.signal === s.id && state.answers[q.n] === "non"; });
      lab.classList.toggle("is-auto", from.length > 0);
      em.hidden = from.length === 0;
      em.textContent = from.length ? "Déduit de votre réponse à la question " + from[0].n : "";
    });

    // Points faibles (Non), la question 7 en premier
    var nons = D.questions.filter(function (q) { return state.answers[q.n] === "non"; })
      .sort(function (a, b) { return (b.critical ? 1 : 0) - (a.critical ? 1 : 0); });
    $("#nNon").textContent = nons.length;
    $("#weakList").innerHTML = nons.length ? nons.map(function (q) {
      return '<article class="weak' + (q.critical ? " is-critical" : "") + '">' +
        '<div class="weak-top"><span class="weak-n" aria-hidden="true">' + pad(q.n) + "</span><div>" +
        '<span class="weak-theme">Question ' + q.n + " · " + esc(themeTitle[q.theme]) + (q.critical ? " · priorité" : "") + "</span>" +
        '<h4 class="weak-q">' + esc(q.short) + "</h4></div></div>" +
        "<p>" + esc(q.why) + "</p>" +
        '<p class="ask"><span class="ask-l">À demander avant de signer</span>« ' + esc(q.ask) + " »</p>" +
        '<a class="weak-edit" href="#q' + q.n + '">Modifier ma réponse à la question ' + q.n + "</a></article>";
    }).join("") : '<p class="empty-note">' + (c.answered ? "Aucun « Non » : rien à renégocier pour l’instant." : "Les points faibles apparaîtront ici, avec leur explication.") + "</p>";

    // À clarifier
    var nsps = D.questions.filter(function (q) { return state.answers[q.n] === "nsp"; });
    $("#nNsp").textContent = nsps.length;
    $("#nspList").innerHTML = nsps.length ? nsps.map(function (q) {
      return '<article class="nsp-item"><span class="weak-theme">Question ' + q.n + " · " + esc(themeTitle[q.theme]) + "</span>" +
        '<h4 class="weak-q">' + esc(q.short) + "</h4>" +
        '<p class="ask"><span class="ask-l">Question à poser</span>« ' + esc(q.ask) + " »</p>" +
        '<a class="nsp-edit" href="#q' + q.n + '">Modifier ma réponse à la question ' + q.n + "</a></article>";
    }).join("") : '<p class="empty-note">Aucune question ouverte.</p>';

    // Sans réponse
    var pending = D.questions.filter(function (q) { return !state.answers[q.n]; });
    $("#pendingBox").innerHTML = (pending.length && pending.length < 12) ?
      "<p>" + plural(pending.length, "question reste", "questions restent") + " sans réponse&nbsp;:</p><ul class=\"chips\">" +
      pending.map(function (q) { return '<li><a href="#q' + q.n + '" aria-label="Aller à la question ' + q.n + '">' + q.n + "</a></li>"; }).join("") + "</ul>" : "";

    // Signaux détectés
    $("#nSig").textContent = sigs.length;
    $("#signalList").innerHTML = sigs.length ? sigs.map(function (x) {
      return '<div class="sig-hit"><span class="src">' + esc(x.sources.join(" · ")) + "</span><b>" + esc(x.s.title) + "</b><p>" + esc(x.s.text) + "</p></div>";
    }).join("") : '<p class="empty-note">Aucun signal d’alerte détecté. Vous pouvez en cocher dans la section F si vous en avez constaté.</p>';

    // Relevé complet
    $("#recapBody").innerHTML = D.questions.map(function (q) {
      var a = state.answers[q.n];
      return "<tr><td>" + q.n + "</td><td>" + esc(q.q) + '</td><td class="ans ans--' + (a || "vide") + '">' + (a ? LABEL[a] : "Sans réponse") + "</td></tr>";
    }).join("");

    // Erreurs liées aux réponses
    var detectedIds = {};
    sigs.forEach(function (x) { detectedIds[x.s.id] = true; });
    D.errors.forEach(function (er) {
      var hit = false;
      if (er.q) { var a = state.answers[er.q]; hit = a === "non" || a === "nsp"; }
      if (er.signal && detectedIds[er.signal]) hit = true;
      var li = $("#err-" + er.id);
      li.classList.toggle("is-hit", hit);
      li.querySelector(".tag--hit").hidden = !hit;
    });

    renderMeta();
  }

  /* Liens « question n » : ouvrir l'onglet, défiler, donner le focus */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#q"]');
    if (!a) return;
    var m = /^#q(\d+)$/.exec(a.getAttribute("href"));
    if (!m) return;
    e.preventDefault();
    if (state.tab !== "eval") selectTab("eval", false);
    var fs = $("#q" + m[1]);
    fs.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    var target = fs.querySelector("input:checked") || fs.querySelector("input");
    target.focus({ preventScroll: true });
    fs.classList.remove("is-flash"); void fs.offsetWidth; fs.classList.add("is-flash");
  });

  /* ---------- Onglet 2 : comparaison ---------- */
  var table = $("#compTable");
  var rowById = {};
  D.compareRows.forEach(function (r) { rowById[r.id] = r; });

  function parseMoney(raw) {
    var s = String(raw || "").trim();
    if (!s) return { empty: true };
    s = s.replace(/[\s  ]/g, "").replace(/(da|dzd|dinars?)\.?$/i, "");
    if (!s) return { error: "Indiquez un montant en chiffres." };
    if (!/^[-+]?[\d.,]+$/.test(s) || !/\d/.test(s)) return { error: "Saisissez un montant en chiffres, sans lettres ni symboles." };
    var hasDot = s.indexOf(".") > -1, hasComma = s.indexOf(",") > -1;
    if (hasDot && hasComma) s = s.replace(/\./g, "").replace(",", ".");
    else if (hasDot && /^[-+]?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else if (hasComma && /^[-+]?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    else if (hasComma) s = s.replace(",", ".");
    if ((s.match(/[.,]/g) || []).length > 1) return { error: "Format de montant non reconnu : utilisez par exemple des espaces entre les milliers." };
    var n = Number(s);
    if (!isFinite(n)) return { error: "Montant non reconnu." };
    if (n < 0) return { error: "Un montant ne peut pas être négatif." };
    if (n >= 1e11) return { error: "Montant hors norme : vérifiez le nombre de zéros." };
    return { value: n, warn: n === 0 ? "Montant nul : à vérifier avec le prestataire." : "" };
  }
  function fmt(n) {
    return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " DA";
  }
  function colName(c) { var n = (state.names[c] || "").trim(); return n || "Devis " + c; }
  function visibleCols() { return state.cols === 3 ? COLS : COLS.slice(0, 2); }

  function applyCompToForm() {
    $$("[data-cell]", table).forEach(function (el) {
      el.value = (state.comp[el.getAttribute("data-col")] || {})[el.getAttribute("data-cell")] || "";
    });
    $$("[data-name]", table).forEach(function (el) { el.value = state.names[el.getAttribute("data-name")] || ""; });
  }

  table.addEventListener("input", function (e) {
    var el = e.target;
    if (el.hasAttribute("data-cell")) {
      state.comp[el.getAttribute("data-col")][el.getAttribute("data-cell")] = el.value.slice(0, 80);
      renderComp(false);
      save();
    } else if (el.hasAttribute("data-name")) {
      state.names[el.getAttribute("data-name")] = el.value.slice(0, 40);
      renderComp(false);
      save();
    }
  });
  table.addEventListener("change", function (e) {
    if (e.target.tagName === "SELECT") { state.comp[e.target.getAttribute("data-col")][e.target.getAttribute("data-cell")] = e.target.value; renderComp(false); save(); }
  });
  // Mise en forme du montant à la sortie du champ
  table.addEventListener("focusout", function (e) { if (e.target.closest(".money")) renderComp(true); });
  $("#compForm").addEventListener("submit", function (e) { e.preventDefault(); });

  function cellStatus(c, r) {
    var v = (state.comp[c] || {})[r.id] || "";
    if (r.type === "money") {
      var p = parseMoney(v);
      if (p.empty) return { st: "empty" };
      if (p.error) return { st: "invalid", msg: p.error };
      return { st: "ok", value: p.value, msg: p.warn };
    }
    if (!v.trim() || v === "Non précisé") return { st: "empty" };
    if (r.alert && v === r.alert) return { st: "alert" };
    return { st: "ok" };
  }

  function renderComp(formatMoney) {
    table.classList.toggle("cols-2", state.cols !== 3);
    var tbtn = $("#toggleCol");
    tbtn.textContent = state.cols === 3 ? "Retirer le devis C" : "Ajouter un troisième devis";
    tbtn.setAttribute("aria-pressed", state.cols === 3 ? "true" : "false");

    var cols = visibleCols();
    var summary = {};
    COLS.forEach(function (c) {
      var s = { empty: 0, invalid: 0, alert: 0, filled: 0, prix: null, cout3: null };
      D.compareRows.forEach(function (r) {
        var st = cellStatus(c, r);
        var input = $("#c-" + r.id + "-" + c), td = input.closest("td");
        td.classList.toggle("is-empty", st.st === "empty");
        td.classList.toggle("is-invalid", st.st === "invalid");
        td.classList.toggle("is-alert", st.st === "alert");
        td.classList.toggle("is-ok", st.st === "ok");
        if (st.st === "empty") s.empty++; else s.filled++;
        if (st.st === "invalid") s.invalid++;
        if (st.st === "alert") s.alert++;
        if (r.type === "money") {
          var msg = $("#c-" + r.id + "-" + c + "-msg");
          var text = st.msg || "", cls = st.st === "invalid" ? "is-err" : (st.msg ? "is-warn" : "");
          if (st.st === "ok") {
            s[r.id] = st.value;
            if (formatMoney && document.activeElement !== input) input.value = fmt(st.value).replace(/\s?DA$/, "");
          }
          msg.textContent = text;
          msg.className = "cell-msg " + cls;
          input.setAttribute("aria-invalid", st.st === "invalid" ? "true" : "false");
        }
      });
      // Cohérence prix / coût sur trois ans
      if (s.prix !== null && s.cout3 !== null && s.cout3 < s.prix) {
        var m3 = $("#c-cout3-" + c + "-msg");
        m3.textContent = "Inférieur au prix du devis : à vérifier.";
        m3.className = "cell-msg is-warn";
      }
      summary[c] = s;
    });

    // Le moins cher sur trois ans (uniquement s'il est unique)
    var withCost = cols.filter(function (c) { return summary[c].cout3 !== null && summary[c].cout3 > 0; });
    var cheapest = null;
    if (withCost.length >= 2) {
      var min = Math.min.apply(null, withCost.map(function (c) { return summary[c].cout3; }));
      var mins = withCost.filter(function (c) { return summary[c].cout3 === min; });
      if (mins.length === 1) cheapest = mins[0];
    }

    // Bilans par colonne
    COLS.forEach(function (c) {
      var s = summary[c], cell = $("#sum-" + c), html;
      if (s.filled === 0) html = '<div class="stamp stamp--ink" role="img" aria-label="' + esc(colName(c)) + ' : à remplir"><span>' + esc(colName(c)) + "</span><b>À remplir</b></div>";
      else if (s.empty === 0) html = '<div class="stamp stamp--green" role="img" aria-label="' + esc(colName(c)) + ' : aucune case vide"><span>' + esc(colName(c)) + "</span><b>0 case vide</b></div>";
      else html = '<div class="stamp stamp--red" role="img" aria-label="' + esc(colName(c)) + " : " + plural(s.empty, "case vide", "cases vides") + '"><span>' + esc(colName(c)) + "</span><b>" + plural(s.empty, "case vide", "cases vides") + "</b></div>";
      var lines = [];
      if (s.filled) lines.push((9 - s.empty) + " critère" + (9 - s.empty > 1 ? "s" : "") + " sur 9 renseigné" + (9 - s.empty > 1 ? "s" : ""));
      if (s.invalid) lines.push(plural(s.invalid, "montant à corriger", "montants à corriger"));
      if (s.alert) lines.push(plural(s.alert, "signal d’alerte", "signaux d’alerte"));
      if (c === cheapest) lines.push('<span class="cheap">Le moins cher sur 3 ans</span>');
      cell.innerHTML = html + (lines.length ? '<div class="sum-lines">' + lines.map(function (l) { return "<span>" + l + "</span>"; }).join("") + "</div>" : "");
      var head = $('th[data-col="' + c + '"]');
      head.querySelector(".col-letter").textContent = c;
    });

    // Verdict général
    var started = cols.filter(function (c) { return summary[c].filled > 0; });
    var box = $("#compVerdict"), out = "";
    if (started.length === 0) out = "";
    else if (started.length < 2) out = "<strong>Remplissez au moins deux devis.</strong><p>La comparaison prend tout son sens quand les mêmes neuf cases sont remplies pour chaque devis.</p>";
    else {
      var minEmpty = Math.min.apply(null, started.map(function (c) { return summary[c].empty; }));
      var best = started.filter(function (c) { return summary[c].empty === minEmpty; });
      if (minEmpty === 0 && best.length === started.length) out = "<strong>Aucune case vide dans les devis comparés.</strong><p>Vous pouvez maintenant comparer sur le fond&nbsp;: contenu, délais, conditions. Vérifiez aussi les signaux d’alerte.</p>";
      else if (best.length === 1) out = "<strong>" + esc(colName(best[0])) + " a le moins de cases vides (" + minEmpty + ").</strong>";
      else out = "<strong>Égalité&nbsp;: " + best.map(function (c) { return esc(colName(c)); }).join(", ") + " ont " + plural(minEmpty, "case vide", "cases vides") + " chacun.</strong>";
      if (!(minEmpty === 0 && best.length === started.length)) out += "<p>Avant de choisir, posez au prestataire les questions des cases hachurées. Comme le dit l’article, le meilleur devis n’est pas le moins cher&nbsp;: c’est celui qui n’a pas de case vide.</p>";
      if (cheapest && best.length === 1 && cheapest !== best[0]) out += "<p>À noter&nbsp;: le moins cher sur trois ans (" + esc(colName(cheapest)) + ") n’est pas le devis le plus complet.</p>";
      var alerted = started.filter(function (c) { return summary[c].alert > 0; });
      if (alerted.length) out += "<p>Signal d’alerte relevé pour " + alerted.map(function (c) { return esc(colName(c)); }).join(", ") + "&nbsp;: domaine ou hébergement au nom du prestataire, ou fichiers non remis. À renégocier avant de signer.</p>";
    }
    box.innerHTML = out;
    var any = COLS.some(function (c) { return summary[c].filled > 0; });
    document.body.classList.toggle("comp-has-data", any);
  }

  /* ---------- Actions ---------- */
  var armed = {};
  function twoStep(btn, key, label, msgEl, doIt) {
    if (armed[key]) {
      if (Date.now() - (armed[key + "At"] || 0) < 600) return; // ignore un double clic accidentel
      clearTimeout(armed[key]);
      armed[key] = null;
      btn.textContent = label;
      doIt();
      return;
    }
    btn.textContent = "Confirmer l’effacement";
    msgEl.textContent = "Cliquez de nouveau pour confirmer. Cette action efface vos saisies.";
    armed[key + "At"] = Date.now();
    armed[key] = setTimeout(function () { armed[key] = null; btn.textContent = label; msgEl.textContent = ""; }, 5000);
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]");
    if (!b) return;
    var act = b.getAttribute("data-action");
    if (act === "print") { preparePrint(true); window.print(); }
    else if (act === "goto-compare") gotoTab("comp");
    else if (act === "goto-eval") gotoTab("eval");
    else if (act === "toggle-col") { state.cols = state.cols === 3 ? 2 : 3; renderComp(false); save(); }
    else if (act === "open-errors" || act === "close-errors") {
      $$("#errorsList details").forEach(function (d) { d.open = act === "open-errors"; });
    } else if (act === "reset-eval") {
      twoStep(b, "eval", "Recommencer l’évaluation", $("#resetEvalMsg"), function () {
        state.answers = {}; state.signals = {}; state.name = ""; state.ptype = "";
        applyAnswersToForm(); renderEval(); save();
        $("#resetEvalMsg").textContent = "Évaluation remise à zéro.";
        var first = $('input[name="q1"]');
        first.closest(".q").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        first.focus({ preventScroll: true });
      });
    } else if (act === "reset-comp") {
      twoStep(b, "comp", "Vider le tableau", $("#resetCompMsg"), function () {
        COLS.forEach(function (c) { state.comp[c] = {}; state.names[c] = ""; });
        applyCompToForm(); renderComp(false); save();
        $("#resetCompMsg").textContent = "Tableau vidé.";
      });
    } else if (act === "clear-storage") {
      var tab = state.tab;
      state = emptyState(); state.tab = tab;
      clearStore();
      applyAnswersToForm(); applyCompToForm(); renderEval(); renderComp(false);
      clearStore();
      $("#clearMsg").textContent = "Données effacées de ce navigateur.";
    }
  });

  /* ---------- Impression ---------- */
  var openedForPrint = [];
  function preparePrint() {
    document.body.classList.toggle("print-all", state.tab === "eval" && document.body.classList.contains("comp-has-data"));
    openedForPrint = [];
    $$("#recap, #errorsList details").forEach(function (d) { if (!d.open) { d.open = true; openedForPrint.push(d); } });
  }
  window.addEventListener("beforeprint", function () { if (!openedForPrint.length) preparePrint(); });
  window.addEventListener("afterprint", function () {
    openedForPrint.forEach(function (d) { d.open = false; });
    openedForPrint = [];
    document.body.classList.remove("print-all");
  });
  $$(".print-url").forEach(function (el) { el.textContent = D.articleUrl; });
  $("#reportDate").textContent = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  /* ---------- Barre mobile et apparitions ---------- */
  if ("IntersectionObserver" in window) {
    var formIn = false, reportIn = false;
    var bar = function () { document.body.classList.toggle("bar-on", formIn && !reportIn); };
    new IntersectionObserver(function (en) { formIn = en[0].isIntersecting; bar(); }).observe(form);
    new IntersectionObserver(function (en) { reportIn = en[0].isIntersecting; bar(); }, { threshold: 0.05 }).observe($("#rapport"));

    if (!reduceMotion) {
      var els = $$(".theme-head, .err, .cta-inner, .comp-wrap");
      els.forEach(function (el) { el.classList.add("reveal"); });
      document.documentElement.classList.add("reveal-ready");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px" });
      els.forEach(function (el) { io.observe(el); });
      window.addEventListener("beforeprint", function () { els.forEach(function (el) { el.classList.add("is-in"); }); });
    }
  }

  /* ---------- Démarrage ---------- */
  load();
  applyAnswersToForm();
  applyCompToForm();
  selectTab(state.tab === "comp" ? "comp" : "eval", false);
  renderEval();
  renderComp(true);
})();
