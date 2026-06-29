# Synel Knowledge Base (Astro + PocketBase → Vercel)

Public, searchable knowledge base. Forked from the Synel France design system
(same fonts, palette, header/footer). Static site built with Astro, data pulled
from PocketBase at **build time**, deployed to Vercel.

## How it fits together

```
Editors ──login──▶ PocketBase (Fly.io/VPS, public URL)   ← the editable database
                        │
                        │  (build time fetch of published articles)
                        ▼
                 Astro build  ──▶  static HTML + /search-index.json
                        │
                        ▼
                     Vercel (free static hosting)  ──▶  public site
```

- Editors log into the PocketBase dashboard from their own machine and edit articles.
- When they publish, a **Vercel Deploy Hook** rebuilds the site (~1–2 min) so changes go live.
- Search is 100% client-side (Fuse.js over `/search-index.json`) — instant, free, no server.

## Run locally

```bash
npm install
npm run dev      # http://localhost:4321
```

By default it builds from the bundled snapshot `src/data/articles.json` (475 articles),
so it works even before PocketBase is hosted.

To build against live PocketBase, set `PB_URL` (copy `.env.example` → `.env`):

```bash
PB_URL=https://your-pocketbase-host npm run build
```

The loader fetches only `status = 'published'` records, and silently falls back to the
local snapshot if PocketBase is unreachable, so a build never fails on a network blip.

## Project structure

```
src/
  lib/articles.js            data layer (PocketBase + fallback) + helpers
  data/articles.json         bundled 475-article snapshot (fallback / first build)
  layouts/BaseLayout.astro   <head>, Header, Footer
  components/Header.astro     Footer.astro  (Synel design system)
  pages/
    index.astro              home: hero + instant search + category grid
    category/[slug].astro     one page per category
    article/[uid].astro       one page per article (renders body_html in .prose)
    support.astro             support / contact page
    search-index.json.js      build-time endpoint → /search-index.json
  styles/global.css          Synel tokens (navy/coral, DM Sans/Work Sans) + KB components
```

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab).
2. In Vercel: **New Project → import the repo**. Framework preset: **Astro** (auto-detected).
3. Add env var **`PB_URL`** = your PocketBase URL (once hosted).
4. Deploy. Vercel runs `npm run build` and serves the static output.

### Auto-rebuild when an editor publishes
1. Vercel → Project → Settings → **Git → Deploy Hooks** → create one, e.g. "pb-publish".
   You get a URL like `https://api.vercel.com/v1/integrations/deploy/xxx`.
2. In PocketBase, add a hook so saving a published article pings that URL. Example
   `pb_hooks/rebuild.pb.js`:
   ```js
   onRecordAfterUpdateSuccess((e) => {
     if (e.record.get('status') === 'published') {
       $http.send({ url: 'PASTE_VERCEL_DEPLOY_HOOK_URL', method: 'POST' });
     }
     e.next();
   }, 'articles');
   onRecordAfterCreateSuccess((e) => {
     if (e.record.get('status') === 'published') {
       $http.send({ url: 'PASTE_VERCEL_DEPLOY_HOOK_URL', method: 'POST' });
     }
     e.next();
   }, 'articles');
   ```

## TODO before launch
- Confirm real support email / phone on `src/pages/support.astro` (placeholder right now).
- Drop a favicon + logo into `public/images/` (Header uses a text logo for now).
- Host PocketBase (Fly.io/VPS) and set `PB_URL`.
- Set up restricted "editor" accounts in PocketBase (not full superusers) for the client.
- Optional: add `site:` to `astro.config.mjs` for absolute canonical URLs.
