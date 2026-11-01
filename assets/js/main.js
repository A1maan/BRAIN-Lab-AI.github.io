/* ==========================================================================
   BRAIN Lab — shared site script (no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  $$(".theme-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("brainlab-theme", next); } catch (e) {}
      document.dispatchEvent(new CustomEvent("themechange"));
    })
  );

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  const links = $(".nav__links");
  if (menuBtn && links) {
    menuBtn.addEventListener("click", () => {
      const open = links.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Header state, scroll progress, back-to-top ---------- */
  const header = $(".site-header");
  const toTop = $(".to-top");
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      header.style.setProperty("--progress", max > 0 ? (y / max).toFixed(4) : 0);
    }
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- Image fallbacks (missing photos / figures) ---------- */
  function initials(name) {
    return (name || "?").replace(/^(Prof\.|Dr\.)\s*/g, "").replace(/^(Prof\.|Dr\.)\s*/g, "")
      .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }
  function handleBrokenImage(img) {
    if (img.dataset.fallbackDone) return;
    img.dataset.fallbackDone = "1";
    const media = img.closest(".media");
    if (media) { media.classList.add("is-missing"); img.remove(); return; }
    const brand = img.closest(".brand");
    if (brand) { img.remove(); brand.querySelector(".brand__text")?.removeAttribute("hidden"); return; }
    if (img.closest(".member__photo") || img.closest(".director")) {
      const div = document.createElement("div");
      div.className = "avatar-fallback";
      div.setAttribute("role", "img");
      div.setAttribute("aria-label", img.alt || "Member");
      div.textContent = initials(img.alt);
      img.replaceWith(div);
      return;
    }
    if (img.classList.contains("slide")) {
      const div = document.createElement("div");
      div.className = img.className + " slide--missing";
      div.textContent = "add photo: " + img.getAttribute("src");
      img.replaceWith(div);
      return;
    }
    if (img.closest(".photo-frame")) { img.style.visibility = "hidden"; }
  }
  document.addEventListener("error", (e) => { if (e.target && e.target.tagName === "IMG") handleBrokenImage(e.target); }, true);
  $$("img").forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) handleBrokenImage(img); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Typing terminal ---------- */
  $$("[data-type]").forEach((el) => {
    const phrases = JSON.parse(el.dataset.type);
    if (reduceMotion) { el.textContent = phrases[0]; return; }
    let i = 0, j = 0, del = false;
    const loop = () => {
      const word = phrases[i];
      el.textContent = word.slice(0, j);
      if (!del && j < word.length) { j++; setTimeout(loop, 42 + Math.random() * 40); }
      else if (!del) { del = true; setTimeout(loop, 1700); }
      else if (j > 0) { j--; setTimeout(loop, 18); }
      else { del = false; i = (i + 1) % phrases.length; setTimeout(loop, 300); }
    };
    loop();
  });

  /* ---------- Cursor spotlight on small cards ---------- */
  if (finePointer) {
    $$(".area").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ---------- 3D tilt member cards ---------- */
  const tiltCards = $$(".tilt");
  if (tiltCards.length) {
    if (finePointer && !reduceMotion) {
      tiltCards.forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          el.style.setProperty("--ry", ((px - 0.5) * 16).toFixed(2) + "deg");
          el.style.setProperty("--rx", ((0.5 - py) * 12).toFixed(2) + "deg");
          el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
          el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        });
        el.addEventListener("pointerleave", () => {
          el.style.setProperty("--rx", "0deg");
          el.style.setProperty("--ry", "0deg");
        });
      });
    } else {
      // Touch devices: tap a card to "lift" it
      tiltCards.forEach((el) =>
        el.addEventListener("click", (e) => {
          if (e.target.closest("a")) return;
          const wasActive = el.classList.contains("is-active");
          tiltCards.forEach((c) => c.classList.remove("is-active"));
          if (!wasActive) el.classList.add("is-active");
        })
      );
    }
  }

  /* ---------- Generic filter (chips + optional search) ---------- */
  // Markup: <div data-filter-group="key"> chips with data-filter="value" ; items have data-cat="a b"
  $$("[data-filter-scope]").forEach((scope) => {
    const chips = $$("[data-filter]", scope);
    const search = $("[data-search]", scope);
    const items = $$("[data-cat]", scope);
    const groups = $$("[data-group]", scope);
    const empty = $(".empty", scope);
    const counter = $("[data-visible-count]", scope);
    let active = "all", query = "";

    // count badges on chips
    chips.forEach((c) => {
      const n = c.querySelector(".n");
      if (!n) return;
      const v = c.dataset.filter;
      n.textContent = v === "all" ? items.length : items.filter((it) => it.dataset.cat.split(" ").includes(v)).length;
    });

    function apply() {
      let visible = 0;
      items.forEach((it) => {
        const catOK = active === "all" || it.dataset.cat.split(" ").includes(active);
        const txtOK = !query || it.textContent.toLowerCase().includes(query);
        const show = catOK && txtOK;
        it.hidden = !show;
        if (show) visible++;
      });
      groups.forEach((g) => {
        const vis = $$("[data-cat]", g).filter((it) => !it.hidden).length;
        g.hidden = vis === 0;
        const cnt = $(".count", g);
        if (cnt) cnt.textContent = String(vis).padStart(2, "0");
      });
      if (empty) empty.classList.toggle("is-visible", visible === 0);
      if (counter) counter.textContent = visible;
    }
    chips.forEach((c) =>
      c.addEventListener("click", () => {
        chips.forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
        c.classList.add("is-active");
        c.setAttribute("aria-pressed", "true");
        active = c.dataset.filter;
        apply();
      })
    );
    if (search) search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); apply(); });
    apply();
  });

  /* ---------- Copy BibTeX ---------- */
  $$(".copy-btn").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const pre = btn.parentElement.querySelector("pre");
      const text = pre ? pre.innerText : "";
      try { await navigator.clipboard.writeText(text); }
      catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (_) {}
        ta.remove();
      }
      btn.textContent = "Copied ✓"; btn.classList.add("is-done");
      setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("is-done"); }, 1600);
    })
  );

  /* ---------- Group photo slideshow ---------- */
  $$(".slideshow").forEach((show) => {
    const interval = parseInt(show.dataset.interval, 10) || 3000;
    show.style.setProperty("--interval", interval + "ms");
    const inner = $(".photo-frame__inner", show);
    const dotsWrap = $(".slide-dots", show);
    const bar = $(".slide-progress span", show);
    const num = $("[data-slide-num]", show);
    const slides = () => $$(".slide", inner); // re-query: missing images get swapped for placeholders
    let i = 0, timer = 0, paused = false;
    const n = slides().length;
    if (n < 2) { if (dotsWrap) dotsWrap.remove(); if (bar) bar.parentElement.remove(); return; }
    const dots = Array.from({ length: n }, (_, k) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-label", "Photo " + (k + 1));
      b.addEventListener("click", () => { go(k); restart(); });
      dotsWrap.appendChild(b);
      return b;
    });
    function go(k) {
      i = (k + n) % n;
      slides().forEach((s, j) => s.classList.toggle("is-active", j === i));
      dots.forEach((d, j) => d.setAttribute("aria-selected", String(j === i)));
      if (num) num.textContent = i + 1;
      if (bar) { bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run"); }
    }
    function restart() { clearInterval(timer); timer = setInterval(() => { if (!paused && !document.hidden) go(i + 1); }, interval); }
    show.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { paused = true; show.classList.add("is-paused"); } });
    show.addEventListener("pointerleave", () => { paused = false; show.classList.remove("is-paused"); });
    // swipe on phones
    let x0 = null;
    inner.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    inner.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); }
    });
    // preload the other photos so transitions are smooth
    slides().forEach((s) => { if (s.tagName === "IMG") s.loading = "eager"; });
    go(0); restart();
  });

  /* ---------- Neural-network hero canvas ---------- */
  const canvas = $("#neural");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, nodes = [], raf = 0, visible = true;
    const mouse = { x: -9999, y: -9999 };
    let col = {};
    const readColors = () => {
      const s = getComputedStyle(root);
      col = { a: s.getPropertyValue("--cyan").trim(), b: s.getPropertyValue("--gold").trim(), c: s.getPropertyValue("--violet").trim() };
    };
    readColors();
    document.addEventListener("themechange", () => { readColors(); if (reduceMotion) draw(); });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(28, Math.min(120, Math.round((w * h) / 13000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.6 + 0.8,
        k: Math.random() < 0.12 ? "b" : Math.random() < 0.25 ? "c" : "a",
        p: Math.random() * Math.PI * 2,
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const D = Math.min(150, Math.max(100, w / 10));
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < D) {
            ctx.globalAlpha = (1 - d / D) * 0.35;
            ctx.strokeStyle = col.a;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // links to cursor
        const mdx = a.x - mouse.x, mdy = a.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 180) {
          ctx.globalAlpha = (1 - md / 180) * 0.6;
          ctx.strokeStyle = col.b;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (const n of nodes) {
        const pulse = 0.6 + 0.4 * Math.sin(n.p);
        ctx.globalAlpha = 0.9 * pulse;
        ctx.fillStyle = col[n.k];
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + (n.k === "b" ? 1 : 0), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function step() {
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy; n.p += 0.03;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 32000) { n.x += dx * 0.002; n.y += dy * 0.002; }
      }
      draw();
      if (visible && !document.hidden) raf = requestAnimationFrame(step);
    }
    const start = () => { cancelAnimationFrame(raf); if (!reduceMotion) raf = requestAnimationFrame(step); };
    resize();
    if (reduceMotion) draw(); else start();

    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); reduceMotion ? draw() : start(); }, 150); });
    const host = canvas.parentElement;
    host.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) start(); });
  }
})();
