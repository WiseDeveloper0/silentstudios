# Silent Studios Entertainment website

Static site, no build step. Serve the folder (e.g. `python3 -m http.server`) to preview.
Hosted on Cloudflare Pages from the `main` branch.

## Pages
- `index.html`: landing (hero, apps, about, contact)
- `epistlechat.html`: EpistleChat + waitlist
- `kraylus.html`: Kraylus (concept)
- `support.html`: searchable, filterable FAQ

## Editing the site (no code)
Go to **yourdomain.com/admin** (or https://app.pagescms.org), sign in with GitHub and pick this repo.
You can edit every page's text, the FAQs, roadmap, features and screenshots. Saving commits to
GitHub and Cloudflare republishes in about a minute.

Behind the scenes the text lives in `content/*.json` and the editor is configured in `.pages.yml`.

## Before going live
1. **Connect the forms.** Create two forms at https://formspree.io (free) and paste their URLs into
   *Site settings* in the editor. Until then, signups are only saved in the visitor's browser.
2. **Contact email.** Set it in *Site settings*.
