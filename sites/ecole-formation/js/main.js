/* Centre Cèdre Formation — démo (contenu fictif). JavaScript vanilla, sans dépendance.
   Les dates de session sont FICTIVES : « deuxième dimanche de chaque mois »,
   recalculées à l'ouverture pour que la démonstration reste toujours à jour. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/213000000000";

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* ---------- Année ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Apparitions au défilement + anneaux ---------- */
  var animated = document.querySelectorAll(".reveal, .ring");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    animated.forEach(function (el) { io.observe(el); });
  } else {
    animated.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Sessions fictives ---------- */
  var GROUPS = {
    A: ["Bureautique essentielle", "Anglais par paliers", "Comptabilité pratique"],
    B: ["Excel : tableaux de bord", "Français professionnel", "Premier site web"]
  };
  var fmtFull = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var fmtMonthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
  var fmtMonShort = new Intl.DateTimeFormat("fr-FR", { month: "short" });

  function secondSunday(y, m) {
    var dow = new Date(y, m, 1).getDay();
    return new Date(y, m, 1 + ((7 - dow) % 7) + 7);
  }
  function upcoming(n) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var y = today.getFullYear(), m = today.getMonth(), list = [];
    while (list.length < n) {
      var d = secondSunday(y, m);
      if (d > today) list.push({ date: d, group: ((y * 12 + m) % 2 === 0) ? "A" : "B" });
      m++; if (m > 11) { m = 0; y++; }
    }
    return { today: today, list: list };
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var sessions = upcoming(4);
  var nextByGroup = {};
  sessions.list.forEach(function (s) { if (!nextByGroup[s.group]) nextByGroup[s.group] = s.date; });

  Object.keys(nextByGroup).forEach(function (g) {
    var d = nextByGroup[g];
    document.querySelectorAll('[data-session-day="' + g + '"]').forEach(function (el) { el.textContent = d.getDate(); });
    document.querySelectorAll('[data-session-mon="' + g + '"]').forEach(function (el) { el.textContent = fmtMonShort.format(d); });
    document.querySelectorAll('[data-session-full="' + g + '"]').forEach(function (el) { el.textContent = cap(fmtFull.format(d)); });
  });

  /* Boutons WhatsApp par formation : message prérempli avec la session */
  document.querySelectorAll("[data-wa-formation]").forEach(function (a) {
    var d = nextByGroup[a.getAttribute("data-group")];
    var msg = "Bonjour, je souhaite m'inscrire à la formation « " + a.getAttribute("data-wa-formation") + " »" +
      (d ? " (session du " + fmtFull.format(d) + ")" : "") +
      ". Pouvez-vous m'indiquer les modalités d'inscription ? Merci !";
    a.href = WA + "?text=" + encodeURIComponent(msg);
  });

  /* ---------- Calendrier détachable (élément signature) ---------- */
  var cal = document.querySelector("[data-tearcal]");
  if (cal) {
    var stack = cal.querySelector("[data-tearcal-stack]");
    var controls = document.querySelector("[data-tearcal-controls]");
    var countEl = cal.querySelector("[data-countdown]");
    var live = document.createElement("p");
    live.className = "sr-only"; live.setAttribute("aria-live", "polite");
    cal.appendChild(live);

    stack.innerHTML = "";
    sessions.list.forEach(function (s, i) {
      var sheet = document.createElement("article");
      sheet.className = "tearcal__sheet";
      sheet.setAttribute("aria-label", "Session du " + fmtFull.format(s.date) + " (date fictive)");
      sheet.innerHTML =
        '<p class="tearcal__month">' + cap(fmtMonthYear.format(s.date)) + " <small>Session " + (i + 1) + " / " + sessions.list.length + "</small></p>" +
        '<p class="tearcal__day">' + s.date.getDate() + "</p>" +
        '<p class="tearcal__weekday">' + cap(new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(s.date)) + " · rentrée des groupes</p>" +
        '<ul class="tearcal__list">' + GROUPS[s.group].map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
      stack.appendChild(sheet);
    });

    var sheets = function () { return Array.prototype.slice.call(stack.children); };
    function layout() {
      sheets().forEach(function (el, i) {
        el.classList.toggle("is-top", i === 0);
        el.classList.toggle("is-under", i === 1);
        el.hidden = i > 1;
        if (i === 0) { el.removeAttribute("aria-hidden"); el.tabIndex = -1; }
        else el.setAttribute("aria-hidden", "true");
      });
    }
    layout();

    var days = Math.round((sessions.list[0].date - sessions.today) / 864e5);
    if (countEl) {
      countEl.innerHTML = '<span style="font-size:2.2em;letter-spacing:-.04em;display:block;line-height:.9;white-space:nowrap">J-' + days + "</span> avant la rentrée";
      countEl.hidden = false;
    }
    if (controls) controls.hidden = false;

    var busy = false;
    function tear(dx, dy) {
      if (busy) return;
      var top = stack.firstElementChild;
      busy = true;
      top.style.setProperty("--dx", (dx || 0) + "px");
      top.style.setProperty("--dy", (dy || 0) + "px");
      top.style.transform = "";
      top.classList.add("is-tearing");
      var done = function () {
        top.removeEventListener("animationend", done);
        top.classList.remove("is-tearing");
        stack.appendChild(top);
        layout();
        busy = false;
        var nt = stack.firstElementChild;
        live.textContent = "Session suivante : " + nt.getAttribute("aria-label");
      };
      top.addEventListener("animationend", done);
      // garde-fou si l'animation ne se déclenche pas
      setTimeout(function () { if (busy) done(); }, 1200);
    }
    var btn = document.querySelector("[data-tear]");
    if (btn) btn.addEventListener("click", function () { tear(0, 0); });

    /* Glisser la feuille vers le bas pour l'arracher */
    var startY = null, startX = 0, cur = null;
    stack.addEventListener("pointerdown", function (e) {
      var top = stack.firstElementChild;
      if (busy || !top || !top.contains(e.target)) return;
      startY = e.clientY; startX = e.clientX; cur = top;
      top.setPointerCapture(e.pointerId);
      top.style.transition = "none";
    });
    stack.addEventListener("pointermove", function (e) {
      if (startY === null || !cur) return;
      var dy = Math.max(0, e.clientY - startY), dx = (e.clientX - startX) * 0.4;
      cur.style.transform = "translate(" + dx + "px," + dy * 0.6 + "px) rotate(" + Math.min(dy / 12, 10) + "deg)";
    });
    function end(e) {
      if (startY === null || !cur) return;
      var dy = e.clientY - startY, dx = (e.clientX - startX) * 0.4, el = cur;
      startY = null; cur = null;
      el.style.transition = "";
      if (dy > 70) tear(dx, dy * 0.6);
      else { el.style.transition = "transform .35s cubic-bezier(.34,1.56,.64,1)"; el.style.transform = ""; }
    }
    stack.addEventListener("pointerup", end);
    stack.addEventListener("pointercancel", end);
  }

  /* ---------- Filtre par filière (page formations) ---------- */
  var filterBtns = document.querySelectorAll("[data-filter]");
  if (filterBtns.length) {
    var arts = document.querySelectorAll(".fm[data-filiere]");
    var status = document.querySelector("[data-filter-status]");
    var apply = function (val) {
      var n = 0;
      arts.forEach(function (a) {
        var show = val === "all" || a.getAttribute("data-filiere") === val;
        a.hidden = !show; if (show) n++;
      });
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === val)); });
      if (status) status.textContent = n + (n > 1 ? " formations" : " formation");
    };
    filterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.getAttribute("data-filter"));
        var first = document.querySelector(".fm[data-filiere]:not([hidden])");
        if (first) first.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
    /* Un lien direct vers une formation masquée réaffiche tout */
    var reveal = function () {
      var id = decodeURIComponent(location.hash.slice(1));
      var t = id && document.getElementById(id);
      if (t && t.hidden) { apply("all"); t.scrollIntoView(); }
    };
    window.addEventListener("hashchange", reveal);
    document.querySelectorAll('.finder a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function () {
        var t = document.getElementById(a.getAttribute("href").slice(1));
        if (t && t.hidden) apply("all");
      });
    });
  }

  /* ---------- Horaires : jour courant ---------- */
  var dow = new Date().getDay();
  document.querySelectorAll('.hours__row[data-dow="' + dow + '"]').forEach(function (r) { r.classList.add("is-today"); });
})();
