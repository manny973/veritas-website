# Veritas Cyber Security — Website

A complete, static marketing website. **No build step, no frameworks, no database, no server-side code.** It's plain HTML, one CSS file, and one JavaScript file — it will run on any standard web host.

---

## 1. What's in this package

```
veritas-website/
├── index.html        → Home
├── services.html     → Services (all 9 offerings + partner network)
├── about.html        → About Manny Engel
├── industries.html   → Industries We Serve
├── contact.html      → Contact / lead form
├── privacy.html      → Privacy Policy
├── styles.css        → All styling (shared by every page)
├── script.js         → All interactivity (shared by every page)
├── assets/
│   ├── veritas-logo-horizontal.png
│   ├── veritas-logo-stacked.png
│   └── manny-engel.jpeg
└── README.md         → This file
```

`index.html` is the homepage and must sit at the **root** of the web directory.

---

## 2. How to deploy (Hostinger — recommended path)

This site is hosted as static files. **Do not use the Hostinger "Website Builder"** (that's a closed drag-and-drop tool). Use a **Web Hosting** plan with **hPanel + File Manager**.

1. Log in to Hostinger → **hPanel** → select the hosting plan for `veritascybersec.com`.
2. Go to **Files → File Manager** and open the **`public_html`** folder.
3. Delete any default placeholder files already there (e.g. `default.php`, `index.html`).
4. Upload the **contents** of this `veritas-website` folder into `public_html`
   (tip: upload the .zip, then right-click → **Extract**).
5. Confirm the structure looks like this — `index.html` directly inside `public_html`:
   ```
   public_html/index.html
   public_html/services.html
   public_html/styles.css
   public_html/script.js
   public_html/assets/…
   ```
   ⚠️ Do **not** leave the files inside a `veritas-website/` subfolder — they must be at the `public_html` root, or the homepage won't load at the domain.
6. Enable free SSL: hPanel → **Security → SSL** → install the certificate so the site loads over **https://**.

### Pointing the domain
The domain is currently with **Wix**. To switch it to Hostinger, in hPanel → **Domains** follow "Connect a domain" — it provides either **nameservers** (e.g. `ns1.dns-parking.com`, `ns2.dns-parking.com`) or an **A record / server IP**. Update those values in the **Wix domain settings**. DNS changes can take a few minutes to ~24 hours to propagate. Once the new site resolves correctly, the Wix plan can be cancelled.

> Works the same on any static host (Netlify, Cloudflare Pages, Vercel, AWS S3, traditional cPanel/FTP). Just upload the files so `index.html` is at the web root.

---

## 3. The contact form

The "Request a consult" form on **contact.html** is wired to open the visitor's email client with a pre-filled message addressed to **info@veritascybersec.com** (subject + all fields included). It requires no backend.

**Optional upgrade:** if you'd prefer submissions to arrive automatically without opening the visitor's mail client, connect the form to a form-handling service (e.g. Formspree, Web3Forms, or Hostinger's form/email setup). The handler lives in `script.js` under the `#lead-form` submit listener — swap the `mailto:` action for a `fetch()` POST to your endpoint.

---

## 4. Editing content

- **Text & links:** edit directly in the relevant `.html` file. Markup is clean and clearly commented (each section is wrapped with a `<!-- ===== SECTION ===== -->` banner).
- **Colors, fonts, spacing:** all defined as CSS variables at the top of `styles.css` under `:root` (e.g. `--red`, `--gold`, `--bg`). Change once, applied site-wide.
- **Logo / images:** replace files in `assets/` (keep the same filenames to avoid editing the HTML).
- **Testimonial:** the homepage testimonial is attributed to "J.S., CFO, Healthcare Organization." To add more or swap in a photo/real name, edit the `.quote-block` in `index.html`.
- **Fonts** load from Google Fonts via the `@import` at the top of `styles.css` (requires internet — standard for web hosting).

---

## 5. Business details currently on the site

- **Email:** info@veritascybersec.com
- **Phone:** 813.279.1957
- **Address:** 11705 Boyette Road, Suite 599, Riverview, FL 33579
- **LinkedIn:** https://www.linkedin.com/company/veritas-cyber-security
- **Scheduling link referenced:** calendly.com/veritascyber/30min

Update these in the page footers and on `contact.html` if anything changes. (A quick find-and-replace across the `.html` files is the fastest way.)

---

© Veritas Cyber Security. Built as a standalone static site.
