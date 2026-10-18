/* Salon Lumière : scripts du site (JavaScript vanilla, aucune dépendance).
   Rien n'est envoyé nulle part : le préparateur ne fait qu'ouvrir WhatsApp
   avec un message prérempli que la cliente envoie elle-même. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA_NUMBER = "213000000000"; // numéro fictif de démonstration

  /* ------------------------------------------------------------------
     Heure d'Alger. L'Algérie vit à UTC+1 toute l'année (pas d'heure d'été) :
     on décale l'horloge UTC d'une heure, ce qui fonctionne quel que soit
     le fuseau de l'appareil de la visiteuse.
     ------------------------------------------------------------------ */
  function algiersNow() {
    var d = new Date(Date.now() + 3600 * 1000);
    return {
      day: d.getUTCDay(),                       // 0 = dimanche … 6 = samedi
      minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
      date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    };
  }

  // Horaires fictifs : samedi → jeudi, fermé le vendredi.
  var HOURS = {
    0: [570, 1140], 1: [570, 1140], 2: [570, 1140], 3: [570, 1140],
    4: [570, 1200], 5: null, 6: [570, 1140]
  };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var DAYS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  function fmtTime(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + " h" + (m ? " " + (m < 10 ? "0" : "") + m : "");
  }

  /* ---------------- Ouvert maintenant / fermé ---------------- */
  function updateOpenStatus() {
    var now = algiersNow();
    var today = HOURS[now.day];
    var open = !!today && now.minutes >= today[0] && now.minutes < today[1];
    var text;
    if (open) {
      text = "Ouvert maintenant · jusqu’à " + fmtTime(today[1]);
    } else {
      var label, start;
      if (today && now.minutes < today[0]) {
        label = "aujourd’hui"; start = today[0];
      } else {
        for (var i = 1; i <= 7; i++) {
          var dd = (now.day + i) % 7;
          if (HOURS[dd]) { label = i === 1 ? "demain" : DAYS[dd]; start = HOURS[dd][0]; break; }
        }
      }
      text = "Fermé · ouverture " + label + " à " + fmtTime(start);
    }
    document.querySelectorAll("[data-open-status]").forEach(function (el) {
      el.textContent = text;
      el.setAttribute("data-state", open ? "open" : "closed");
    });
    document.querySelectorAll(".hours tr[data-day]").forEach(function (tr) {
      tr.classList.toggle("is-today", Number(tr.getAttribute("data-day")) === now.day);
    });
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60 * 1000);

  /* ---------------- Menu mobile ---------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var closeBtn = nav.querySelector(".nav-close");
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
      else toggle.focus();
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });
    // Piège de focus léger dans le menu ouvert
    nav.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
      var f = nav.querySelectorAll("a, button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------- Rideau d'ouverture (accueil) ---------------- */
  var cover = document.querySelector(".cover");
  var curtain = document.querySelector(".curtain");
  var seen = false;
  try { seen = sessionStorage.getItem("lumiere-curtain") === "1"; } catch (e) { /* stockage indisponible */ }
  if (curtain) {
    if (reduceMotion || seen) {
      curtain.parentNode.removeChild(curtain);
      if (cover) cover.classList.add("is-in");
    } else {
      try { sessionStorage.setItem("lumiere-curtain", "1"); } catch (e) { /* rien */ }
      requestAnimationFrame(function () {
        setTimeout(function () {
          curtain.classList.add("is-open");
          if (cover) setTimeout(function () { cover.classList.add("is-in"); }, 550);
        }, 250);
      });
      setTimeout(function () { if (curtain.parentNode) curtain.parentNode.removeChild(curtain); }, 2600);
    }
  } else if (cover) {
    cover.classList.add("is-in");
  }
  // Lettres du titre en cascade
  document.querySelectorAll(".cover__title .l").forEach(function (l, i) {
    l.style.transitionDelay = (i * 70) + "ms";
  });

  /* ---------------- Révélations au défilement ---------------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-fade, .sweep");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    // Un élément masqué par clip-path n'est jamais « visible » pour l'observateur :
    // on observe donc son parent pour les révélations en rideau.
    var watchers = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        (watchers.get(en.target) || []).forEach(function (el) { el.classList.add("is-in"); });
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    revealEls.forEach(function (el) {
      var target = el.classList.contains("reveal") ? el.parentElement : el;
      if (!watchers.has(target)) { watchers.set(target, []); io.observe(target); }
      watchers.get(target).push(el);
    });
  }

  /* ---------------- Ruban de satin lié au défilement ---------------- */
  var tracks = Array.prototype.slice.call(document.querySelectorAll(".ribbon-track"));
  if (tracks.length && !reduceMotion) {
    var paths = [];
    tracks.forEach(function (t) {
      t.querySelectorAll("path").forEach(function (p) {
        p.style.strokeDasharray = "1 1";
        p.style.strokeDashoffset = "1";
        paths.push({ el: p, host: t.parentNode });
      });
    });
    var ticking = false;
    var drawRibbons = function () {
      ticking = false;
      var vh = window.innerHeight;
      paths.forEach(function (o) {
        var r = o.host.getBoundingClientRect();
        var progress = (vh * 0.85 - r.top) / (r.height * 0.9);
        progress = Math.max(0, Math.min(1, progress));
        o.el.style.strokeDashoffset = String(1 - progress);
      });
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(drawRibbons); }
    }, { passive: true });
    window.addEventListener("resize", drawRibbons);
    drawRibbons();
  }

  /* ---------------- Curseur sur mesure (desktop uniquement) ---------------- */
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !reduceMotion) {
    root.classList.add("has-cursor");
    var cur = document.createElement("div");
    cur.className = "cursor is-hidden";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = "<span>Voir</span>";
    document.body.appendChild(cur);
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    var loop = function () {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(loop) : null;
    };
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY;
      cur.classList.remove("is-hidden");
      var t = e.target.closest ? e.target.closest("[data-cursor='view'], a, button, label, input, select") : null;
      cur.classList.toggle("is-view", !!(t && t.getAttribute("data-cursor") === "view"));
      cur.classList.toggle("is-link", !!(t && t.getAttribute("data-cursor") !== "view"));
      if (!raf) raf = requestAnimationFrame(loop);
    });
    document.addEventListener("pointerleave", function () { cur.classList.add("is-hidden"); });
    document.addEventListener("keydown", function () { cur.classList.add("is-hidden"); });
  }

  /* ---------------- Préparateur de message WhatsApp ---------------- */
  document.querySelectorAll("[data-wa-builder]").forEach(function (form) {
    var daysBox = form.querySelector("[data-days]");
    var slotsBox = form.querySelector("[data-slots]");
    var bubble = form.querySelector("[data-wa-preview]");
    var link = form.querySelector("[data-wa-link]");
    var copyBtn = form.querySelector("[data-wa-copy]");
    var errorEl = form.querySelector("[data-wa-error]");
    var nameInput = form.querySelector("input[name='prenom']");
    var bars = form.querySelectorAll(".wa__progress span");
    var uid = form.id || "wa";

    var SLOTS = [
      { id: "matin", label: "Matin", from: 570, to: 720 },
      { id: "midi", label: "Début d’après-midi", from: 720, to: 900 },
      { id: "fin", label: "Fin de journée", from: 900, to: null }
    ];

    // Jours proposés : les six prochains jours d'ouverture
    var now = algiersNow();
    var options = [];
    for (var i = 0; i < 12 && options.length < 6; i++) {
      var d = new Date(now.date.getTime() + i * 86400000);
      var wd = d.getUTCDay();
      var h = HOURS[wd];
      if (!h) continue;
      if (i === 0 && now.minutes > h[1] - 60) continue; // trop tard pour aujourd'hui
      options.push({
        offset: i, wd: wd, close: h[1],
        short: i === 0 ? "Aujourd’hui" : i === 1 ? "Demain" : DAYS_SHORT[wd],
        sub: d.getUTCDate() + " " + MONTHS_SHORT[d.getUTCMonth()],
        long: DAYS[wd] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()]
      });
    }
    daysBox.innerHTML = "";
    options.forEach(function (o, k) {
      var id = uid + "-jour-" + k;
      var wrap = document.createElement("div");
      wrap.className = "chip";
      wrap.innerHTML = '<input type="radio" name="jour" id="' + id + '" value="' + k + '">' +
        '<label for="' + id + '">' + o.short + " <small>" + o.sub + "</small></label>";
      daysBox.appendChild(wrap);
    });

    function selected(name) { var el = form.querySelector("input[name='" + name + "']:checked"); return el; }

    function renderSlots() {
      var dayEl = selected("jour");
      var day = dayEl ? options[Number(dayEl.value)] : null;
      var prev = selected("creneau");
      var prevId = prev ? prev.value : null;
      slotsBox.innerHTML = "";
      SLOTS.forEach(function (s) {
        var to = s.to === null ? (day ? day.close : 1140) : s.to;
        var past = day && day.offset === 0 && now.minutes > to - 30;
        var id = uid + "-creneau-" + s.id;
        var wrap = document.createElement("div");
        wrap.className = "chip";
        wrap.innerHTML = '<input type="radio" name="creneau" id="' + id + '" value="' + s.id + '"' + (past ? " disabled" : "") +
          (prevId === s.id && !past ? " checked" : "") + ">" +
          '<label for="' + id + '">' + s.label + " <small>" + fmtTime(s.from) + " – " + fmtTime(to) + "</small></label>";
        wrap.querySelector("input").dataset.text = s.label.toLowerCase() + " (" + fmtTime(s.from) + " – " + fmtTime(to) + ")";
        slotsBox.appendChild(wrap);
      });
    }

    function buildMessage() {
      var soin = selected("soin"), jour = selected("jour"), creneau = selected("creneau");
      var name = nameInput ? nameInput.value.trim().slice(0, 40) : "";
      var lines = ["Bonjour Salon Lumière,"];
      lines.push("Je souhaiterais un rendez-vous pour : " + (soin ? soin.dataset.label : "…"));
      lines.push("Jour souhaité : " + (jour ? options[Number(jour.value)].long : "…"));
      lines.push("Créneau : " + (creneau ? creneau.dataset.text : "…"));
      if (name) lines.push("Prénom : " + name);
      lines.push("Pouvez-vous me confirmer une disponibilité ? Merci.");
      var count = (soin ? 1 : 0) + (jour ? 1 : 0) + (creneau ? 1 : 0);
      bars.forEach(function (b, idx) { b.classList.toggle("on", idx < count); });
      bubble.textContent = lines.join("\n");
      link.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
      if (count === 3 && errorEl) errorEl.textContent = "";
      return { complete: count === 3, text: lines.join("\n"), soin: soin, jour: jour, creneau: creneau };
    }

    form.addEventListener("change", function (e) {
      if (e.target.name === "jour") renderSlots();
      buildMessage();
    });
    if (nameInput) nameInput.addEventListener("input", buildMessage);
    form.addEventListener("submit", function (e) { e.preventDefault(); });

    link.addEventListener("click", function (e) {
      var m = buildMessage();
      if (!m.complete) {
        e.preventDefault();
        var missing = [];
        if (!m.soin) missing.push("une prestation");
        if (!m.jour) missing.push("un jour");
        if (!m.creneau) missing.push("un créneau");
        errorEl.textContent = "Il manque encore " + (missing.length > 1 ? missing.slice(0, -1).join(", ") + " et " + missing[missing.length - 1] : missing[0]) + ".";
        var target = !m.soin ? form.querySelector("input[name='soin']") : !m.jour ? form.querySelector("input[name='jour']") : form.querySelector("input[name='creneau']:not(:disabled)");
        if (target) target.focus();
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var m = buildMessage();
        var done = function () { errorEl.textContent = "Message copié. Collez-le dans WhatsApp ou par SMS."; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(m.text).then(done, function () { errorEl.textContent = "Copie impossible : sélectionnez le texte du message."; });
        } else {
          errorEl.textContent = "Copie impossible : sélectionnez le texte du message.";
        }
      });
    }

    // Présélection depuis l'adresse (?soin=…) ou un lien « Demander ce soin »
    function preselect(value) {
      var input = form.querySelector("input[name='soin'][value='" + value + "']");
      if (input) { input.checked = true; buildMessage(); }
    }
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("soin")) preselect(params.get("soin"));
    } catch (e) { /* rien */ }
    document.querySelectorAll("[data-ask]").forEach(function (a) {
      a.addEventListener("click", function () { preselect(a.getAttribute("data-ask")); });
    });

    renderSlots();
    buildMessage();
  });

  /* ---------------- Visionneuse de la galerie ---------------- */
  var dialog = document.querySelector(".lightbox");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (dialog && typeof dialog.showModal === "function" && links.length) {
    var img = dialog.querySelector("img");
    var cap = dialog.querySelector(".lightbox__caption");
    var current = 0, opener = null;
    var show = function (i) {
      current = (i + links.length) % links.length;
      var a = links[current];
      img.src = a.getAttribute("href");
      img.alt = a.querySelector("img").alt;
      cap.textContent = a.getAttribute("data-title");
    };
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); opener = a; show(i); dialog.showModal();
      });
    });
    dialog.querySelector("[data-prev]").addEventListener("click", function () { show(current - 1); });
    dialog.querySelector("[data-next]").addEventListener("click", function () { show(current + 1); });
    dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () { if (opener) opener.focus(); });
  }

  /* ---------------- Année du pied de page ---------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  window.__lumiereReady = true;
})();
