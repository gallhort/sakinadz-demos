/* Tafoukt : poteries dessinées en SVG.
   Chaque pièce est générée à partir d'un profil (comme sur le tour) et d'une
   recette de glaçure ; un générateur pseudo-aléatoire initialisé par la
   référence rend chaque pièce unique mais stable d'une page à l'autre.
   Les décors sont « tuilables » sur 200 unités : en les faisant glisser,
   la pièce semble tourner sur le tour (voir TF.turn dans core.js). */
(function (root) {
  'use strict';
  var W = 200, BASE = 246, TILE = 200;
  var uidCounter = 0;

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function pt(p) { return r1(p[0]) + ',' + r1(p[1]); }

  /* Catmull-Rom -> Bézier, à partir du 1er point déjà « posé ». */
  function curveThrough(pts) {
    var d = '';
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
    }
    return d;
  }

  var FORMS = {
    vaseHaut:   { h: 228, R: 80, p: [[0, .25], [.04, .23], [.15, .15], [.32, .3], [.58, .52], [.84, .42], [1, .26]], rim: 'col' },
    bol:        { h: 100, R: 94, p: [[0, 1], [.3, .94], [.68, .68], [1, .36]], rim: 'ouvert', base: 226 },
    cruche:     { h: 200, R: 82, p: [[0, .3], [.08, .25], [.2, .25], [.42, .47], [.68, .53], [.9, .43], [1, .32]], rim: 'col', anse: 'cote', bec: true },
    jarre:      { h: 232, R: 92, p: [[0, .33], [.05, .3], [.11, .38], [.42, .63], [.78, .5], [1, .3]], rim: 'col', oreilles: true },
    gargoulette:{ h: 192, R: 86, p: [[0, .14], [.1, .14], [.22, .34], [.52, .57], [.84, .47], [1, .3]], rim: 'col', anse: 'dessus', goulot: true },
    tasse:      { h: 104, R: 66, p: [[0, .66], [.5, .63], [.86, .56], [1, .45]], rim: 'ouvert', anse: 'cote', base: 226 },
    vaseBoule:  { h: 184, R: 88, p: [[0, .2], [.05, .18], [.14, .32], [.5, .67], [.84, .51], [1, .3]], rim: 'col' },
    pichet:     { h: 190, R: 78, p: [[0, .44], [.1, .37], [.3, .4], [.62, .53], [.9, .45], [1, .36]], rim: 'col', anse: 'cote', bec: true },
    tajine:     { h: 156, R: 82, p: [[0, .07], [.05, .1], [.1, .06], [.15, .15], [.55, .52], [.88, .86], [1, .92]], rim: 'bouton', base: 206 },
    assiette:   { plate: true, R: 94, ry: .34, t: 10, puits: .62 },
    platCreux:  { plate: true, R: 94, ry: .38, t: 20, puits: .7 },
    coupelle:   { plate: true, R: 70, ry: .4, t: 18, puits: .72 }
  };

  /* ---------- décors tuilables (x de -200 à 400) ---------- */
  function decorPaths(kind, top, h, rand, color) {
    var out = '', o, i, x, y;
    if (kind === 'bands') {
      var ys = [.3, .36, .62];
      ys.forEach(function (f, k) {
        var yy = top + f * h, th = k === 1 ? 3 : 6;
        // bande irrégulière : épaisseur qui respire, interruption de pinceau
        var d = 'M-200,' + r1(yy);
        for (x = -200; x <= 400; x += 25) d += ' L' + x + ',' + r1(yy + Math.sin((x / TILE) * Math.PI * 4 + k) * 1.4);
        out += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + th + '" stroke-linecap="round" opacity=".9"/>';
      });
      // touches de pinceau verticales (rendent la rotation visible)
      for (o = -200; o <= 200; o += TILE) for (i = 0; i < 6; i++) {
        x = o + i * (TILE / 6) + 8; y = top + .44 * h;
        out += '<path d="M' + x + ',' + r1(y) + ' q4,' + r1(h * .06) + ' 0,' + r1(h * .12) + '" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" opacity=".85"/>';
      }
    } else if (kind === 'losanges') {
      var yB = top + .5 * h, a = h * .12, n = 6, step = TILE / n;
      for (o = -200; o <= 200; o += TILE) for (i = 0; i < n; i++) {
        x = o + i * step + step / 2;
        out += '<path d="M' + r1(x) + ',' + r1(yB - a) + ' L' + r1(x + step * .42) + ',' + r1(yB) + ' L' + r1(x) + ',' + r1(yB + a) + ' L' + r1(x - step * .42) + ',' + r1(yB) + 'Z" fill="none" stroke="' + color + '" stroke-width="2.6"/>';
        out += '<path d="M' + r1(x) + ',' + r1(yB - a * .45) + ' L' + r1(x + step * .19) + ',' + r1(yB) + ' L' + r1(x) + ',' + r1(yB + a * .45) + ' L' + r1(x - step * .19) + ',' + r1(yB) + 'Z" fill="' + color + '"/>';
      }
      // chevrons au col
      var yc = top + .2 * h, d2 = 'M-200,' + r1(yc), m = 12, st = TILE / m;
      for (x = -200, i = 0; x <= 400; x += st, i++) d2 += ' L' + r1(x) + ',' + r1(yc + (i % 2 ? 7 : -7));
      out += '<path d="' + d2 + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round"/>';
      out += '<path d="M-200,' + r1(yB + a + 8) + ' H400 M-200,' + r1(yB - a - 8) + ' H400" stroke="' + color + '" stroke-width="2"/>';
    } else if (kind === 'points') {
      for (o = -200; o <= 200; o += TILE) for (var row = 0; row < 4; row++) for (i = 0; i < 7; i++) {
        x = o + (i + (row % 2) * .5) * (TILE / 7); y = top + (.3 + row * .12) * h;
        out += '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(2.6 + (row === 1 || row === 2 ? 1.2 : 0)) + '" fill="' + color + '"/>';
      }
    } else if (kind === 'vagues') {
      var yv = top + .4 * h, dv = 'M-200,' + r1(yv);
      for (x = -200; x <= 400; x += 5) dv += ' L' + x + ',' + r1(yv + Math.sin(x / TILE * Math.PI * 2 * 5) * 6);
      out += '<path d="' + dv + '" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round"/>';
      out += '<path d="M-200,' + r1(yv - 14) + ' H400 M-200,' + r1(yv + 14) + ' H400" stroke="' + color + '" stroke-width="2"/>';
    } else if (kind === 'incise') {
      // côtes obliques du couvercle de tajine
      for (o = -200; o <= 200; o += TILE) for (i = 0; i < 10; i++) {
        x = o + i * (TILE / 10);
        out += '<path d="M' + r1(x) + ',' + r1(top + h * .18) + ' L' + r1(x + 14) + ',' + r1(top + h * .86) + '" stroke="' + color + '" stroke-width="1.6" opacity=".55"/>';
      }
    } else if (kind === 'levre') {
      // lèvre crème qui coule dans le bleu
      var gy = top + 10, dl = 'M-200,' + (top - 20) + ' L-200,' + gy, nd = 5;
      var dr = []; for (i = 0; i < nd; i++) dr.push({ x: (i + .2 + rand() * .5) * TILE / nd, w: 10 + rand() * 8, len: 8 + rand() * 22 });
      for (o = -200; o <= 200; o += TILE) dr.forEach(function (q) { dl += dripSeg(o + q.x, q.w, gy, q.len); });
      dl += ' L400,' + gy + ' L400,' + (top - 20) + 'Z';
      out += '<path d="' + dl + '" fill="' + color + '"/>';
    }
    return out;
  }

  function dripSeg(x0, w, gy, len) {
    return ' L' + r1(x0) + ',' + r1(gy) +
      ' C' + r1(x0 + w * .32) + ',' + r1(gy) + ' ' + r1(x0 + w * .12) + ',' + r1(gy + len) + ' ' + r1(x0 + w * .5) + ',' + r1(gy + len) +
      ' C' + r1(x0 + w * .88) + ',' + r1(gy + len) + ' ' + r1(x0 + w * .68) + ',' + r1(gy) + ' ' + r1(x0 + w) + ',' + r1(gy);
  }

  function glazePath(top, gy, n, rand) {
    var d = 'M-200,' + r1(top - 30) + ' L-200,' + r1(gy), dr = [], i;
    for (i = 0; i < n; i++) dr.push({ x: (i + .1 + rand() * .55) * TILE / n, w: 9 + rand() * 12, len: 10 + rand() * 34 });
    for (var o = -200; o <= 200; o += TILE) {
      dr.forEach(function (q) {
        d += ' L' + r1(o + q.x - 6) + ',' + r1(gy + (rand() - .5) * 3);
        d += dripSeg(o + q.x, q.w, gy, q.len);
      });
    }
    d += ' L400,' + r1(gy) + ' L400,' + r1(top - 30) + 'Z';
    return d;
  }

  function crackle(top, bottom, rand, color) {
    var d = '', i, x, y, k, a, l;
    var cells = [];
    for (i = 0; i < 26; i++) cells.push([rand() * TILE, top + rand() * (bottom - top)]);
    for (var o = -200; o <= 200; o += TILE) {
      cells.forEach(function (c) {
        x = c[0] + o; y = c[1];
        d += 'M' + r1(x) + ',' + r1(y);
        for (k = 0; k < 3; k++) {
          a = rand() * Math.PI * 2; l = 6 + rand() * 12;
          x += Math.cos(a) * l; y += Math.sin(a) * l;
          d += ' L' + r1(x) + ',' + r1(y);
        }
      });
    }
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width=".7" opacity=".55"/>';
  }

  function shadeDefs(id, finish) {
    var hi = finish === 'brillant' ? .34 : finish === 'satine' ? .2 : .12;
    return '<linearGradient id="' + id + 'sh" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="#1c120c" stop-opacity=".5"/>' +
      '<stop offset=".2" stop-color="#1c120c" stop-opacity=".12"/>' +
      '<stop offset=".36" stop-color="#fff8ec" stop-opacity="' + hi + '"/>' +
      '<stop offset=".55" stop-color="#fff8ec" stop-opacity="0"/>' +
      '<stop offset=".8" stop-color="#1c120c" stop-opacity=".2"/>' +
      '<stop offset="1" stop-color="#1c120c" stop-opacity=".55"/></linearGradient>' +
      '<radialGradient id="' + id + 'ground"><stop offset="0" stop-color="#2b1e17" stop-opacity=".32"/><stop offset="1" stop-color="#2b1e17" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'in" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1c120c" stop-opacity=".38"/><stop offset=".6" stop-color="#1c120c" stop-opacity=".08"/><stop offset="1" stop-color="#fff8ec" stop-opacity=".25"/></linearGradient>';
  }

  /* ---------- pièces tournées ---------- */
  function turned(spec, f, id, rand) {
    var base = f.base || BASE, top = base - f.h, R = f.R;
    var right = f.p.map(function (q) { return [W / 2 + q[1] * R, top + q[0] * f.h]; });
    var left = f.p.map(function (q) { return [W / 2 - q[1] * R, top + q[0] * f.h]; }).reverse();
    var body = 'M' + pt(left[left.length - 1]) + ' L' + pt(right[0]) + curveThrough(right) + ' L' + pt(left[0]) + curveThrough(left) + 'Z';
    var r0 = f.p[0][1] * R, rb = f.p[f.p.length - 1][1] * R;
    var back = '', front = '', defs = shadeDefs(id, spec.finish);
    defs += '<clipPath id="' + id + 'c"><path d="' + body + '"/></clipPath>';
    var clay = spec.clay, g = spec.glaze;
    var stroke = spec.glaze2 || '#2b1e17';

    // anse latérale (derrière la panse)
    if (f.anse === 'cote') {
      var yA = top + f.h * (f.rim === 'ouvert' ? .14 : .2), yB = top + f.h * (f.rim === 'ouvert' ? .7 : .62);
      var xA = W / 2 + R * (f.rim === 'ouvert' ? .62 : f.p[2][1] * 1.05) - 4, xB = W / 2 + R * .5;
      var bulge = f.rim === 'ouvert' ? 34 : 46;
      back += '<path d="M' + r1(xA) + ',' + r1(yA) + ' C' + r1(xA + bulge) + ',' + r1(yA - 6) + ' ' + r1(xB + bulge + 8) + ',' + r1(yB - 10) + ' ' + r1(xB) + ',' + r1(yB) + '" fill="none" stroke="' + stroke + '" stroke-width="13" stroke-linecap="round"/>';
      back += '<path d="M' + r1(xA) + ',' + r1(yA) + ' C' + r1(xA + bulge) + ',' + r1(yA - 6) + ' ' + r1(xB + bulge + 8) + ',' + r1(yB - 10) + ' ' + r1(xB) + ',' + r1(yB) + '" fill="none" stroke="' + g + '" stroke-width="7" stroke-linecap="round"/>';
    }
    if (f.anse === 'dessus') {
      var hx = R * .3, hy = top + f.h * .24;
      back += '<path d="M' + r1(W / 2 - hx) + ',' + r1(hy) + ' C' + r1(W / 2 - hx) + ',' + r1(top - 46) + ' ' + r1(W / 2 + hx) + ',' + r1(top - 46) + ' ' + r1(W / 2 + hx) + ',' + r1(hy) + '" fill="none" stroke="' + stroke + '" stroke-width="12" stroke-linecap="round"/>';
      back += '<path d="M' + r1(W / 2 - hx) + ',' + r1(hy) + ' C' + r1(W / 2 - hx) + ',' + r1(top - 46) + ' ' + r1(W / 2 + hx) + ',' + r1(top - 46) + ' ' + r1(W / 2 + hx) + ',' + r1(hy) + '" fill="none" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/>';
    }
    if (f.goulot) {
      var gx = W / 2 - R * .42, gyy = top + f.h * .3;
      back += '<path d="M' + r1(gx + 8) + ',' + r1(gyy + 10) + ' L' + r1(gx - 26) + ',' + r1(gyy - 30) + ' L' + r1(gx - 16) + ',' + r1(gyy - 36) + ' L' + r1(gx + 20) + ',' + r1(gyy - 2) + 'Z" fill="' + g + '" stroke="' + stroke + '" stroke-width="2"/>';
      back += '<ellipse cx="' + r1(gx - 21) + '" cy="' + r1(gyy - 33) + '" rx="6" ry="3" transform="rotate(-38 ' + r1(gx - 21) + ' ' + r1(gyy - 33) + ')" fill="#2b1e17"/>';
    }
    if (f.oreilles) {
      [-1, 1].forEach(function (s) {
        var ox = W / 2 + s * R * .44, oy = top + f.h * .16;
        back += '<path d="M' + r1(ox) + ',' + r1(oy) + ' c' + (s * 22) + ',-4 ' + (s * 26) + ',22 ' + (s * 6) + ',30" fill="none" stroke="' + stroke + '" stroke-width="9" stroke-linecap="round"/>';
      });
    }

    // corps : terre nue
    front += '<path d="' + body + '" fill="' + clay + '"/>';
    // couches dans la découpe de la panse
    var spin = '';
    var level = spec.level == null ? 1 : spec.level;
    var gy = top + f.h * level;
    if (level >= 1) spin += '<rect x="-200" y="' + (top - 30) + '" width="600" height="' + (f.h + 60) + '" fill="' + g + '"/>';
    else spin += '<path d="' + glazePath(top, gy, spec.drips || 0, rand) + '" fill="' + g + '"/>';
    if (spec.decor && spec.decor !== 'none') spin += decorPaths(spec.decor, top, f.h, rand, spec.decorColor || '#2b1e17');
    if (spec.crackle) spin += crackle(top, Math.min(gy + 10, base), rand, spec.glaze2 || '#3a2a20');
    // traces de tournage
    var rings = '';
    for (var k = 1; k < 9; k++) rings += '<path d="M0,' + r1(top + f.h * k / 9) + ' H200" stroke="#1c120c" stroke-opacity=".06" stroke-width="1.2"/>';
    front += '<g clip-path="url(#' + id + 'c)"><g class="pot-spin" data-tile="200">' + spin + '</g>' + rings +
      '<path d="' + body + '" fill="url(#' + id + 'sh)"/>' +
      (spec.finish === 'brillant' ? '<ellipse cx="' + r1(W / 2 - R * .3) + '" cy="' + r1(top + f.h * .5) + '" rx="' + r1(R * .06) + '" ry="' + r1(f.h * .3) + '" fill="#fffaf0" opacity=".28"/>' : '') +
      '</g>';
    // ouverture
    if (f.rim === 'col') {
      front += '<ellipse cx="100" cy="' + r1(top) + '" rx="' + r1(r0) + '" ry="' + r1(r0 * .26) + '" fill="' + g + '" stroke="' + stroke + '" stroke-width="1.5"/>';
      front += '<ellipse cx="100" cy="' + r1(top + 1) + '" rx="' + r1(r0 * .78) + '" ry="' + r1(r0 * .18) + '" fill="#1c120c" opacity=".85"/>';
    } else if (f.rim === 'ouvert') {
      front += '<ellipse cx="100" cy="' + r1(top) + '" rx="' + r1(r0) + '" ry="' + r1(r0 * .3) + '" fill="' + g + '" stroke="' + stroke + '" stroke-width="1.5"/>';
      front += '<ellipse cx="100" cy="' + r1(top + 2) + '" rx="' + r1(r0 * .9) + '" ry="' + r1(r0 * .25) + '" fill="' + (spec.decor === 'levre' ? g : spec.glaze) + '"/><ellipse cx="100" cy="' + r1(top + 2) + '" rx="' + r1(r0 * .9) + '" ry="' + r1(r0 * .25) + '" fill="url(#' + id + 'in)"/>';
      if (spec.decor === 'levre') front += '<ellipse cx="100" cy="' + r1(top) + '" rx="' + r1(r0) + '" ry="' + r1(r0 * .3) + '" fill="none" stroke="' + spec.decorColor + '" stroke-width="3"/>';
    } else if (f.rim === 'bouton') {
      front += '<ellipse cx="100" cy="' + r1(top - 2) + '" rx="' + r1(r0 * 1.2) + '" ry="' + r1(r0 * .45) + '" fill="' + g + '" stroke="' + stroke + '" stroke-width="1.5"/>';
    }
    if (f.bec) {
      front += '<path d="M' + r1(W / 2 - r0 + 2) + ',' + r1(top - 2) + ' q-14,-3 -20,-10 q10,12 22,16Z" fill="' + g + '" stroke="' + stroke + '" stroke-width="1.5"/>';
    }
    // tajine : plat de base
    var extra = '';
    if (spec.form === 'tajine') {
      var pr = 94, py = base + 2;
      extra = '<path d="M' + (100 - pr) + ',' + py + ' A' + pr + ',' + r1(pr * .3) + ' 0 0 0 ' + (100 + pr) + ',' + py + ' L' + (100 + pr - 8) + ',' + (py + 22) + ' A' + (pr - 8) + ',' + r1((pr - 8) * .3) + ' 0 0 1 ' + (100 - pr + 8) + ',' + (py + 22) + 'Z" fill="' + clay + '"/>' +
        '<path d="M' + (100 - pr) + ',' + py + ' A' + pr + ',' + r1(pr * .3) + ' 0 0 0 ' + (100 + pr) + ',' + py + ' L' + (100 + pr - 8) + ',' + (py + 22) + ' A' + (pr - 8) + ',' + r1((pr - 8) * .3) + ' 0 0 1 ' + (100 - pr + 8) + ',' + (py + 22) + 'Z" fill="url(#' + id + 'sh)"/>' +
        '<ellipse cx="100" cy="' + py + '" rx="' + pr + '" ry="' + r1(pr * .3) + '" fill="' + spec.glaze2 + '"/>';
    }
    var shadowY = spec.form === 'tajine' ? base + 26 : base;
    var shadow = '<ellipse cx="100" cy="' + r1(shadowY + 2) + '" rx="' + r1(Math.max(rb, 60) * 1.35) + '" ry="9" fill="url(#' + id + 'ground)"/>';
    return { defs: defs, body: shadow + extra + back + front };
  }

  /* ---------- pièces plates (vues de trois quarts) ---------- */
  function flat(spec, f, id, rand) {
    var R = f.R, ry = R * f.ry, cy = 150, t = f.t;
    var defs = shadeDefs(id, spec.finish);
    var g = spec.glaze, c = spec.decorColor || '#2b1e17', s = '';
    defs += '<clipPath id="' + id + 'top"><ellipse cx="100" cy="' + cy + '" rx="' + R + '" ry="' + r1(ry) + '"/></clipPath>';
    s += '<ellipse cx="100" cy="' + r1(cy + t + 8) + '" rx="' + r1(R * 1.05) + '" ry="' + r1(ry * .7) + '" fill="url(#' + id + 'ground)"/>';
    // flanc
    var side = 'M' + (100 - R) + ',' + cy + ' A' + R + ',' + r1(ry) + ' 0 0 0 ' + (100 + R) + ',' + cy + ' L' + r1(100 + R * .8) + ',' + (cy + t) + ' A' + r1(R * .8) + ',' + r1(ry * .8) + ' 0 0 1 ' + r1(100 - R * .8) + ',' + (cy + t) + 'Z';
    s += '<path d="' + side + '" fill="' + spec.clay + '"/><path d="' + side + '" fill="url(#' + id + 'sh)"/>';
    s += '<ellipse cx="100" cy="' + cy + '" rx="' + R + '" ry="' + r1(ry) + '" fill="' + g + '"/>';
    // décor dans le plan du plat, mis en perspective ; pot-rot tourne autour du centre
    var dec = '', i, a, n;
    var pr = R * f.puits;
    dec += '<circle r="' + r1(pr) + '" fill="' + spec.glaze2 + '" opacity=".55"/>';
    dec += '<circle r="' + r1(R - 6) + '" fill="none" stroke="' + spec.glaze2 + '" stroke-width="2"/>';
    if (spec.decor === 'rayons') {
      n = 24;
      for (i = 0; i < n; i++) { a = i / n * Math.PI * 2; dec += '<path d="M' + r1(Math.cos(a) * pr * .25) + ',' + r1(Math.sin(a) * pr * .25) + ' L' + r1(Math.cos(a) * (R - 12)) + ',' + r1(Math.sin(a) * (R - 12)) + '" stroke="' + c + '" stroke-width="' + (i % 2 ? 1.4 : 3) + '" stroke-linecap="round" opacity=".8"/>'; }
      dec += '<circle r="' + r1(pr * .22) + '" fill="' + c + '" opacity=".8"/>';
    } else if (spec.decor === 'spirale') {
      var d = 'M0,0';
      for (i = 1; i <= 140; i++) { a = i / 140 * Math.PI * 2 * 3.4; var rr = i / 140 * (R - 14); d += ' L' + r1(Math.cos(a) * rr) + ',' + r1(Math.sin(a) * rr); }
      dec += '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round"/>';
    } else if (spec.decor === 'pointsRond') {
      [[.3, 6], [.58, 12], [.84, 18]].forEach(function (ring) {
        for (i = 0; i < ring[1]; i++) { a = i / ring[1] * Math.PI * 2 + ring[0]; dec += '<circle cx="' + r1(Math.cos(a) * R * ring[0]) + '" cy="' + r1(Math.sin(a) * R * ring[0]) + '" r="' + r1(3 + rand() * 1.6) + '" fill="' + c + '"/>'; }
      });
    }
    s += '<g clip-path="url(#' + id + 'top)"><g transform="translate(100 ' + cy + ') scale(1 ' + f.ry + ')"><g class="pot-rot">' + dec + '</g></g>';
    // reflet
    s += '<ellipse cx="' + r1(100 - R * .35) + '" cy="' + r1(cy - ry * .45) + '" rx="' + r1(R * .32) + '" ry="' + r1(ry * .18) + '" fill="#fffaf0" opacity="' + (spec.finish === 'brillant' ? .3 : .12) + '"/></g>';
    // lèvre
    s += '<ellipse cx="100" cy="' + cy + '" rx="' + R + '" ry="' + r1(ry) + '" fill="none" stroke="' + spec.glaze2 + '" stroke-width="2"/>';
    s += '<path d="M' + (100 - R) + ',' + cy + ' A' + R + ',' + r1(ry) + ' 0 0 1 ' + (100 + R) + ',' + cy + '" fill="none" stroke="#1c120c" stroke-opacity=".25" stroke-width="2"/>';
    return { defs: defs, body: s };
  }

  /* Renvoie le SVG complet. opts : { label, className, decorative } */
  function svg(product, opts) {
    opts = opts || {};
    var spec = product.pot, f = FORMS[spec.form];
    var id = 'p' + product.ref.replace(/\W/g, '') + '-' + (opts.uid || (++uidCounter));
    var rand = rng(hash(product.ref));
    var part = f.plate ? flat(spec, f, id, rand) : turned(spec, f, id, rand);
    var label = opts.label || (product.type + ' « ' + product.nom + ' » : ' + product.glacure.toLowerCase());
    var a11y = opts.decorative ? ' aria-hidden="true" focusable="false"' : ' role="img" aria-label="' + label.replace(/"/g, '&quot;') + '"';
    return '<svg class="pot ' + (opts.className || '') + '" viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"' + a11y + '><defs>' + part.defs + '</defs>' + part.body + '</svg>';
  }

  root.TF = root.TF || {};
  root.TF.potSVG = svg;
})(typeof window !== 'undefined' ? window : globalThis);
