/* ==========================================================
   SilentStudios — interactions
   ========================================================== */

/* ---------------------------------------------------------
   CONFIG — connect your forms here.
   Create a free form at https://formspree.io (or any service
   that accepts JSON POSTs) and paste the endpoint URLs below.
   Until then the forms run in "demo mode": submissions are
   only saved in the visitor's own browser, not sent to you.
   --------------------------------------------------------- */
const SITE_CONFIG = {
  // Prefer setting these in the /admin editor (Site settings). Values here are a fallback.
  waitlistEndpoint: "", // e.g. "https://formspree.io/f/xxxxxxx"
  contactEndpoint: "",  // optional; when empty, contact messages go to contactEmail via FormSubmit
  contactEmail: "support@silentstudios.online",
};

(window.SS_CONTENT_READY || Promise.resolve()).then(() => {
if (window.SS_SITE) {
  SITE_CONFIG.waitlistEndpoint = window.SS_SITE.waitlist_endpoint || SITE_CONFIG.waitlistEndpoint;
  SITE_CONFIG.contactEndpoint = window.SS_SITE.contact_endpoint || SITE_CONFIG.contactEndpoint;
  SITE_CONFIG.contactEmail = window.SS_SITE.contact_email || SITE_CONFIG.contactEmail;
}
// No custom contact endpoint? Deliver messages straight to the contact inbox via FormSubmit.
if (!SITE_CONFIG.contactEndpoint && SITE_CONFIG.contactEmail) {
  SITE_CONFIG.contactEndpoint = `https://formsubmit.co/ajax/${encodeURIComponent(SITE_CONFIG.contactEmail)}`;
}
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Header: scrolled state + sliding nav pill + mobile menu ---------- */
(() => {
  const header = $(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = $(".menu-toggle");
  toggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      toggle?.setAttribute("aria-expanded", "false");
    })
  );

  const list = $(".nav-links");
  const pill = $(".nav-pill");
  if (!list || !pill) return;
  const moveTo = (a) => {
    if (!a) { pill.style.opacity = "0"; return; }
    const r = a.getBoundingClientRect();
    const lr = list.getBoundingClientRect();
    pill.style.left = `${r.left - lr.left}px`;
    pill.style.width = `${r.width}px`;
    pill.style.opacity = "1";
  };
  const current = $('.nav-links a[aria-current="page"]');
  $$(".nav-links a").forEach((a) => a.addEventListener("mouseenter", () => moveTo(a)));
  list.addEventListener("mouseleave", () => moveTo(current));
  window.addEventListener("load", () => moveTo(current));
  window.addEventListener("resize", () => moveTo(current));
})();

/* ---------- Scroll reveal ---------- */
(() => {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---------- Card spotlight (Linear-style) ---------- */
(() => {
  if (!finePointer) return;
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
  });
})();

/* ---------- Magnetic buttons (Framer-style) ---------- */
(() => {
  if (!finePointer || reduceMotion) return;
  $$("[data-magnetic]").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.setProperty("--mx", `${x}px`);
      btn.style.setProperty("--my", `${y}px`);
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.setProperty("--mx", "0px");
      btn.style.setProperty("--my", "0px");
    });
  });
})();

/* ---------- Cursor glow ---------- */
(() => {
  if (!finePointer || reduceMotion) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => {
    cx += (x - cx) * 0.12;
    cy += (y - cy) * 0.12;
    glow.style.transform = `translate(${cx - 210}px, ${cy - 210}px)`;
    requestAnimationFrame(loop);
  };
  loop();
})();

