# Veritas Cyber Security — Website

A complete marketing website. The pages are plain **HTML + one CSS file + one JavaScript file** — no build step, no frameworks. The contact form uses a single small **PHP** file (`contact.php`) to send leads through your mail server's SMTP relay. It runs on any standard PHP-capable web host (Hostinger Web Hosting included).

---

## 1. What's in this package

```
veritas-website/
├── index.html        → Home (3D WebGL hero)
├── index-classic.html→ Home (non-3D fallback version — optional)
├── services.html     → Services (all 9 offerings + partner network)
├── about.html        → About Manny Engel
├── industries.html   → Industries We Serve
├── contact.html      → Contact / lead form
├── privacy.html      → Privacy Policy
├── contact.php       → Server-side form handler (sends via SMTP relay)
├── config.secret.example.php → Template for SMTP credentials (copy to config.secret.php on server)
├── .gitignore        → Keeps config.secret.php (your live credentials) out of git
├── styles.css        → Base styling (shared by every page)
├── styles-3d.css     → 3D layer styling (WebGL hero, tilt cards, depth)
├── script.js         → Core interactivity (nav, form, reveals)
├── scene.js          → WebGL 3D scene (Three.js — shield + particle field)
├── interactions-3d.js→ 3D card tilt + scene boot + hero parallax
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

## 3. The contact form (server-side — sends via SMTP relay)

The "Request a consult" form on **contact.html** submits over AJAX (no page reload) to **`contact.php`**, which validates the data server-side and sends it to **info@veritascybersec.com** through an **authenticated SMTP relay**. The lead lands in the inbox whether or not the visitor has an email client installed. On success the visitor sees a "Request received" confirmation; if the server is ever unreachable, the form shows an inline fallback (direct email link + phone) so a lead is never lost.

> **This requires PHP**, which Hostinger Web Hosting provides by default. The form will NOT send on a pure static host (Netlify/Cloudflare Pages/S3) without adapting the endpoint — see "Non-PHP hosts" below.

### 3a. One-time setup (do this on the server)

**Step 1 — Create a sending mailbox.**
In Hostinger → **Emails → Email Accounts**, create a mailbox such as `noreply@veritascybersec.com` (or use an existing one). Note its **password**. Using a real mailbox on your own domain as the "From" address is what makes messages pass SPF/DKIM and land in the inbox rather than spam. The visitor's address is set as **Reply-To**, so hitting "reply" answers the lead directly.

**Step 2 — Put your SMTP credentials in `config.secret.php` (NOT in git).**
Credentials live in a separate, git-ignored file so a future `git push` / deploy can **never** overwrite them and silently break email. On the **server**, one time:
```bash
cp config.secret.example.php config.secret.php
```
Then edit `config.secret.php` and set your real `smtp_pass` (and `smtp_user` / `from` if they differ). `contact.php` automatically merges these over its defaults. Because `config.secret.php` is in `.gitignore`, it stays put across every deploy. The non-secret defaults (to/from address, SMTP host, port) live in the `$CONFIG` block at the top of `contact.php`.

> **This is the key to "will pushing to my server break email?" → No.** As long as `config.secret.php` exists on the server (created once, never tracked by git), email keeps working through every future push.

**Step 3 — Add the PHPMailer library** (gives you authenticated SMTP; strongly recommended).
- **Easiest (Composer):** in the site folder run `composer require phpmailer/phpmailer`. This creates a `vendor/` folder — upload it alongside `contact.php`. Done.
- **No Composer:** download PHPMailer from https://github.com/PHPMailer/PHPMailer, and upload its `src/` folder to `public_html/PHPMailer/src/` (so `PHPMailer/src/PHPMailer.php` exists). `contact.php` auto-detects either location.
- **Fallback:** if neither is present, `contact.php` automatically falls back to PHP's built-in `mail()`. It often works on Hostinger, but authenticated SMTP (above) is more reliable and has better deliverability — set it up if you can.

**Step 4 — Test.** Submit the form on the live site and confirm the email arrives at `info@veritascybersec.com`. If it doesn't: double-check the mailbox password, try port `587` with `'smtp_secure' => 'tls'`, and make sure `info@` isn't filtering it to spam.

### 3b. Files involved
- `contact.php` — the handler (edit the `$CONFIG` block).
- `contact.html` — the form posts to `contact.php` (see the `action="contact.php"` attribute).
- `script.js` — handles the AJAX submit, loading spinner, success + fallback states (the `#lead-form` block).
- A hidden "honeypot" field silently blocks spam bots — leave it as-is.

### 3c. Non-PHP hosts
If you ever move to a static-only host, point the form at a hosted form service instead: change `action="contact.php"` in `contact.html` to your endpoint URL (e.g. Formspree / Web3Forms). The existing JS already POSTs the form data and expects a JSON `{ "ok": true }` response, so most services work with no other changes.

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

## 6. The 3D layer (WebGL)

The homepage hero features a real-time 3D Veritas shield with a particle field, and cards across the site have subtle mouse-reactive 3D tilt.

- **Library:** Three.js r128, loaded from CDN (`<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js">`). Needs internet — standard for any hosted site. To self-host, download that file and point the tag at a local copy.
- **Files:** `scene.js` (the 3D scene), `interactions-3d.js` (boot + tilt + parallax), `styles-3d.css` (layout/canvas styling).
- **Graceful degradation:** if WebGL is unavailable (very old device, GPU disabled), the hero automatically falls back to a styled static gradient — no blank screen. Animations also respect "reduce motion" OS settings.
- **Performance:** the render loop pauses when the tab is hidden, caps pixel ratio, and auto-frames the shield to any screen size (desktop, tablet, mobile portrait).
- **Prefer the non-3D version?** `index-classic.html` is the earlier, lighter homepage with no WebGL. To use it instead, rename it to `index.html` (and rename the 3D one to keep a copy).

---

© Veritas Cyber Security. Built as a standalone static site.
