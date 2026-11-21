/* ==========================================================
   EpistleChat page — interactive effects
   Floating letters, delivery-style animations, message-effects
   playground and scroll-linked phones. Works with mouse and touch.
   ========================================================== */

(window.SS_CONTENT_READY || Promise.resolve()).then(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  /* Emoji / shape burst inside a container (container must be position:relative) */
  function burst(container, { x, y, items = ["✨"], count = 14, spread = 140, up = 0, gravity = true, size = [14, 24], life = 1100 } = {}) {
    if (reduce) return;
    const r = container.getBoundingClientRect();
    const ox = x ?? r.width / 2, oy = y ?? r.height / 2;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "fx-bit";
      const item = pick(items);
      if (item.startsWith("#")) {
        s.classList.add("chip");
        s.style.background = item;
      } else {
        s.textContent = item;
      }
      const ang = rand(0, Math.PI * 2);
      const dist = rand(spread * 0.35, spread);
      s.style.left = `${ox}px`;
      s.style.top = `${oy}px`;
      s.style.fontSize = `${rand(size[0], size[1])}px`;
      s.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(ang) * dist * 0.7 - up}px`);
      s.style.setProperty("--fall", gravity ? `${rand(40, 120)}px` : "0px");
      s.style.setProperty("--rot", `${rand(-260, 260)}deg`);
      s.style.animationDuration = `${rand(life * 0.7, life * 1.2)}ms`;
      container.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  /* ---------- Floating letters & flowers in the hero ---------- */
  (() => {
    const hero = $(".page-hero");
    if (!hero || reduce) return;
    const layer = document.createElement("div");
    layer.className = "float-layer";
    layer.setAttribute("aria-hidden", "true");
    hero.prepend(layer);
    const EMOJI = ["💌", "✉️", "🌸", "💐", "🫧", "✨", "📜", "🌷", "🕊️", "💜"];
    const n = innerWidth < 700 ? 9 : 16;
    for (let i = 0; i < n; i++) {
      const e = document.createElement("span");
      e.className = "float-emoji";
      e.textContent = EMOJI[i % EMOJI.length];
      e.style.setProperty("--x", `${rand(2, 96)}%`);
      e.style.setProperty("--s", `${rand(18, 38)}px`);
      e.style.setProperty("--d", `${rand(14, 26)}s`);
      e.style.setProperty("--delay", `${-rand(0, 26)}s`);
      e.style.setProperty("--sway", `${rand(-80, 80)}px`);
      e.style.setProperty("--rot", `${rand(-40, 40)}deg`);
      e.addEventListener("pointerdown", (ev) => {
        ev.stopPropagation();
        const r = e.getBoundingClientRect(), lr = layer.getBoundingClientRect();
        burst(layer, { x: r.left - lr.left + r.width / 2, y: r.top - lr.top + r.height / 2, items: ["✨", "💖", "🌸", "💫"], count: 10, spread: 80 });
        e.classList.add("popped");
        setTimeout(() => {
          e.classList.remove("popped");
          e.style.setProperty("--x", `${rand(2, 96)}%`);
        }, 700);
      });
      layer.appendChild(e);
    }
  })();

  /* ---------- Delivery styles: each one plays its own animation ---------- */
  (() => {
    const cards = $$(".style-card");
    if (!cards.length || reduce) return;
    const kind = (name) => {
      const n = name.toLowerCase();
      if (n.includes("plane")) return "plane";
      if (n.includes("bottle")) return "bottle";
      if (n.includes("scroll")) return "scroll";
      if (n.includes("capsule") || n.includes("time")) return "capsule";
      if (n.includes("museum")) return "museum";
      if (n.includes("letter")) return "letter";
      return "generic";
    };
    const BITS = {
      letter: ["💌", "❤️", "💗"],
      scroll: ["🎺", "✨", "🎶", "👑"],
      bottle: ["🫧", "🫧", "💧", "🌊"],
      plane: ["☁️", "💨"],
      capsule: ["🔒", "⏳", "✨"],
      museum: ["✨", "🖼️", "⭐"],
      generic: ["✨", "💫"],
    };
    const play = (card) => {
      if (card.classList.contains("playing")) return;
      const type = card.dataset.anim;
      card.classList.add("playing", `anim-${type}`);
      const sw = $(".sw", card);
      const r = sw.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const x = r.left - cr.left + r.width / 2, y = r.top - cr.top + r.height / 2;
      setTimeout(() => burst(card, { x, y, items: BITS[type], count: type === "bottle" ? 12 : 10, spread: 110, up: type === "bottle" ? 50 : 20, gravity: type !== "bottle" }), type === "plane" ? 700 : 250);
      setTimeout(() => card.classList.remove("playing", `anim-${type}`), 1600);
    };
    cards.forEach((card) => {
      card.dataset.anim = kind($("h3", card)?.textContent || "");
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Play the ${$("h3", card)?.textContent || ""} animation`);
      card.addEventListener("click", () => play(card));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(card); } });
      if (fine) card.addEventListener("pointerenter", () => play(card));
    });
    // Play them all in sequence the first time the grid scrolls into view
    const grid = cards[0].parentElement;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      cards.forEach((c, i) => setTimeout(() => play(c), 600 + i * 420));
    }, { threshold: 0.4 });
    io.observe(grid);
  })();

  /* ---------- Message effects playground ----------
     A direct port of EpistleChat/Chat/MessageEffects.swift: the same tile art, bubble styles,
     invisible ink, present, and full-screen moments, with the same colors, timings and
     pseudo-random particle layout. Like the app's "Send with Effect" picker, the selected
     effect's screen moment loops while the playground is on screen. */
  (() => {
    const pg = $(".playground");
    if (!pg) return;
    const stage = $(".pg-chat", pg);
    const input = $(".pg-input", pg);
    const hint = $(".pg-hint", pg);
    const slot = $(".pg-me", pg);
    const screen = $(".pg-screen", pg);
    const tiles = $$(".pg-tile", pg);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // iOS system colors (light mode), as used by SwiftUI's .red, .pink, etc.
    const SYS = { red: "#FF3B30", orange: "#FF9500", yellow: "#FFCC00", green: "#34C759", cyan: "#32ADE6", blue: "#007AFF", purple: "#AF52DE", pink: "#FF2D55", gray: "#8E8E93" };
    const MOMENTS = new Set(["disco", "fire", "ice", "confetti"]);
    const MOMENT_SECONDS = 3.6; // the picker's looping preview length
    const TAU = Math.PI * 2;

    /** Double.pseudoRandom(_:) — deterministic 0..<1 so particles are stable across frames. */
    const pr = (seed, salt) => { const v = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453; return v - Math.floor(v); };
    const rgba = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
    };
    /** Color(hue:saturation:brightness:) */
    const hsb = (h, s, v, a) => {
      const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
      return `rgba(${Math.round(f(5) * 255)},${Math.round(f(3) * 255)},${Math.round(f(1) * 255)},${a})`;
    };
    const roundRect = (ctx, x, y, w, h, r) => {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };
    /** Sizes a canvas to its element (in CSS px, times the screen scale) and clears it. */
    const fit = (canvas) => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const W = Math.max(1, Math.round(w * dpr)), H = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      return { ctx, w, h };
    };
    /** The "snowflake" SF Symbol, drawn as six branched arms filling `size`. */
    const snowflake = (ctx, cx, cy, size, color, angle = 0) => {
      const r = size / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, size * 0.11);
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k * TAU) / 6, ca = Math.cos(a), sa = Math.sin(a);
        const pt = (d, off) => [ca * d - sa * off, sa * d + ca * off];
        ctx.moveTo(0, 0); ctx.lineTo(...pt(r * 0.95, 0));
        for (const [d, len] of [[0.5, 0.26], [0.75, 0.2]]) {
          ctx.moveTo(...pt(r * d, 0)); ctx.lineTo(...pt(r * (d + len * 0.7), r * len));
          ctx.moveTo(...pt(r * d, 0)); ctx.lineTo(...pt(r * (d + len * 0.7), -r * len));
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    let effect = "disco";
    let parts = {};
    let momentStart = performance.now();
    let sparkle = null; // { start, x, y } for the just-opened present
    let inkTimer = 0;
    let visible = false;
    let raf = 0;
    const messageText = () => input.value.trim() || "Your message";

    /* ----- Bubble styles (EffectBubbleBackground) ----- */

    function drawDisco(t) {
      const { ctx, w, h } = fit(parts.bg);
      ctx.save();
      roundRect(ctx, 0, 0, w, h, 20); ctx.clip();
      const colors = ["#7C3AED", "#DB2777", "#F59E0B", "#10B981", "#3B82F6", "#7C3AED"];
      let g;
      if (ctx.createConicGradient) g = ctx.createConicGradient(((t * 60) * Math.PI) / 180, w / 2, h / 2);
      else g = ctx.createLinearGradient(0, 0, w, 0);
      colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) {
        const x = pr(i, 1) * w, y = pr(i, 2) * h;
        const a = Math.max(0, Math.sin(t * 3 + i * 1.7)), r = 1.5 + 1.5 * a;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    function drawFire(t) {
      const { ctx, w, h } = fit(parts.bg);
      roundRect(ctx, 0, 0, w, h, 20);
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "#FACC15"); g.addColorStop(0.5, "#F97316"); g.addColorStop(1, "#B91C1C");
      ctx.fillStyle = g; ctx.fill();
      // Flames licking off the top edge (a 20px strip, raised 16px).
      const f = fit(parts.flames), fh = f.h;
      for (let i = 0; i < 9; i++) {
        const x = (f.w * (i + 0.5)) / 9;
        const height = 8 + 10 * Math.abs(Math.sin(t * 5 + i * 2.1));
        const fg = f.ctx.createLinearGradient(x, fh, x, fh - height);
        fg.addColorStop(0, "#B91C1C"); fg.addColorStop(0.5, "#F97316"); fg.addColorStop(1, "#FDE047");
        f.ctx.fillStyle = fg;
        f.ctx.beginPath();
        f.ctx.moveTo(x - 6, fh);
        f.ctx.quadraticCurveTo(x - 7, fh - height * 0.5, x, fh - height);
        f.ctx.quadraticCurveTo(x + 7, fh - height * 0.5, x + 6, fh);
        f.ctx.fill();
      }
      parts.b.style.boxShadow = `0 0 16px ${rgba(SYS.orange, 0.55 + 0.25 * Math.sin(t * 4))}`;
    }

    function drawIce(t) {
      const { ctx, w, h } = fit(parts.bg);
      ctx.save();
      roundRect(ctx, 0, 0, w, h, 20); ctx.clip();
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#E0F2FE"); g.addColorStop(0.5, "#7DD3FC"); g.addColorStop(1, "#38BDF8");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // Frost crystals in the corners + a moving glint.
      snowflake(ctx, 4 + 5, 3 + 5, 10, "rgba(255,255,255,0.8)");
      snowflake(ctx, w - 14 + 4.5, h - 13 + 4.5, 9, "rgba(255,255,255,0.8)");
      const gx = ((t * 60) % (w + 80)) - 40;
      const glint = ctx.createLinearGradient(gx, 0, gx + 18, 0);
      glint.addColorStop(0, "rgba(255,255,255,0)"); glint.addColorStop(0.5, "rgba(255,255,255,0.6)"); glint.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glint; ctx.fillRect(gx, 0, 18, h);
      ctx.restore();
      roundRect(ctx, 0.75, 0.75, w - 1.5, h - 1.5, 19.25);
      ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    /* ----- Invisible ink ----- */

    function drawInk(t) {
      const { ctx, w, h } = fit(parts.ink);
      roundRect(ctx, 0, 0, w, h, 20);
      ctx.fillStyle = "rgba(79,70,229,0.85)"; // #4F46E5 at 85%
      ctx.fill();
      const count = Math.floor((w * h) / 40);
      for (let i = 0; i < count; i++) {
        const x = (pr(i, 1) * w + Math.sin(t * 1.3 + i) * 3) % w;
        const y = (pr(i, 2) * h + Math.cos(t * 1.1 + i) * 3) % h;
        ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i))})`;
        ctx.beginPath(); ctx.arc(x + 0.8, y + 0.8, 0.8, 0, TAU); ctx.fill();
      }
    }

    function revealInk() {
      if (!parts.b || parts.b.classList.contains("revealed")) return;
      parts.b.classList.add("revealed");
      parts.b.setAttribute("aria-label", messageText());
      hint.textContent = "";
      clearTimeout(inkTimer);
      inkTimer = setTimeout(() => {
        if (!parts.b) return;
        parts.b.classList.remove("revealed");
        parts.b.setAttribute("aria-label", "Hidden message. Tap to reveal");
        hint.textContent = "Tap the message to reveal it";
      }, 5000);
    }

    /* ----- Full-screen moments (ScreenEffectOverlay) ----- */

    function drawMoment(ctx, w, h, t, kind) {
      const duration = MOMENT_SECONDS;
      const fadeIn = Math.min(1, t / 0.3);
      const fadeOut = Math.min(1, Math.max(0, (duration - t) / 0.7));
      const alpha = fadeIn * fadeOut;

      if (kind === "disco") {
        // Party tint that pulses through colors.
        ctx.fillStyle = hsb((t * 0.35) % 1, 0.7, 0.5, 0.22 * alpha);
        ctx.fillRect(0, 0, w, h);
        // Ball drops in from the top and spins.
        const R = 46, drop = Math.min(1, t / 0.8);
        const cx = w / 2, cy = -R + (R + 150) * (1 - Math.pow(1 - drop, 3));
        ctx.strokeStyle = rgba(SYS.gray, alpha); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - R); ctx.stroke();
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
        ctx.fillStyle = "#9CA3AF"; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
        const facet = 9, spin = (t * 40) % facet;
        for (let row = 0, y = cy - R; y < cy + R; y += facet, row++) {
          for (let col = 0, x = cx - R - facet + spin; x < cx + R; x += facet, col++) {
            const shimmer = Math.abs(Math.sin(t * 4 + (row * 7 + col * 3)));
            ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.7 * shimmer})`;
            ctx.fillRect(x + 0.8, y + 0.8, facet - 1.6, facet - 1.6);
          }
        }
        ctx.restore();
        // Light spots sweeping around the room.
        const spots = [SYS.pink, SYS.cyan, SYS.yellow, SYS.purple, SYS.green, SYS.orange];
        for (let i = 0; i < 36; i++) {
          const angle = (i / 36) * TAU + t * 0.9;
          const radius = w * (0.3 + pr(i, 1) * 0.6);
          const x = cx + Math.cos(angle) * radius, y = cy + 120 + Math.sin(angle) * radius * 1.4;
          const r = 4 + pr(i, 2) * 6;
          ctx.fillStyle = rgba(spots[i % spots.length], 0.75 * alpha);
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
      } else if (kind === "fire") {
        // Heat glow rising from the bottom.
        const glow = h * 0.45 * Math.min(1, t / 0.8);
        if (glow > 0) {
          const g = ctx.createLinearGradient(0, h - glow, 0, h);
          g.addColorStop(0, "rgba(249,115,22,0)");
          g.addColorStop(0.5, rgba("#F97316", 0.35 * alpha));
          g.addColorStop(1, rgba("#B91C1C", 0.55 * alpha));
          ctx.fillStyle = g; ctx.fillRect(0, h - glow, w, glow);
        }
        // Embers drifting up.
        for (let i = 0; i < 90; i++) {
          const life = 1.6 + pr(i, 3) * 1.4;
          const local = (t + pr(i, 4) * life) % life;
          const x = pr(i, 1) * w + Math.sin(local * 3 + i) * 22;
          const y = h - (local / life) * h * (0.5 + pr(i, 2) * 0.5);
          const flicker = 0.5 + 0.5 * Math.abs(Math.sin(t * 9 + i));
          const r = 1.5 + pr(i, 5) * 3;
          ctx.fillStyle = rgba(i % 3 === 0 ? "#FDE047" : "#F97316", flicker * (1 - local / life) * alpha);
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
      } else if (kind === "ice") {
        // Frost creeping in from the edges.
        const frost = 0.6 * Math.min(1, t / 1.0) * fadeOut;
        const edge = w * 0.35;
        let g = ctx.createLinearGradient(0, 0, edge, 0);
        g.addColorStop(0, `rgba(255,255,255,${frost})`); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, edge, h);
        g = ctx.createLinearGradient(w - edge, 0, w, 0);
        g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, `rgba(255,255,255,${frost})`);
        ctx.fillStyle = g; ctx.fillRect(w - edge, 0, edge, h);
        g = ctx.createLinearGradient(0, 0, 0, edge);
        g.addColorStop(0, rgba("#BAE6FD", frost)); g.addColorStop(1, "rgba(186,230,253,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, edge);
        // Snowflakes falling and turning.
        for (let i = 0; i < 45; i++) {
          const local = Math.max(0, t - pr(i, 3) * 1.2);
          const x = pr(i, 1) * w + Math.sin(local * 1.5 + i) * 30;
          const y = -20 + local * (110 + pr(i, 2) * 120);
          const size = 10 + pr(i, 5) * 16;
          snowflake(ctx, x, y, size, `rgba(255,255,255,${alpha * 0.95})`, local * (1 + pr(i, 4)));
        }
      } else if (kind === "confetti") {
        const colors = [SYS.red, SYS.orange, SYS.yellow, SYS.green, SYS.cyan, SYS.blue, SYS.purple, SYS.pink];
        // Rain from the top…
        for (let i = 0; i < 120; i++) {
          const local = Math.max(0, t - pr(i, 3) * 0.9);
          const x = pr(i, 1) * w + Math.sin(local * 3 + i) * 25;
          const y = -20 + local * (170 + pr(i, 2) * 200);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(local * (4 + pr(i, 4) * 6));
          ctx.scale(Math.cos(local * 5 + i), 1); // flutter
          ctx.globalAlpha = fadeOut;
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(-4, -2.5, 8, 5);
          ctx.restore();
        }
        // …plus two cannons from the bottom corners.
        for (let i = 0; i < 60; i++) {
          const fromLeft = i % 2 === 0;
          const angle = (fromLeft ? -1.15 : -1.99) + (pr(i, 6) - 0.5) * 0.5;
          const speed = 520 + pr(i, 7) * 300;
          const x = (fromLeft ? 0 : w) + Math.cos(angle) * speed * t;
          const y = h + Math.sin(angle) * speed * t + 380 * t * t;
          ctx.globalAlpha = fadeOut;
          ctx.fillStyle = colors[(i + 3) % colors.length];
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    /** SparkleBurst: 26 dots flying out of a just-opened present for 1.4s. */
    function drawSparkle(ctx, now) {
      const t = (now - sparkle.start) / 1000;
      if (t >= 1.4) { sparkle = null; return; }
      const colors = [SYS.yellow, SYS.pink, SYS.orange, SYS.purple, SYS.cyan];
      for (let i = 0; i < 26; i++) {
        const angle = (i / 26) * TAU;
        const distance = t * (120 + pr(i, 1) * 80);
        const x = sparkle.x + Math.cos(angle) * distance;
        const y = sparkle.y + Math.sin(angle) * distance + t * t * 60;
        ctx.fillStyle = rgba(colors[i % colors.length], Math.max(0, 1 - t / 1.4));
        ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      }
    }

    /* ----- Building the bubble / present ----- */

    function bubble(kind) {
      const b = document.createElement("div");
      b.className = `pg-bubble me fx-${kind}`;
      const label = document.createElement("span");
      label.className = "pg-text";
      label.textContent = messageText();
      parts = { b, label };
      if (kind === "disco" || kind === "fire" || kind === "ice") {
        parts.bg = document.createElement("canvas");
        parts.bg.className = "pg-bg";
        b.append(parts.bg);
      }
      if (kind === "fire") {
        parts.flames = document.createElement("canvas");
        parts.flames.className = "pg-flames";
        b.append(parts.flames);
      }
      b.append(label);
      if (kind === "ink") {
        parts.ink = document.createElement("canvas");
        parts.ink.className = "pg-inkfx";
        b.append(parts.ink);
        b.tabIndex = 0;
        b.setAttribute("role", "button");
        b.setAttribute("aria-label", "Hidden message. Tap to reveal");
        b.addEventListener("click", revealInk);
        b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); revealInk(); } });
      }
      return b;
    }

    function present() {
      const gift = document.createElement("div");
      gift.className = "pg-gift";
      gift.tabIndex = 0;
      gift.setAttribute("role", "button");
      gift.setAttribute("aria-label", "Gift message. Tap to open");
      gift.innerHTML =
        '<div class="pg-gift-wiggle"><div class="pg-gift-art">' +
        '<div class="pg-gift-box"></div>' +
        '<div class="pg-gift-lid"><span class="pg-gift-bow l"></span><span class="pg-gift-bow r"></span><div class="pg-gift-cap"></div></div>' +
        "</div></div><small>Tap to open</small>";
      let opening = false;
      const open = () => {
        if (opening) return;
        opening = true;
        const wiggle = $(".pg-gift-wiggle", gift);
        wiggle.animate(
          [{ transform: "rotate(0)" }, { transform: "rotate(-12deg)" }, { transform: "rotate(12deg)" }, { transform: "rotate(-10deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0)" }],
          { duration: reduce ? 0 : 400, easing: "ease-in-out" },
        );
        setTimeout(() => gift.classList.add("lid-off"), reduce ? 0 : 420);
        setTimeout(() => {
          const b = bubble("none");
          slot.replaceChildren(b);
          slot.classList.remove("swap"); void slot.offsetWidth; slot.classList.add("swap");
          const r = b.getBoundingClientRect(), sr = stage.getBoundingClientRect();
          if (!reduce) sparkle = { start: performance.now(), x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
          kick();
        }, reduce ? 0 : 720);
      };
      gift.addEventListener("click", open);
      gift.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      parts = {};
      return gift;
    }

    function select(kind) {
      effect = kind;
      clearTimeout(inkTimer);
      sparkle = null;
      momentStart = performance.now();
      tiles.forEach((tile) => tile.setAttribute("aria-pressed", String(tile.dataset.fx === kind)));
      slot.replaceChildren(kind === "present" ? present() : bubble(kind));
      slot.classList.remove("swap"); void slot.offsetWidth; slot.classList.add("swap");
      hint.textContent = kind === "ink" ? "Tap the message to reveal it" : "";
      kick();
    }

    /* ----- One animation loop for everything, only while the playground is on screen ----- */

    function frame(now) {
      raf = 0;
      const t = reduce ? 0 : now / 1000;
      if (effect === "disco" && parts.bg) drawDisco(t);
      if (effect === "fire" && parts.bg) drawFire(t);
      if (effect === "ice" && parts.bg) drawIce(t);
      if (effect === "ink" && parts.ink) drawInk(t);

      const { ctx, w, h } = fit(screen);
      if (!reduce && MOMENTS.has(effect)) {
        let local = (now - momentStart) / 1000;
        if (local >= MOMENT_SECONDS) { momentStart = now; local = 0; } // replay, like the picker
        drawMoment(ctx, w, h, local, effect);
      }
      if (sparkle) drawSparkle(ctx, now);

      // Keep going while something moves; with reduced motion, draw once and stop.
      if (visible && (!reduce || sparkle)) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    input.addEventListener("input", () => { if (parts.label) parts.label.textContent = messageText(); });
    tiles.forEach((tile) => tile.addEventListener("click", () => select(tile.dataset.fx)));

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { momentStart = performance.now(); kick(); }
    }, { threshold: 0.25 }).observe(pg);

    select("disco");
  })();

  /* ---------- Phones move with the scroll ---------- */
  (() => {
    const phones = $$(".phone");
    if (!phones.length || reduce) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const mid = innerHeight / 2;
      phones.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const k = Math.max(-1, Math.min(1, (r.top + r.height / 2 - mid) / innerHeight));
        const dir = i % 2 ? 1 : -1;
        p.style.setProperty("--py", `${k * 60 * dir}px`);
        if (!fine) p.style.setProperty("--ry", `${k * 18 * dir}deg`);
      });
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* ---------- Feature group emojis bounce when they appear ---------- */
  (() => {
    if (reduce) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add("bounce");
    }), { threshold: 0.6 });
    $$(".group-emoji, .extra-emoji").forEach((el) => io.observe(el));
  })();
});
