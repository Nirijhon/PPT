# SlideCraft Studio

A lightweight, brand-first **sermon slide builder**. Pick a template, add Title /
Point / Verse / Message slides, preview them live, then export a print-ready
PDF. Everything runs in the browser — no backend and **no build step**.

## Tech stack

- **UI** — [Tailwind CSS](https://tailwindcss.com) via the CDN build
- **Documents** — PptxGenJS (PowerPoint) + html2canvas / jsPDF (PDF)
- **Icons** — Font Awesome 6
- Pure static HTML + a single client module (`js/app.js`)

Because all dependencies ship from CDNs, the site is a flat static folder and
deploys anywhere — including **Netlify with zero configuration**.

## Project map

| Path | Purpose |
| --- | --- |
| `index.html` | App shell, Tailwind CDN, modal UI, live preview |
| `js/app.js` | All logic: templates, slide queue, previews, exports |
| `components/*.html` | Reference slide templates (Title / Point / Verse) |
| `serve.js` | Tiny local static server for development |
| `netlify.toml` | Netlify deploy config (publish dir + headers/redirects) |
| `404.html` | Themed "page not found" page |

## Local development

```bash
# 1. Serve the folder over http (required: the browser blocks fetch/inlined
#    module access on file://, and container-query previews need a real host)
node serve.js        # http://localhost:8899

# OR with any static server
npx serve .          # http://localhost:3000
```

Open the URL, build a presentation, and hit **Download PDF**.

> `serve.js` is only a convenience for local work. It is **not** used by Netlify.

## Deploying to Netlify

This is a **zero-build static site**, so Netlify simply serves the repository
root.

### Option A — Drag & drop (fastest)

1. Zip the whole project folder.
2. Drag it onto the **Netlify Drop** area (https://app.netlify.com/drop).

### Option B — Git (recommended)

1. Commit the repo (this folder) to GitHub / GitLab / Bitbucket.
2. In Netlify: **New site from Git** → pick the repo.
3. Build settings:
   - **Build command**: _leave blank_ (no build needed)
   - **Publish directory**: `.` (the repo root)
4. Click **Deploy site**. Netlify will pick up `netlify.toml` automatically.

`netlify.toml` already configures:
- `publish = "."` with an empty build command
- a catch-all redirect (`/* → /index.html`, status 200) so the SPA resolves on refresh
- security headers on every route
- long cache-control for `/js/*` and `/components/*`

## Production notes / future optimizations

- The Tailwind CDN build is convenient but compiles in the browser on first load.
  For a faster production build, migrate to a local Tailwind build
  (`npm i -D tailwindcss postcss autoprefixer`, add `tailwind.config.js`,
  run `npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify`,
  then set `command`/`publish` in `netlify.toml` accordingly). Not required to
  deploy, only for performance.
- Cache-bust `js/app.js` by appending a version query (`?v=1.0.0`) when you ship
  a change — the `/js/*` headers are `immutable`.

## License

MIT
