# SilentStudios website

Static site — no build step. Open `index.html` or serve the folder (e.g. `python3 -m http.server`).
Deploys as-is to GitHub Pages, Netlify, Vercel or Cloudflare Pages.

## Pages
- `index.html` — landing (hero, apps, about, contact)
- `epistlechat.html` — EpistleChat + waitlist
- `kraylus.html` — Kraylus (concept)
- `support.html` — searchable, filterable FAQ

## Before going live
1. **Connect the forms.** Create two forms at https://formspree.io (free) and paste the endpoints into
   `SITE_CONFIG` at the top of `assets/main.js`. Until then, signups are only saved in the visitor's browser.
   Formspree lets you export the waitlist as CSV so you can email everyone when pre-orders open.
2. **Contact email.** Replace `hello@silentstudios.com` everywhere if that's not your address.
3. **EpistleChat content.** Screenshots live in `assets/epistle/` — replace those files to update them.
