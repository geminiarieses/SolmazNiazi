(function () {
  "use strict";

  var UI = window.UI, WORKS = window.WORKS, CATS = window.CATEGORIES, CV = window.CV, CONTACT = window.CONTACT;
  var LANGS = ["en", "nl", "fr"];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- language ---------------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var lang = (function () {
    var q = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(q) > -1) return q;
    var s = store("sn-lang");
    if (LANGS.indexOf(s) > -1) return s;
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.indexOf(n) > -1 ? n : "en";
  })();
  function t(v) { if (v == null) return ""; if (typeof v === "string") return v; return v[lang] != null ? v[lang] : v.en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function setLang(l) {
    lang = l; store("sn-lang", l);
    document.documentElement.lang = l;
    render();
    if (current) fillRoom(current);
  }

  /* ---------------- rendering ---------------- */
  var filter = "all";
  // irregular placements on a 12-column grid (desktop) and 6-column (mobile)
  var PATTERN = [
    { c: 1, s: 6, y: "0" }, { c: 8, s: 4, y: "14vw" },
    { c: 3, s: 4, y: "0" }, { c: 8, s: 5, y: "8vw" },
    { c: 1, s: 4, y: "6vw" }, { c: 6, s: 3, y: "16vw" }, { c: 10, s: 3, y: "2vw" },
    { c: 2, s: 5, y: "0" }, { c: 8, s: 4, y: "10vw" }
  ];
  var MPATTERN = [{ c: 1, s: 6 }, { c: 2, s: 5 }, { c: 1, s: 5 }];

  function render() {
    $$("[data-t]").forEach(function (el) { el.textContent = t(UI[el.getAttribute("data-t")]); });
    $$("[data-t-aria]").forEach(function (el) { el.setAttribute("aria-label", t(UI[el.getAttribute("data-t-aria")])); });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false"); });
    renderFilters();
    renderStations();
    renderPoem();
    $("#bio").innerHTML = UI.bio[lang].map(function (p) { return "<p class='reveal'>" + esc(p) + "</p>"; }).join("");
    renderCV();
    renderContact();
    observeReveals();
  }

  function renderFilters() {
    var items = [{ id: "all", label: UI.all }].concat(CATS);
    $("#filters").innerHTML = items.map(function (c) {
      return "<button role='tab' data-filter='" + c.id + "' aria-selected='" + (filter === c.id) + "'>" + esc(t(c.label)) + "</button>";
    }).join("");
  }

  function renderStations() {
    $("#stations").innerHTML = CATS.map(function (cat) {
      var works = WORKS.filter(function (w) { return w.cat === cat.id; });
      var cards = works.map(function (w, i) {
        var p = PATTERN[i % PATTERN.length], m = MPATTERN[i % MPATTERN.length], img = w.images[0];
        // keep small source photos from being blown up past their resolution
        var span = Math.min(p.s, img[1] < 400 ? 3 : img[1] < 600 ? 4 : 12);
        return "<a class='card reveal' href='#/work/" + w.id + "' data-work='" + w.id + "' style='--c:" + p.c + ";--s:" + span + ";--y:" + p.y + ";--mc:" + m.c + ";--ms:" + m.s + "'>" +
          "<div class='card-media'><img src='../assets/img/works/" + img[0] + "-sm.jpg' alt='" + esc(t(w.title)) + "' loading='lazy' width='" + img[1] + "' height='" + img[2] + "'></div>" +
          "<div class='card-cap'><span class='card-title'>" + esc(t(w.title)) + (w.sub ? "<em>" + esc(t(w.sub)) + "</em>" : "") + "</span><span class='card-year'>" + esc(w.year) + "</span></div></a>";
      }).join("");
      return "<section class='station' data-cat='" + cat.id + "'" + (filter !== "all" && filter !== cat.id ? " hidden" : "") + ">" +
        "<header class='station-head reveal'><span class='station-num'>" + cat.n + "</span><span class='station-label'><small>" + esc(t(UI.station)) + " " + cat.n + "</small><span>" + esc(t(cat.label)) + "</span></span></header>" +
        "<div class='station-grid'>" + cards + "</div></section>";
    }).join("");
  }

  function renderPoem() {
    $("#poem").innerHTML = t(UI.poem).split("\n").map(function (line, i) {
      var refrain = /^(Dans met mij|Dance with me|Danse avec moi)/.test(line) && i > 0;
      return "<span class='" + (refrain ? "refrain" : "") + "'>" + esc(line) + "</span>";
    }).join("");
    if (reduced) { $$("#poem span").forEach(function (s) { s.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -22% 0px" });
    $$("#poem span").forEach(function (s) { io.observe(s); });
  }

  function cvList(rows) {
    return "<ol>" + rows.map(function (r) {
      var p = r.p ? "<span class='cv-p'>" + esc(t(r.p)) + "</span>" : "";
      return "<li class='reveal'><span class='cv-y'>" + esc(r.y) + "</span><span class='cv-t'>" + esc(t(r.t)) + p + "</span></li>";
    }).join("") + "</ol>";
  }
  function renderCV() {
    $("#cvgrid").innerHTML =
      "<div class='cv-block'><h3>" + esc(t(UI.cvEducation)) + "</h3>" + cvList(CV.education) +
      "<h3>" + esc(t(UI.cvResearch)) + "</h3>" + cvList(CV.research) + "</div>" +
      "<div class='cv-block'><h3>" + esc(t(UI.cvExhibitions)) + "</h3>" + cvList(CV.exhibitions) +
      "<h3>" + esc(t(UI.cvProfessional)) + "</h3>" + cvList(CV.professional) + "</div>";
  }

  function renderContact() {
    var out = [];
    if (CONTACT.sample) { // placeholder details: shown as text only, so nobody is sent to an address she doesn't own
      if (CONTACT.email) out.push("<span class='sample'>" + esc(CONTACT.email) + "</span>");
      if (CONTACT.instagram) out.push("<span class='sample'>@" + esc(CONTACT.instagram) + "</span>");
    } else {
      if (CONTACT.email) out.push("<a href='mailto:" + esc(CONTACT.email) + "'>" + esc(CONTACT.email) + "</a>");
      if (CONTACT.instagram) out.push("<a href='https://instagram.com/" + esc(CONTACT.instagram) + "' target='_blank' rel='noopener'>Instagram ↗</a>");
    }
    if (!out.length) out.push("<span class='pending'>" + esc(t(UI.contactPending)) + "</span>");
    $("#contactlinks").innerHTML = out.join("");
    $("#contactloc").textContent = t(CONTACT.location);
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealIO = reduced ? null : new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  function observeReveals() {
    $$(".reveal:not(.in)").forEach(function (el) { if (revealIO) revealIO.observe(el); else el.classList.add("in"); });
  }

  /* ---------------- work room ---------------- */
  var current = null, lastFocus = null;
  var room = $("#room");

  function visibleWorks() { return WORKS.filter(function (w) { return filter === "all" || w.cat === filter; }); }

  function fillRoom(w) {
    var cat = CATS.filter(function (c) { return c.id === w.cat; })[0];
    $("#room-meta").textContent = t(UI.station) + " " + cat.n + " · " + t(cat.label);
    $("#room-title").textContent = t(w.title);
    $("#room-sub").textContent = t(w.sub);
    var spec = [];
    if (w.year) spec.push(["Year", w.year]);
    if (w.medium) spec.push([{ en: "Medium", nl: "Materiaal", fr: "Matériaux" }, t(w.medium)]);
    if (w.size) spec.push([{ en: "Size", nl: "Afmetingen", fr: "Dimensions" }, w.size]);
    $("#room-spec").innerHTML = spec.map(function (s) {
      var k = s[0] === "Year" ? t({ en: "Year", nl: "Jaar", fr: "Année" }) : t(s[0]);
      return "<dt>" + esc(k) + "</dt><dd>" + esc(s[1]) + "</dd>";
    }).join("");
    var text = "";
    if (w.lead) text += "<p class='lead'>" + esc(t(w.lead)) + "</p>";
    if (w.text) text += t(w.text).split("\n\n").map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    if (w.quote) text += "<p class='lead' style='font-size:22px'>“" + esc(t(UI.quote)) + "”</p>";
    if (w.poem) text += "<p class='poem-mini'>" + esc(t(UI.poem)) + "</p>";
    if (w.statement && window.LONGING) text += window.LONGING.map(function (f) { return "<p>" + esc(t(f)) + "</p>"; }).join("");
    if (w.credit) text += "<p style='opacity:.6;font-size:13px'>" + esc(t(w.credit)) + "</p>";
    $("#room-text").innerHTML = text;
    $("#room-images").innerHTML = (w.video ? "<figure><video src='../assets/video/" + w.video + ".mp4' poster='../assets/video/" + w.video + "-poster.jpg' autoplay muted loop playsinline style='max-height:88vh;max-width:100%;margin:0 auto;display:block'></video></figure>" : "") + w.images.map(function (img, i) {
      return "<figure><img src='../assets/img/works/" + img[0] + ".jpg' alt='" + esc(t(w.title)) + " — " + (i + 1) + "' width='" + img[1] + "' height='" + img[2] + "'" + (i ? " loading='lazy'" : "") + "></figure>";
    }).join("");
    var list = visibleWorks(), idx = list.indexOf(w);
    $("#room-count").textContent = (idx + 1) + " / " + list.length;
  }

  function openRoom(id, origin) {
    var w = WORKS.filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    if (!current) lastFocus = document.activeElement;
    current = w;
    cursor.classList.remove("is-work", "is-link");
    fillRoom(w);
    if (origin) { room.style.setProperty("--ox", origin.x + "px"); room.style.setProperty("--oy", origin.y + "px"); }
    room.hidden = false;
    room.classList.remove("open"); void room.offsetWidth; room.classList.add("open");
    $("#room-scroll").scrollTop = 0;
    document.body.classList.add("locked");
    $("#room-close").focus({ preventScroll: true });
    var h = "#/work/" + id;
    if (location.hash !== h) history.pushState(null, "", h);
  }

  function closeRoom(fromHash) {
    if (!current) return;
    current = null;
    room.hidden = true;
    document.body.classList.remove("locked");
    if (!fromHash) history.pushState(null, "", location.pathname + location.search + "#works");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function step(d) {
    var list = visibleWorks(), i = list.indexOf(current);
    if (i < 0) list = WORKS, i = WORKS.indexOf(current);
    openRoom(list[(i + d + list.length) % list.length].id);
  }

  function fromHash() {
    var m = location.hash.match(/^#\/work\/([\w-]+)/);
    if (m) openRoom(m[1]); else closeRoom(true);
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", function (e) {
    var l = e.target.closest("[data-lang]");
    if (l) { setLang(l.getAttribute("data-lang")); return; }
    var f = e.target.closest("[data-filter]");
    if (f) {
      filter = f.getAttribute("data-filter");
      renderFilters();
      $$(".station").forEach(function (s) { s.hidden = !(filter === "all" || filter === s.getAttribute("data-cat")); });
      return;
    }
    var c = e.target.closest("[data-work]");
    if (c) { e.preventDefault(); openRoom(c.getAttribute("data-work"), { x: e.clientX, y: e.clientY }); }
  });
  $("#room-close").addEventListener("click", function () { closeRoom(); });
  $("#room-prev").addEventListener("click", function () { step(-1); });
  $("#room-next").addEventListener("click", function () { step(1); });
  document.addEventListener("keydown", function (e) {
    if (!current) return;
    if (e.key === "Escape") closeRoom();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Tab") { // keep focus inside the room
      var f = $$("button, a[href]", room).filter(function (x) { return x.offsetParent; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.addEventListener("popstate", fromHash);

  /* ---------------- cursor ---------------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var cursor = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $(".cursor-label");
  var mouse = { x: innerWidth / 2, y: innerHeight / 2, seen: false }, ringPos = { x: mouse.x, y: mouse.y };
  window.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.seen = true;
    if (!fine) return;
    dot.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    var w = e.target.closest && e.target.closest("[data-work]");
    var a = e.target.closest && e.target.closest("a,button");
    cursor.classList.toggle("is-work", !!w);
    cursor.classList.toggle("is-link", !w && !!a);
    if (w) label.textContent = t(UI.view);
  }, { passive: true });
  if (fine && !reduced) {
    document.body.classList.add("has-cursor");
    (function loop() {
      ringPos.x += (mouse.x - ringPos.x) * 0.16; ringPos.y += (mouse.y - ringPos.y) * 0.16;
      ring.style.transform = "translate(" + ringPos.x + "px," + ringPos.y + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- magnetic field of iron filings ----------------
     Two poles: one follows the visitor, one is a slow-orbiting "black hole".
     Every filing turns toward the resulting field, like iron filings around
     the magnets in her brooches. */
  function Field(canvas, opts) {
    var ctx = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, pts = [], disc = [], running = false, visible = true, t0 = performance.now();
    var hand = { x: 0, y: 0, tx: 0, ty: 0 };
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gap = W < 700 ? 20 : opts.gap || 22;
      pts = [];
      for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) {
        pts.push({ x: x + (Math.random() - .5) * gap * .7, y: y + (Math.random() - .5) * gap * .7, a: Math.random() * Math.PI, l: 5 + Math.random() * 6 });
      }
      hand.x = hand.tx = W * opts.hx; hand.y = hand.ty = H * opts.hy;
      disc = [];
      var n = W < 700 ? 380 : 720;
      for (var k = 0; k < n; k++) {
        var u = Math.pow(Math.random(), 1.7); // denser toward the inner edge
        disc.push({ th: Math.random() * Math.PI * 2, r: 1.45 + u * 2.3, tr: .1 + Math.random() * .32, w: .35 + Math.random() * .9 });
      }
    }

    /* The black hole, drawn the way it would look to an eye nearby:
       a black shadow, a thin photon ring, a tilted accretion disc that crosses
       in front of it, and the far side of the disc bent up over the top by
       its gravity. Brighter on the side turning toward us, hotter toward the centre. */
    var TILT = .2, ROT = -.16;
    function discColor(rr, th, a) {
      var k = Math.min(1, (rr - 1.45) / 2.3);
      var dop = .45 + .55 * (0.5 + 0.5 * Math.cos(th + 0.4)); // the approaching side burns brighter
      var R = Math.round(255 + (226 - 255) * k), G = Math.round(238 + (84 - 238) * k), B = Math.round(214 + (40 - 214) * k);
      return "rgba(" + R + "," + G + "," + B + "," + (a * dop * (1 - k * .55)).toFixed(3) + ")";
    }
    // soft continuous bands under the streaks, so the disc reads as glowing gas rather than dashes
    function band(R, from, to, lensed, alpha) {
      var lg = ctx.createLinearGradient(-R * 3.8, 0, R * 3.8, 0);
      lg.addColorStop(0, "rgba(255,236,210," + alpha + ")");
      lg.addColorStop(.45, "rgba(250,170,110," + alpha * .8 + ")");
      lg.addColorStop(1, "rgba(200,70,30," + alpha * .45 + ")");
      ctx.strokeStyle = lg;
      for (var k = 0; k < 16; k++) {
        var f = k / 15, w = R * .16;
        ctx.lineWidth = w;
        ctx.globalAlpha = (1 - f) * (1 - f) * .9 + .1;
        ctx.beginPath();
        if (lensed) ctx.arc(0, 0, R * (1.1 + f * .55), from, to);
        else { var rr = R * (1.5 + f * 2.2); ctx.ellipse(0, 0, rr, rr * TILT, 0, from, to); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function drawHole(b, time) {
      var R = opts.holeR, spin = time * 0.00042 * opts.speed;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(ROT);
      // warm haze
      var g = ctx.createRadialGradient(0, 0, R * .9, 0, 0, R * 5.5);
      g.addColorStop(0, "rgba(226,110,50,.20)"); g.addColorStop(.35, "rgba(160,60,30,.07)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      var i, p, th, rr, a0, a1;
      band(R, Math.PI, Math.PI * 2, false, .05);
      band(R, Math.PI * 1.02, Math.PI * 1.98, true, .09);
      // 1. far half of the disc (behind the shadow)
      for (i = 0; i < disc.length; i++) {
        p = disc[i]; th = p.th + spin * Math.pow(1.45 / p.r, 1.5) * 3; rr = p.r * R;
        if (Math.sin(th) >= 0) continue;
        a0 = th - p.tr; ctx.strokeStyle = discColor(p.r, th, .55); ctx.lineWidth = p.w;
        ctx.beginPath(); ctx.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr * TILT); ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * TILT); ctx.stroke();
      }
      // 2. the far side again, lensed up and over the top of the shadow
      for (i = 0; i < disc.length; i++) {
        p = disc[i]; th = p.th + spin * Math.pow(1.45 / p.r, 1.5) * 3;
        var sn = Math.sin(th); if (sn >= 0) continue;
        rr = R * (1.08 + (p.r - 1.45) * .26);
        // squeeze the angle toward the top so the arch hugs the shadow
        a1 = Math.PI + ((th % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI);
        a0 = a1 - p.tr * 1.4;
        ctx.strokeStyle = discColor(p.r, th, .7); ctx.lineWidth = p.w * .9;
        ctx.beginPath(); ctx.arc(0, 0, rr, a0, a1); ctx.stroke();
      }
      // 3. faint secondary image under the shadow
      for (i = 0; i < disc.length; i += 3) {
        p = disc[i]; th = p.th + spin * Math.pow(1.45 / p.r, 1.5) * 3;
        if (Math.sin(th) < 0) continue;
        rr = R * (1.04 + (p.r - 1.45) * .07);
        ctx.strokeStyle = discColor(p.r, th, .35); ctx.lineWidth = .7;
        ctx.beginPath(); ctx.arc(0, 0, rr, th - p.tr, th); ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      // 4. the shadow itself
      var sg = ctx.createRadialGradient(0, 0, R * .7, 0, 0, R * 1.02);
      sg.addColorStop(0, "#000"); sg.addColorStop(1, "#050303");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      // 5. photon ring
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = "rgba(255,200,150,.9)"; ctx.shadowBlur = 12;
      ctx.strokeStyle = "rgba(255,232,205,.75)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.025, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      // 6. near half of the disc, crossing in front of the shadow
      band(R, 0, Math.PI, false, .07);
      for (i = 0; i < disc.length; i++) {
        p = disc[i]; th = p.th + spin * Math.pow(1.45 / p.r, 1.5) * 3; rr = p.r * R;
        if (Math.sin(th) < 0) continue;
        a0 = th - p.tr; ctx.strokeStyle = discColor(p.r, th, .9); ctx.lineWidth = p.w * 1.15;
        ctx.beginPath(); ctx.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr * TILT); ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr * TILT); ctx.stroke();
      }
      ctx.restore();
    }
    function hole(time) {
      var s = time * 0.00007 * opts.speed;
      return { x: W * opts.bx + Math.cos(s) * W * .06, y: H * opts.by + Math.sin(s * 1.3) * H * .06 };
    }
    function draw(now) {
      var r = canvas.getBoundingClientRect();
      if (mouse.seen && mouse.y > r.top && mouse.y < r.bottom) { hand.tx = mouse.x - r.left; hand.ty = mouse.y - r.top; }
      else { var s = (now - t0) * 0.0002; hand.tx = W * opts.hx + Math.cos(s) * W * .14; hand.ty = H * opts.hy + Math.sin(s * 1.7) * H * .16; }
      hand.x += (hand.tx - hand.x) * 0.07; hand.y += (hand.ty - hand.y) * 0.07;
      var b = hole(now - t0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      var signal = opts.signal;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var dx1 = p.x - hand.x, dy1 = p.y - hand.y, d1 = dx1 * dx1 + dy1 * dy1 + 400, r1 = Math.sqrt(d1);
        var dx2 = p.x - b.x, dy2 = p.y - b.y, d2 = dx2 * dx2 + dy2 * dy2 + 400, r2 = Math.sqrt(d2);
        // + pole at the hand, − pole at the black hole (stronger)
        // plus a tangential pull, so filings spiral into the hole instead of pointing straight at it
        var fx = dx1 / (d1 * r1) - 1.6 * dx2 / (d2 * r2) + 1.1 * dy2 / (d2 * r2);
        var fy = dy1 / (d1 * r1) - 1.6 * dy2 / (d2 * r2) - 1.1 * dx2 / (d2 * r2);
        var target = Math.atan2(fy, fx);
        var diff = target - p.a;
        diff = ((diff + Math.PI / 2) % Math.PI + Math.PI) % Math.PI - Math.PI / 2; // filings have no head or tail
        p.a += diff * 0.12;
        var mag = Math.sqrt(fx * fx + fy * fy) * 9e4;
        var alpha = Math.min(.85, .1 + mag * .5);
        var R0 = opts.holeR;
        if (r2 < R0 * 1.9) continue; // swallowed by the disc
        alpha *= Math.min(1, (r2 - R0 * 1.9) / (R0 * 1.6));
        var near = Math.max(0, 1 - r1 / 160);
        ctx.strokeStyle = near > 0.02 ? "rgba(" + Math.round(239 + (226 - 239) * near) + "," + Math.round(231 + (72 - 231) * near) + "," + Math.round(221 + (31 - 221) * near) + "," + Math.min(1, alpha + near * .5) + ")" : "rgba(239,231,221," + alpha + ")";
        ctx.lineWidth = .8 + near * .9;
        var c = Math.cos(p.a) * p.l * .5, s = Math.sin(p.a) * p.l * .5;
        ctx.beginPath(); ctx.moveTo(p.x - c, p.y - s); ctx.lineTo(p.x + c, p.y + s); ctx.stroke();
      }
      drawHole(b, now - t0);
      // the hand's pole
      ctx.beginPath(); ctx.arc(hand.x, hand.y, 3, 0, Math.PI * 2); ctx.fillStyle = signal; ctx.fill();
    }
    function loop(now) { if (!running) return; draw(now); requestAnimationFrame(loop); }
    function start() { if (running || reduced) return; running = true; requestAnimationFrame(loop); }
    function stop() { running = false; }
    size();
    if (reduced) { for (var k = 0; k < 60; k++) draw(performance.now()); }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
    var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(function () { size(); if (reduced) draw(performance.now()); }, 150); });
  }

  /* ---------------- boot ---------------- */
  document.documentElement.lang = lang;
  $("#year").textContent = new Date().getFullYear();
  render();
  var mobile = innerWidth < 700;
  /* ---- étude 7: zoom in, through the wormhole, zoom out ----
     A: a small black circle; the scroll zooms into it until it is the whole screen.
     B: inside, a tunnel of circles. Her works float along it; each one comes
        closer, fills the view and is passed through. The far end bends toward the mouse.
     C: at the end a white circle opens (the other mouth); the scroll zooms back out
        until the whole journey is one small black circle again. */
  var stage7 = $("#stage7"), track7 = $("#track7"), cv7 = $("#tunnel7"), ctx = cv7.getContext("2d");
  var portal = $("#portal7"), lab7 = $("#label7"), intro7 = $("#intro7"), outro7 = $("#outro7"), hint7 = $(".hint7");
  var mobile7 = innerWidth < 700;
  var A1 = .1, B1 = .88;
  var NEAR = 1.2, SP = 12, Z0 = 9, FAR = 80;
  var LIST = WORKS.slice(), ZEND = Z0 + LIST.length * SP + 2;
  var IMGS = LIST.map(function (w) { var im = new Image(); im.src = "../assets/img/works/" + w.images[0][0] + "-sm.jpg"; return im; });
  var dpr7 = Math.min(window.devicePixelRatio || 1, 2), W7, H7, CX, CY, RS, R0, F7;
  function size7() {
    W7 = innerWidth; H7 = stage7.clientHeight || innerHeight;
    cv7.width = Math.round(W7 * dpr7); cv7.height = Math.round(H7 * dpr7);
    CX = W7 / 2; CY = H7 / 2; RS = Math.hypot(W7, H7) / 2;
    R0 = Math.min(W7, H7) * (W7 < 700 ? .17 : .11); F7 = RS * NEAR;
  }
  size7(); window.addEventListener("resize", size7);

  var PAPER = "239,235,228", INK = "20,18,17";
  var p7 = 0, bx = 0, by = 0;
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function onScroll7() {
    var r = track7.getBoundingClientRect(), span = r.height - innerHeight;
    p7 = span > 0 ? clamp(-r.top / span) : 0;
  }
  window.addEventListener("scroll", onScroll7, { passive: true });
  onScroll7();

  // where the ring at depth dz sits on screen (relative to the centre), before scaling
  function proj(dz) { var k = 1 - NEAR / Math.max(dz, NEAR); return { x: bx * k, y: by * k, r: F7 / dz }; }

  // the tunnel seen from camera depth zc, drawn at scale s around (ox, oy)
  function tunnel(zc, s, ox, oy, now) {
    ctx.fillStyle = "rgb(" + INK + ")";
    ctx.fillRect(0, 0, W7, H7);
    var i, dz, q, a;
    // rings
    ctx.lineWidth = 1;
    for (i = Math.ceil(zc + NEAR * .9); i < zc + FAR; i++) {
      dz = i - zc; q = proj(dz);
      a = clamp((dz - NEAR * .9) / 1.5) * Math.pow(1 - dz / FAR, 1.6) * .75;
      if (a <= .01) continue;
      ctx.strokeStyle = "rgba(" + PAPER + "," + a.toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(ox + q.x * s, oy + q.y * s, q.r * s, 0, 6.2832); ctx.stroke();
    }
    // straight lines running down the throat, slowly twisting with depth
    var N = 12, step = 1.5;
    for (var k = 0; k < N; k++) {
      ctx.beginPath();
      for (dz = NEAR; dz < FAR * .7; dz += step) {
        q = proj(dz); var th = k * 6.2832 / N + (zc + dz) * .035 + now * .00004;
        var x = ox + (q.x + Math.cos(th) * q.r) * s, y = oy + (q.y + Math.sin(th) * q.r) * s;
        dz === NEAR ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(" + PAPER + ",.13)"; ctx.stroke();
    }
    // the other mouth: a white circle at the end
    dz = ZEND - zc;
    if (dz < FAR) {
      q = proj(Math.max(dz, .05));
      ctx.fillStyle = "rgba(" + PAPER + "," + clamp((FAR - dz) / 30).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(ox + q.x * s, oy + q.y * s, q.r * .9 * s, 0, 6.2832); ctx.fill();
    }
    // the works, far ones first
    var cur = null;
    for (var j = LIST.length - 1; j >= 0; j--) {
      dz = Z0 + j * SP - zc;
      if (dz < NEAR * .55 || dz > FAR * .8) continue;
      q = proj(dz);
      var rw = q.r * .56 * s, cx = ox + q.x * s, cy = oy + q.y * s;
      a = clamp((FAR * .8 - dz) / 25) * clamp((dz - NEAR * .55) / (NEAR * .9));
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(cx, cy, rw, 0, 6.2832); ctx.clip();
      var im = IMGS[j];
      if (im.complete && im.naturalWidth) {
        var sc = Math.max(2 * rw / im.naturalWidth, 2 * rw / im.naturalHeight);
        ctx.drawImage(im, cx - im.naturalWidth * sc / 2, cy - im.naturalHeight * sc / 2, im.naturalWidth * sc, im.naturalHeight * sc);
      } else { ctx.fillStyle = "rgb(" + PAPER + ")"; ctx.fill(); }
      ctx.restore();
      ctx.strokeStyle = "rgba(" + PAPER + "," + (a * .9).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(cx, cy, rw + 6 * Math.min(1, s * 3), 0, 6.2832); ctx.stroke();
      if (dz > NEAR * 1.1 && dz < SP * .95) cur = { j: j, x: cx, y: cy, r: rw, a: a };
    }
    return cur;
  }

  // ink circles on paper around a disc of radius rd (used for the zoom in and the zoom out)
  function halo(rd, alpha) {
    ctx.lineWidth = 1;
    for (var k = 1; k < 9; k++) {
      var r = rd * Math.pow(1.5, k);
      if (r > RS * 1.2) break;
      ctx.strokeStyle = "rgba(" + INK + "," + (alpha * (k === 1 ? .8 : .35 / k * 2)).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(CX, CY, r, 0, 6.2832); ctx.stroke();
    }
    // one diagonal through the centre
    ctx.strokeStyle = "rgba(" + INK + "," + (alpha * .35).toFixed(3) + ")";
    var d = Math.min(RS, rd * 7);
    ctx.beginPath(); ctx.moveTo(CX - d * .7071, CY + d * .7071); ctx.lineTo(CX + d * .7071, CY - d * .7071); ctx.stroke();
  }

  var shownKey = "", lastCur = null;
  function showLabel(cur) {
    var key = cur ? cur.j + lang : "";
    if (key !== shownKey) {
      shownKey = key;
      if (cur) {
        var w = LIST[cur.j];
        lab7.innerHTML = "<span class='n7'>" + String(cur.j + 1).padStart(2, "0") + " / " + LIST.length + "</span><b>" + esc(t(w.title)) + "</b>" + (w.year ? "<span>" + w.year + "</span>" : "");
        portal.setAttribute("href", "#/work/" + w.id); portal.setAttribute("data-work", w.id); portal.setAttribute("aria-label", t(w.title));
      }
      lab7.classList.toggle("on", !!cur);
    }
    if (cur && cur.r > 40 && cur.a > .6) {
      portal.hidden = false;
      portal.style.transform = "translate(" + (cur.x - cur.r).toFixed(1) + "px," + (cur.y - cur.r).toFixed(1) + "px)";
      portal.style.width = portal.style.height = (2 * cur.r).toFixed(1) + "px";
    } else portal.hidden = true;
  }

  function renderOutro() {
    var f = (window.LONGING || [])[5];
    if (f) outro7.innerHTML = "<p>" + esc(t(f)) + "</p><p class='fa7' lang='fa' dir='rtl'>" + esc(f.fa) + "</p>";
  }
  renderOutro();
  var baseSetLang7 = setLang;
  setLang = function (l) { baseSetLang7(l); renderOutro(); shownKey = ""; };

  (function frame7(now) {
    requestAnimationFrame(frame7);
    var r = track7.getBoundingClientRect();
    if (r.bottom < 0) { portal.hidden = true; return; }
    // the far end of the tunnel leans toward the visitor's hand
    var tx, ty;
    if (mouse.seen && !reduced) { tx = (mouse.x - CX) * .55; ty = (mouse.y - CY) * .55; }
    else if (!reduced) { tx = Math.sin(now * .00023) * W7 * .12; ty = Math.cos(now * .00017) * H7 * .08; }
    else { tx = ty = 0; }
    bx += (tx - bx) * .05; by += (ty - by) * .05;

    ctx.setTransform(dpr7, 0, 0, dpr7, 0, 0);
    var cur = null, u;
    if (p7 < A1) {
      // A: zoom in
      u = p7 / A1;
      var K = RS * 1.04 / R0, rd = R0 * Math.pow(K, u * u * (3 - 2 * u));
      ctx.fillStyle = "rgb(" + PAPER + ")"; ctx.fillRect(0, 0, W7, H7);
      halo(rd, 1 - u * .6);
      ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, rd, 0, 6.2832); ctx.clip();
      tunnel(0, rd / RS, CX, CY, now);
      ctx.restore();
      intro7.style.opacity = Math.max(0, 1 - u * 3);
      hint7.style.opacity = Math.max(0, 1 - u * 6);
      stage7.classList.toggle("dark", u > .55);
    } else if (p7 < B1) {
      // B: through the tunnel
      u = (p7 - A1) / (B1 - A1);
      cur = tunnel(u * (ZEND - NEAR * .8), 1, CX, CY, now);
      intro7.style.opacity = hint7.style.opacity = 0;
      stage7.classList.add("dark");
    } else {
      // C: out of the white mouth, zoom out back to one small circle
      u = (p7 - B1) / (1 - B1);
      var e = u * u * (3 - 2 * u), Kc = RS * 3 / R0, rc = R0 * Math.pow(Kc, 1 - e);
      ctx.fillStyle = "rgb(" + PAPER + ")"; ctx.fillRect(0, 0, W7, H7);
      halo(rc, clamp(u * 3));
      ctx.strokeStyle = "rgba(" + INK + "," + clamp(u * 3).toFixed(3) + ")";
      ctx.beginPath(); ctx.arc(CX, CY, rc, 0, 6.2832); ctx.stroke();
      var pupil = rc * clamp((u - .35) / .55);              // the black returns from the centre, like a pupil
      ctx.fillStyle = "rgb(" + INK + ")";
      ctx.beginPath(); ctx.arc(CX, CY, pupil, 0, 6.2832); ctx.fill();
      intro7.style.opacity = hint7.style.opacity = 0;
      stage7.classList.remove("dark");
    }
    outro7.style.opacity = p7 >= B1 ? clamp(((p7 - B1) / (1 - B1) - .6) / .3) : 0;
    showLabel(cur);
  })(0);
  fromHash();
})();
