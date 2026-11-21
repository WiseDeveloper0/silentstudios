/* ==========================================================
   SilentStudios — interactive effects
   Particle sculpture, envelope scroll scene, kinetic type,
   3D card tilt, velocity marquee, custom cursor, footer type.
   Everything is skipped for visitors who prefer reduced motion.
   ========================================================== */

(window.SS_CONTENT_READY || Promise.resolve()).then(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
  const onScreen = (el, cb) => new IntersectionObserver(([e]) => cb(e.isIntersecting)).observe(el);

  /* ---------- Scroll progress bar ---------- */
  if ($(".hero")) {
    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
  }

  /* ---------- Hero particle sculpture ---------- */
  (() => {
    const hero = $(".hero");
    const canvas = $(".hero-particles");
    if (!hero || !canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    const caption = $(".hero-shape-caption");

    // 24×24 outline icons the particles morph between
    const SHAPES = [
      { label: "✉ Letters", d: "M3 6.5h18v11H3Z M3 7l9 6.5L21 7" },
      { label: "💬 Chats", d: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 4v-4A2 2 0 0 1 4 14Z M8 10h.01M12 10h.01M16 10h.01" },
      { label: "♡ Made with care", d: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" },
      { label: "⬡ Kraylus", d: "M12 3 20 7.5v9L12 21l-8-4.5v-9Z M12 3v18M4 7.5l16 9M20 7.5l-16 9" },
      { label: "✦ Delight", d: "M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2Z" },
    ];
    const N = innerWidth < 820 ? 520 : 1100;
    const S = 240;
    const off = document.createElement("canvas");
    off.width = off.height = S;
    const octx = off.getContext("2d", { willReadFrequently: true });
    const sample = (d) => {
      octx.clearRect(0, 0, S, S);
      octx.save();
      octx.scale(S / 24, S / 24);
      octx.lineWidth = 1.5;
      octx.lineJoin = octx.lineCap = "round";
      octx.strokeStyle = "#fff";
      octx.stroke(new Path2D(d));
      octx.restore();
      const data = octx.getImageData(0, 0, S, S).data;
      const pts = [];
      for (let y = 0; y < S; y += 2)
        for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 128) pts.push([x / S - 0.5, y / S - 0.5]);
      for (let i = pts.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pts[i], pts[j]] = [pts[j], pts[i]];
      }
      return Array.from({ length: N }, (_, i) => pts[i % pts.length]);
    };
    const targets = SHAPES.map((s) => sample(s.d));
    const colors = ["245,198,209", "168,236,240", "251,238,241", "236,159,178"];
    const P = Array.from({ length: N }, (_, i) => ({
      x: 0, y: 0, vx: 0, vy: 0,
      c: colors[i % colors.length],
      s: Math.random() * 1.6 + 1,
      ph: Math.random() * Math.PI * 2,
    }));

    let w, h, cx, cy, size, alpha;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = w >= 1000;
      // Phones/tablets: the sculpture gets its own space under the buttons (see .hero padding)
      cx = wide ? w * 0.78 : w * 0.5;
      cy = wide ? h * 0.4 : h - 190;
      size = wide ? Math.min(w * 0.28, h * 0.5, 420) : Math.min(w * 0.62, 250);
      alpha = 1;
      if (caption) {
        caption.style.left = `${cx}px`;
        caption.style.top = `${cy - size * 0.5 - (wide ? 52 : 40)}px`;
      }
    };
    resize();
    P.forEach((p) => { p.x = Math.random() * w; p.y = Math.random() * h; });
    addEventListener("resize", resize);

    let shape = 0, lastMorph = performance.now(), mx = -1e4, my = -1e4, visible = true;
    const ripples = [];
    const showCaption = () => {
      if (!caption) return;
      caption.classList.remove("show");
      void caption.offsetWidth;
      caption.textContent = SHAPES[shape].label;
      caption.classList.add("show");
    };
    const next = () => { shape = (shape + 1) % SHAPES.length; lastMorph = performance.now(); showCaption(); };
    showCaption();

    const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    hero.addEventListener("pointermove", (e) => { [mx, my] = local(e); });
    hero.addEventListener("pointerleave", () => { mx = my = -1e4; });
    // Touch: dragging a finger through the sculpture scatters it
    let touchTimer = 0;
    const touch = (e) => {
      const t0 = e.touches[0];
      if (!t0) return;
      [mx, my] = local(t0);
      clearTimeout(touchTimer);
    };
    hero.addEventListener("touchstart", touch, { passive: true });
    hero.addEventListener("touchmove", touch, { passive: true });
    hero.addEventListener("touchend", () => { touchTimer = setTimeout(() => (mx = my = -1e4), 250); }, { passive: true });
    // Tilting the phone sways the sculpture (where the browser allows it)
    let tilt = 0;
    addEventListener("deviceorientation", (e) => {
      if (e.gamma != null) tilt = clamp(e.gamma / 45, -1, 1) * 0.6;
    });
    hero.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      const [x, y] = local(e);
      P.forEach((p) => {
        const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) + 1;
        const f = Math.min(2600 / d, 42) * (0.5 + Math.random());
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      });
      ripples.push({ x, y, t: 0 });
      next();
    });
    onScreen(hero, (v) => (visible = v));

    const loop = (t) => {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (t - lastMorph > 5200) next();
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const tg = targets[shape];
      const rot = Math.sin(t * 0.0006) * 0.55 + tilt, cos = Math.cos(rot), sin = Math.sin(rot);
      for (let i = 0; i < N; i++) {
        const p = P[i], u = tg[i];
        const persp = 1 / (1 + u[0] * sin * 0.9);
        const tx = cx + u[0] * cos * size * persp + Math.sin(t * 0.002 + p.ph) * 2.2;
        const ty = cy + u[1] * size * persp + Math.cos(t * 0.0017 + p.ph) * 2.2;
        p.vx += (tx - p.x) * 0.012;
        p.vy += (ty - p.y) * 0.012;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 16900) {
          const d = Math.sqrt(d2) + 0.1, f = ((130 - d) / 130) * 3.4;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx *= 0.88; p.vy *= 0.88;
        p.x += p.vx; p.y += p.vy;
        const sp = Math.min(Math.hypot(p.vx, p.vy) / 6, 1);
        const s = p.s * persp * (1 + sp * 1.2);
        ctx.fillStyle = `rgba(${p.c},${(0.7 + 0.3 * sp) * alpha * (0.7 + 0.3 * persp)})`;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.t += 0.025;
        if (r.t >= 1) { ripples.splice(i, 1); continue; }
        ctx.strokeStyle = `rgba(168,236,240,${(1 - r.t) * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.t * 260, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };
    requestAnimationFrame(loop);
  })();

  /* ---------- Kinetic headline: letters jump on hover, heading tilts ---------- */
  (() => {
    const h1 = $(".hero h1");
    if (!h1 || reduce) return;
    h1.setAttribute("aria-label", h1.textContent.replace(/\s+/g, " ").trim());
    $$("[data-c]", h1).forEach((el) => {
      if (el.tagName === "EM") return; // keep the gradient word intact
      const words = el.textContent.split(/(\s+)/);
      el.textContent = "";
      words.forEach((wd) => {
        if (!wd.trim()) { el.appendChild(document.createTextNode(" ")); return; }
        const word = document.createElement("span");
        word.className = "wd";
        word.setAttribute("aria-hidden", "true");
        [...wd].forEach((ch) => {
          const c = document.createElement("span");
          c.className = "ch";
          c.textContent = ch;
          c.addEventListener("pointerenter", () => {
            c.classList.remove("pop");
            void c.offsetWidth;
            c.classList.add("pop");
          });
          word.appendChild(c);
        });
        el.appendChild(word);
      });
    });
    const chars = $$(".ch", h1);
    const pop = (c) => { c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); };
    const wave = () => chars.forEach((c, i) => setTimeout(() => pop(c), i * 45));
    setTimeout(wave, 1300);
    h1.addEventListener("click", wave);
    if (!fine) {
      let heroVisible = true;
      onScreen(h1, (v) => (heroVisible = v));
      setInterval(() => heroVisible && !document.hidden && wave(), 7000);
      return;
    }
    const hero = h1.closest(".hero");
    hero.addEventListener("pointermove", (e) => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      h1.style.transform = `perspective(1200px) rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`;
    });
    hero.addEventListener("pointerleave", () => (h1.style.transform = ""));
  })();

  /* ---------- Envelope scroll scene ---------- */
  (() => {
    const scene = $(".envelope-scene");
    if (!scene) return;
    const env = $(".envelope", scene);
    const text = $(".letter-text", scene);
    const words = [];
    if (text) {
      const parts = text.textContent.trim().split(/\s+/);
      text.textContent = "";
      parts.forEach((p, i) => {
        const s = document.createElement("span");
        s.className = "lw";
        s.textContent = p;
        text.appendChild(s);
        if (i < parts.length - 1) text.appendChild(document.createTextNode(" "));
        words.push(s);
      });
    }
    const set = (k, v) => scene.style.setProperty(`--${k}`, v.toFixed(3));
    if (reduce) {
      scene.classList.add("static");
      ["intro", "seal", "flap", "letter", "front", "write", "cta"].forEach((k) => set(k, 1));
      env.classList.add("flap-back", "letter-front");
      words.forEach((w) => w.classList.add("on"));
      return;
    }
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const update = () => {
      const r = scene.getBoundingClientRect();
      const total = scene.offsetHeight - innerHeight;
      if (r.bottom < -100 || r.top > innerHeight + 100) return;
      const p = clamp(-r.top / total);
      const v = {
        intro: seg(p, 0, 0.12),
        seal: seg(p, 0.12, 0.26),
        flap: seg(p, 0.26, 0.42),
        letter: seg(p, 0.42, 0.6),
        front: seg(p, 0.6, 0.74),
        write: seg(p, 0.64, 0.9),
        cta: seg(p, 0.88, 0.97),
      };
      Object.entries(v).forEach(([k, val]) => set(k, val));
      env.classList.toggle("flap-back", v.flap > 0.5);
      env.classList.toggle("letter-front", v.front > 0.02);
      scene.classList.toggle("cta-on", v.cta > 0.5);
      const n = Math.ceil(v.write * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
  })();

  /* ---------- 3D tilt on cards ---------- */
  const TILT = ".product, .value, .group, .feature, .extra, .style-card";
  if (fine && !reduce) {
    $$(TILT).forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.classList.add("tilting");
        card.style.transform = `perspective(1000px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-4px)`;
        card.style.setProperty("--px", `${x * 14}px`);
        card.style.setProperty("--py", `${y * 14}px`);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("tilting");
        card.style.transform = "";
        card.style.setProperty("--px", "0px");
        card.style.setProperty("--py", "0px");
      });
    });
  }

  // Touch screens: cards swing gently in 3D as they scroll past
  if (!fine && !reduce) {
    const cards = $$(TILT);
    let ticking = false;
    const swing = () => {
      ticking = false;
      const mid = innerHeight / 2;
      cards.forEach((card) => {
        if (card.classList.contains("reveal") && !card.classList.contains("in")) return;
        const r = card.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const k = clamp((r.top + r.height / 2 - mid) / innerHeight, -1, 1);
        card.style.transform = `perspective(900px) rotateX(${k * -10}deg) scale(${1 - Math.abs(k) * 0.05})`;
      });
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(swing); } }, { passive: true });
    setTimeout(swing, 1200);
  }

  /* Tap ripple on touch screens */
  if (!fine && !reduce) {
    addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      const r = document.createElement("span");
      r.className = "tap-ripple";
      r.style.left = `${e.clientX}px`;
      r.style.top = `${e.clientY}px`;
      document.body.appendChild(r);
      r.addEventListener("animationend", () => r.remove());
    }, { passive: true });
  }

  /* Whole product card is clickable */
  $$(".product").forEach((card) => {
    const link = $("a[href]", card);
    if (!link) return;
    card.classList.add("clickable");
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      location.href = link.href;
    });
  });

  /* ---------- Marquee that reacts to scroll speed ---------- */
  (() => {
    const track = $(".marquee-track");
    if (!track || reduce) return;
    track.style.animation = "none";
    let x = 0, last = scrollY, vel = 0, dir = 1, visible = true;
    onScreen(track, (v) => (visible = v));
    const loop = () => {
      requestAnimationFrame(loop);
      const dy = scrollY - last;
      last = scrollY;
      vel += (dy - vel) * 0.12;
      if (Math.abs(vel) > 0.6) dir = vel > 0 ? 1 : -1;
      if (!visible) return;
      const half = track.scrollWidth / 2 || 1;
      x -= (0.7 + Math.min(Math.abs(vel) * 0.6, 28)) * dir;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${clamp(-vel * 0.5, -12, 12)}deg)`;
    };
    loop();
  })();

  /* ---------- Custom cursor ring ---------- */
  if (fine && !reduce) {
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    ring.appendChild(label);
    document.body.appendChild(ring);
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      const t = e.target;
      const typing = t.closest("input, textarea, select");
      const product = t.closest(".product");
      const link = t.closest("a, button, summary, .chip, .choice");
      ring.classList.toggle("hide", !!typing);
      ring.classList.toggle("view", !!product && !link);
      ring.classList.toggle("hover", !!link);
      label.textContent = product && !link ? "Explore" : "";
    }, { passive: true });
    document.addEventListener("pointerleave", () => ring.classList.add("hide"));
    document.addEventListener("pointerenter", () => ring.classList.remove("hide"));
    addEventListener("pointerdown", () => ring.classList.add("down"));
    addEventListener("pointerup", () => ring.classList.remove("down"));
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      ring.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Footer wordmark reacts to the cursor ---------- */
  (() => {
    const fw = $(".footer-word");
    if (!fw || reduce) return;
    const letters = [...fw.textContent];
    fw.textContent = "";
    fw.classList.add("split");
    const spans = letters.map((c) => {
      const s = document.createElement("span");
      s.textContent = c;
      fw.appendChild(s);
      return s;
    });
    let visible = false, raf = 0, waved = false;
    const wave = () => spans.forEach((s, i) => {
      s.classList.remove("wave"); void s.offsetWidth;
      s.style.animationDelay = `${i * 60}ms`;
      s.classList.add("wave");
    });
    onScreen(fw, (v) => { visible = v; if (v && !waved) { waved = true; wave(); } });
    fw.addEventListener("click", wave);
    if (!fine) return;
    addEventListener("pointermove", (e) => {
      if (!visible || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        spans.forEach((s) => {
          const r = s.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          s.style.setProperty("--k", Math.max(0, 1 - d / 260).toFixed(3));
        });
      });
    }, { passive: true });
  })();
});
