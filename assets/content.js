/* ==========================================================
   SilentStudios — editable content loader
   Text and images live in /content/*.json and are edited at
   /admin (Pages CMS). The HTML keeps the same text as a
   fallback, so the site still works if a file fails to load.
   ========================================================== */

(() => {
  const page = document.body.dataset.page; // home | epistlechat | kraylus | support
  const files = ["site", page].filter(Boolean);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // [text](link) → link; everything else is plain text
  const md = (s) =>
    esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) =>
      /^(https?:|mailto:|[\w./#-]+$)/i.test(u) ? `<a href="${u}">${t}</a>` : t
    );
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

  const ICONS = {
    mailbox: '<path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M4 9l2-5h12l2 5M9 13h6"/>',
    pip: '<circle cx="12" cy="13" r="7"/><circle cx="9.5" cy="12" r=".7" fill="currentColor"/><circle cx="14.5" cy="12" r=".7" fill="currentColor"/><path d="M10.5 15.5h3M7 7.5 5.5 5M17 7.5 18.5 5"/>',
    check: '<path d="M3 12.5 8 17 21 5"/><path d="m11 15 2 2 8-9"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M3 19a6 6 0 0 1 12 0M15 19a4 4 0 0 1 6.5-3"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  };
  const svg = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.star}</svg>`;
  const delay = (i, step = 0.08) => `--delay:${((i % 3) * step).toFixed(2)}s`;

  const LISTS = {
    "home.values": (items) =>
      items.map((v, i) => `<article class="card value reveal" style="${delay(i, 0.1)}">
        <span class="num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></article>`).join(""),
    "home.stats": (items) =>
      items.map((s) => {
        const m = /^(\d+)(%?)$/.exec(String(s.number).trim());
        const num = m ? `<b data-count="${m[1]}" data-suffix="${m[2]}">0</b>` : `<b>${esc(s.number)}</b>`;
        return `<div class="stat">${num}<span>${esc(s.label)}</span></div>`;
      }).join(""),
    "epistlechat.styles": (items) =>
      items.map((s, i) => `<article class="card style-card reveal" style="--tint:${/^#[0-9a-f]{3,8}$/i.test(s.color) ? s.color : "#f5c6d1"};--delay:${(i * 0.05).toFixed(2)}s">
        <span class="sw">${esc(s.emoji)}</span><div><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></div></article>`).join(""),
    "epistlechat.features": (items) =>
      items.map((f, i) => `<article class="card feature reveal" style="${delay(i)}">
        <div class="ic">${svg(f.icon)}</div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></article>`).join(""),
    "kraylus.roadmap": (items) =>
      items.map((r, i) => `<div class="tl-item${r.done ? " done" : ""} reveal" style="--delay:${(i * 0.08).toFixed(2)}s${i === items.length - 1 ? ";padding-bottom:0" : ""}">
        <small>${esc(r.when)}</small><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join(""),
    "support.faqs": (items) =>
      items.map((f) => `<details class="card faq-item" data-cat="${esc(f.category)}">
        <summary><span class="q">${esc(f.question)}</span><span class="plus" aria-hidden="true"></span></summary>
        <div class="answer">${md(f.answer)}</div></details>`).join(""),
  };

  const apply = (data) => {
    // plain text
    document.querySelectorAll("[data-c]").forEach((el) => {
      const v = get(data, el.dataset.c);
      if (typeof v === "string" && v.trim()) el.textContent = v;
    });
    // images
    document.querySelectorAll("[data-c-src]").forEach((el) => {
      const v = get(data, el.dataset.cSrc);
      if (typeof v === "string" && v.trim()) el.src = v.replace(/^\//, "");
    });
    // statement: *pink* and _cyan_ highlights
    document.querySelectorAll("[data-c-rich]").forEach((el) => {
      const v = get(data, el.dataset.cRich);
      if (typeof v !== "string" || !v.trim()) return;
      el.innerHTML = esc(v)
        .replace(/\*([^*]+)\*/g, '<span data-accent="accent">$1</span>')
        .replace(/_([^_]+)_/g, '<span data-accent="accent2">$1</span>');
    });
    // lists
    document.querySelectorAll("[data-list]").forEach((el) => {
      const v = get(data, el.dataset.list);
      const render = LISTS[el.dataset.list];
      if (Array.isArray(v) && v.length && render) el.innerHTML = render(v);
    });
    // contact email everywhere
    const email = get(data, "site.contact_email");
    if (email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
        if (a.textContent.includes("@")) a.firstChild.textContent = email + " ";
        a.href = `mailto:${email}`;
      });
      document.querySelectorAll(".answer").forEach((el) => {
        el.innerHTML = el.innerHTML.replaceAll("hello@silentstudios.com", esc(email));
      });
    }
    // footer tagline
    const tag = get(data, "site.footer_tagline");
    if (tag) document.querySelectorAll("[data-c-tagline]").forEach((el) => (el.textContent = tag));
    window.SS_SITE = data.site || {};
  };

  const load = (name) =>
    fetch(`content/${name}.json`, { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));

  window.SS_CONTENT_READY = Promise.all(files.map(load))
    .then((parts) => {
      const data = {};
      files.forEach((f, i) => (data[f] = parts[i]));
      try { apply(data); } catch (e) { console.error("[SilentStudios] content error", e); }
    })
    .finally(() => document.documentElement.classList.remove("cms-loading"));
})();
