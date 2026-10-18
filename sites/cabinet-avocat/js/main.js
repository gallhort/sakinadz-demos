/* Cabinet Maître Démo – interactions discrètes. Le site reste entièrement utilisable sans JavaScript.
   (La classe .js est posée dans le <head> pour éviter tout flash ; elle conditionne les apparitions.) */
(function () {
  "use strict";

  var doc = document.documentElement;
  var isAr = doc.lang === "ar";
  doc.classList.add("js"); // déjà posée dans le <head>, conservée par sécurité

  /* Menu mobile */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    var mq = window.matchMedia("(max-width: 60rem)");

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-open", String(open));
    };

    toggle.hidden = false;
    setOpen(false);

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mq.matches && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    var onChange = function () { if (!mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
  }

  /* Horaires : met en évidence le jour courant, à l'heure d'Alger */
  var rows = document.querySelectorAll(".hours tr[data-day]");
  if (rows.length) {
    var day;
    try {
      var name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Africa/Algiers" }).format(new Date());
      day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
    } catch (err) {
      day = new Date().getDay();
    }
    rows.forEach(function (row) {
      if (Number(row.getAttribute("data-day")) === day) {
        row.classList.add("is-today");
        var th = row.querySelector("th");
        th.setAttribute("data-today", isAr ? "اليوم" : "Aujourd'hui");
        var sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = isAr ? " (اليوم)" : " (aujourd'hui)";
        th.appendChild(sr);
      }
    });
  }

  /* Copie de l'adresse e-mail */
  document.querySelectorAll(".copy[data-copy]").forEach(function (btn) {
    // Bouton masqué par défaut : il n'apparaît que si le presse-papiers est disponible
    // (en file:// ou sur un navigateur ancien, le lien mailto suffit).
    if (!navigator.clipboard || !window.isSecureContext) return;
    btn.hidden = false;
    var status = btn.parentNode.querySelector(".copy-status");
    var timer;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
        if (status) {
          status.textContent = btn.getAttribute("data-done");
          clearTimeout(timer);
          timer = setTimeout(function () { status.textContent = ""; }, 4000);
        }
      });
    });
  });

  /* Prestations : le sommaire suit la section lue */
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = byId[entry.target.id];
        if (!link || link === current) return;
        if (current) current.removeAttribute("aria-current");
        link.setAttribute("aria-current", "true");
        current = link;
      });
    }, { rootMargin: "-20% 0px -65% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* Apparitions au défilement : une seule fois, puis l'élément reste en place */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length && "IntersectionObserver" in window) {
    // La classe .rv n'est posée qu'ici : sans ce script, rien n'est jamais masqué.
    doc.classList.add("rv");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