/* ---------- Hero: animated gradient mesh (Stripe-inspired) ---------- */
(() => {
  const canvas = $(".hero-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const SCALE = 0.35; // render at low res, CSS upscales = free blur
  const blobs = [
    { c: [140, 42, 77], r: 0.55, x: 0.2, y: 0.3, sx: 0.00021, sy: 0.00017, p: 0 },
    { c: [245, 198, 209], r: 0.38, x: 0.75, y: 0.25, sx: 0.00018, sy: 0.00023, p: 1.7 },
    { c: [168, 236, 240], r: 0.34, x: 0.6, y: 0.75, sx: 0.00025, sy: 0.00014, p: 3.1 },
    { c: [107, 29, 58], r: 0.6, x: 0.85, y: 0.65, sx: 0.00014, sy: 0.0002, p: 4.4 },
    { c: [236, 159, 178], r: 0.28, x: 0.35, y: 0.8, sx: 0.0002, sy: 0.00026, p: 5.2 },
  ];
  let w, h, mx = 0.5, my = 0.5;
  const resize = () => {
    w = canvas.width = Math.ceil(canvas.offsetWidth * SCALE);
    h = canvas.height = Math.ceil(canvas.offsetHeight * SCALE);
  };
  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  const draw = (t) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#1f0711";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    const m = Math.max(w, h);
    blobs.forEach((b, i) => {
      const bx = (b.x + Math.sin(t * b.sx + b.p) * 0.12 + (mx - 0.5) * 0.06 * (i % 2 ? 1 : -1)) * w;
      const by = (b.y + Math.cos(t * b.sy + b.p) * 0.12 + (my - 0.5) * 0.06) * h;
      const r = b.r * m;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      const a = i === 1 || i === 2 ? 0.38 : 0.7;
      g.addColorStop(0, `rgba(${b.c.join(",")},${a})`);
      g.addColorStop(1, `rgba(${b.c.join(",")},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  };
  if (reduceMotion) { draw(0); return; }
  const loop = (t) => {
    if (visible) draw(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ---------- Hero scroll-out (Apple-style) ---------- */
(() => {
  const inner = $(".hero-inner");
  if (!inner || reduceMotion) return;
  const hero = inner.closest(".hero");
  const onScroll = () => {
    const p = Math.min(Math.max(scrollY / hero.offsetHeight, 0), 1);
    inner.style.transform = `translateY(${p * 120}px) scale(${1 - p * 0.08})`;
    inner.style.opacity = String(1 - p * 1.3);
  };
  addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------- Statement: words light up as you scroll ---------- */
(() => {
  const el = $(".statement p");
  if (!el) return;
  // Wrap words, preserving accent spans
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span");
          s.className = "word" + (node.dataset?.accent ? ` ${node.dataset.accent}` : "");
          s.textContent = part;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n);
    });
  };
  wrap(el);
  const words = $$(".word", el);
  if (reduceMotion) { words.forEach((w) => w.classList.add("lit")); return; }
  const onScroll = () => {
    const r = el.getBoundingClientRect();
    const start = innerHeight * 0.85, end = innerHeight * 0.3;
    const p = Math.min(Math.max((start - r.top) / (start - end + r.height * 0.6), 0), 1);
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < n));
  };
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------- Count-up stats ---------- */
(() => {
  const els = $$("[data-count]");
  if (!els.length) return;
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
})();

/* ---------- Phone tilt on EpistleChat page ---------- */
(() => {
  const phone = $(".phone");
  if (!phone || !finePointer || reduceMotion) return;
  addEventListener("pointermove", (e) => {
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    phone.style.setProperty("--ry", `${-8 + x * 14}deg`);
    phone.style.setProperty("--rx", `${4 - y * 10}deg`);
  }, { passive: true });
})();

/* ---------- Form helpers ---------- */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

async function submitTo(endpoint, data, storageKey) {
  if (!endpoint) {
    // Demo mode: keep locally so nothing is lost while testing.
    try {
      const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
      list.push({ ...data, at: new Date().toISOString() });
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (_) { /* storage blocked */ }
    console.warn(`[SilentStudios] No endpoint set for ${storageKey}; saved locally only. See SITE_CONFIG in assets/main.js.`);
    await new Promise((r) => setTimeout(r, 600));
    return true;
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const json = await res.json().catch(() => ({}));
  if (json.success === false || json.success === "false") throw new Error(json.message || "Not delivered");
  return true;
}

/* ---------- Contact form ---------- */
(() => {
  const form = $("#contact-form");
  if (!form) return;
  const status = $(".form-status", form);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name?.trim() || !isEmail(data.email || "") || !data.message?.trim()) {
      status.className = "form-status err";
      status.textContent = "Please add your name, a valid email and a message.";
      return;
    }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.firstChild.textContent = "Sending… ";
    try {
      await submitTo(
        SITE_CONFIG.contactEndpoint,
        { ...data, _subject: `SilentStudios website: ${data.topic || "General"} from ${data.name.trim()}`, _replyto: data.email, _template: "table" },
        "ss_contact"
      );
      form.reset();
      status.className = "form-status ok";
      status.textContent = "Thanks — we'll get back to you within two working days.";
    } catch (err) {
      status.className = "form-status err";
      status.innerHTML = "";
      status.append("Something went wrong. Please email us at ");
      const a = document.createElement("a");
      a.href = `mailto:${SITE_CONFIG.contactEmail}`;
      a.textContent = SITE_CONFIG.contactEmail;
      a.style.textDecoration = "underline";
      status.append(a, ".");
    } finally {
      btn.disabled = false;
      btn.firstChild.textContent = "Send message ";
    }
  });
})();

/* ---------- Waitlist: stepped onboarding (Duolingo-style) ---------- */
(() => {
  const root = $("[data-waitlist]");
  if (!root) return;
  const steps = $$(".wl-step", root);
  const bar = $(".wl-progress span", root);
  const emailInput = $("#wl-email", root);
  const emailNext = $("#wl-email-next", root);
  const err = $("#wl-error", root);
  const submit = $("#wl-submit", root);
  const state = { email: "", device: "" };
  let idx = 0;

  if (!SITE_CONFIG.waitlistEndpoint) {
    const note = $("#wl-demo", root);
    if (note) note.hidden = false;
  }

  const go = (i) => {
    steps[idx].classList.remove("active");
    idx = i;
    steps[idx].classList.add("active");
    bar.style.width = `${((idx + 1) / steps.length) * 100}%`;
    const focusable = $("input, button.choice", steps[idx]);
    focusable?.focus({ preventScroll: true });
  };

  emailInput.addEventListener("input", () => {
    emailNext.disabled = !isEmail(emailInput.value);
    err.textContent = "";
  });
  $("#wl-step-email", root).addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isEmail(emailInput.value)) { err.textContent = "That email doesn't look quite right."; return; }
    state.email = emailInput.value.trim();
    go(1);
  });

  $$(".choice", root).forEach((c) =>
    c.addEventListener("click", () => {
      $$(".choice", root).forEach((o) => o.setAttribute("aria-pressed", "false"));
      c.setAttribute("aria-pressed", "true");
      state.device = c.dataset.value;
      submit.disabled = false;
    })
  );
  $("#wl-back", root).addEventListener("click", () => go(0));

  submit.addEventListener("click", async () => {
    submit.disabled = true;
    submit.textContent = "Joining…";
    try {
      await submitTo(
        SITE_CONFIG.waitlistEndpoint,
        { email: state.email, device: state.device, app: "EpistleChat", _subject: "EpistleChat waitlist signup" },
        "ss_waitlist"
      );
      $("#wl-done-email", root).textContent = state.email;
      go(2);
      confetti();
    } catch (e) {
      submit.textContent = "Try again";
      submit.disabled = false;
      $("#wl-error-2", root).textContent = "Couldn't join right now. Please try again in a moment.";
    }
  });
})();

/* ---------- Confetti (tiny, dependency-free) ---------- */
function confetti() {
  if (reduceMotion) return;
  const c = document.createElement("canvas");
  c.className = "confetti";
  document.body.appendChild(c);
  const ctx = c.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#f5c6d1", "#a8ecf0", "#8c2a4d", "#fbeef1", "#ec9fb2"];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2, y: innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 16, vy: Math.random() * -16 - 4,
    s: Math.random() * 6 + 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  const tick = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += 0.45; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    });
    if (t - t0 < 2800) requestAnimationFrame(tick); else c.remove();
  };
  requestAnimationFrame(tick);
}

/* ---------- Support: search + filter (Airbnb-inspired) ---------- */
(() => {
  const root = $("#support");
  if (!root) return;
  const input = $("#faq-search", root);
  const chips = $$(".chip", root);
  const items = $$(".faq-item", root);
  const empty = $(".empty", root);
  const count = $(".result-count", root);
  let filter = "all";

  items.forEach((it) => {
    const q = $("summary .q", it), a = $(".answer", it);
    it._q = q.textContent; it._a = a.innerHTML;
  });
  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === "all" ? items.length : items.filter((i) => i.dataset.cat === f).length;
    const span = $(".count", chip);
    if (span) span.textContent = n;
  });

  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlight = (text, term) =>
    term ? text.replace(new RegExp(`(${esc(term)})`, "gi"), "<mark>$1</mark>") : text;

  const apply = () => {
    const term = input.value.trim();
    const lower = term.toLowerCase();
    let shown = 0;
    items.forEach((it) => {
      const plainA = it._a.replace(/<[^>]+>/g, "");
      const matchCat = filter === "all" || it.dataset.cat === filter;
      const matchText = !lower || it._q.toLowerCase().includes(lower) || plainA.toLowerCase().includes(lower);
      const show = matchCat && matchText;
      it.hidden = !show;
      $("summary .q", it).innerHTML = highlight(it._q.replace(/</g, "&lt;"), term);
      $(".answer", it).innerHTML = term ? highlight(plainA.replace(/</g, "&lt;"), term) : it._a;
      if (show) shown++;
      if (show && lower && !it.open && plainA.toLowerCase().includes(lower)) it.open = true;
    });
    empty.hidden = shown !== 0;
    count.textContent = `${shown} ${shown === 1 ? "article" : "articles"}`;
  };

  input.addEventListener("input", apply);
  $("#faq-form", root).addEventListener("submit", (e) => { e.preventDefault(); apply(); });
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      filter = chip.dataset.filter;
      apply();
    })
  );
  // "/" focuses search, like Linear/Notion
  addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); input.focus();
    }
  });
  apply();
})();

/* ---------- Footer year ---------- */
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});
