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

  /* ---------- Message effects playground ---------- */
  (() => {
    const pg = $(".playground");
    if (!pg) return;
    const stage = $(".pg-chat", pg);
    const bubble = $(".pg-bubble.me", pg);
    const text = $(".pg-text", bubble);
    const input = $(".pg-input", pg);
    const hint = $(".pg-hint", pg);
    const buttons = $$(".pg-effect", pg);
    let current = "";
    const EFFECTS = ["confetti", "fire", "ice", "disco", "ink", "present"];
    const HINTS = { ink: "Tap the message to reveal it", present: "Tap the present to unwrap it" };

    input.addEventListener("input", () => { text.textContent = input.value.trim() || "…"; });

    const center = () => {
      const r = bubble.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 };
    };
    const send = (fx) => {
      current = fx;
      EFFECTS.forEach((e) => bubble.classList.remove(`fx-${e}`));
      bubble.classList.remove("revealed", "unwrapped", "sending");
      void bubble.offsetWidth;
      bubble.classList.add("sending", `fx-${fx}`);
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fx === fx)));
      hint.textContent = HINTS[fx] || "";
      const c = center();
      if (fx === "confetti") {
        setTimeout(() => burst(stage, { ...c, items: ["#f5c6d1", "#a8ecf0", "#8c2a4d", "#ffd166", "#fbeef1"], count: 46, spread: 220, up: 60 }), 250);
      } else if (fx === "fire") {
        for (let i = 0; i < 4; i++) setTimeout(() => burst(stage, { x: c.x + rand(-60, 60), y: c.y + 10, items: ["🔥", "🔥", "✨"], count: 4, spread: 30, up: 90, gravity: false, size: [16, 28] }), i * 220);
      } else if (fx === "ice") {
        setTimeout(() => burst(stage, { ...c, items: ["❄️", "🧊", "✨"], count: 16, spread: 160, up: 10, size: [12, 22] }), 250);
      } else if (fx === "disco") {
        setTimeout(() => burst(stage, { ...c, items: ["🪩", "✨", "🎶", "💜"], count: 14, spread: 170, up: 30 }), 250);
      }
    };
    buttons.forEach((b) => b.addEventListener("click", () => send(b.dataset.fx)));

    bubble.addEventListener("click", () => {
      if (current === "ink") {
        bubble.classList.add("revealed");
        hint.textContent = "";
      }
      if (current === "present" && !bubble.classList.contains("unwrapped")) {
        bubble.classList.add("unwrapped");
        hint.textContent = "";
        burst(stage, { ...center(), items: ["🎉", "✨", "🎀", "#f5c6d1", "#a8ecf0"], count: 26, spread: 180, up: 40 });
      }
    });

    // Show an effect once when the playground first appears
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(() => send("confetti"), 500);
    }, { threshold: 0.5 });
    io.observe(pg);
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
