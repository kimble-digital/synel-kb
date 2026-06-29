# Hosting PocketBase on Fly.io + giving your client edit access + auto-updates

This is the editable backend. Once live, your client logs in from any browser and
edits articles; publishing triggers an automatic site rebuild.

Everything you need is in this `pocketbase/` folder:
`Dockerfile`, `fly.toml`, `pb_hooks/` (auto-rebuild), `articles_collection.json`
(the table schema), `articles_data.json` (the 475 articles), `import_to_pocketbase.mjs`.

## Prerequisites
- A Fly.io account (free to start) and the `flyctl` CLI: https://fly.io/docs/flyctl/install/
- Node 18+ (you already have it).

## 1. Deploy PocketBase to Fly.io
From this `pocketbase/` folder:

```bash
fly launch --no-deploy        # pick a unique app name; it reads fly.toml
fly volumes create pb_data --size 1 --region lhr   # 1 GB persistent disk
fly deploy
```

Your backend is now at `https://<your-app>.fly.dev`.
- Dashboard: `https://<your-app>.fly.dev/_/`
- API:       `https://<your-app>.fly.dev/api/`

## 2. Create the first admin + load the 475 articles
```bash
fly ssh console -C "/pb/pocketbase superuser create you@synel.co.uk 'a-strong-password'"
```
Then from this `pocketbase/` folder, point the importer at the live URL:
```bash
node import_to_pocketbase.mjs you@synel.co.uk "a-strong-password" https://<your-app>.fly.dev
```
This creates the `articles` collection and inserts all records.

## 3. Give your client edit access
The PocketBase dashboard (`/_/`) is for superusers. Create one per editor:
```bash
fly ssh console -C "/pb/pocketbase superuser create client@theircompany.com 'their-password'"
```
Send them the dashboard URL + their login. They edit under **Collections → articles**:
rich-text body, images, set `status` to `published`/`draft`.

> Want them restricted to *only* articles (not the whole backend)? That needs a small
> custom editor page instead of the built-in dashboard — tell me and I'll build it.

## 4. Point the website at PocketBase
In Vercel → your KB project → Settings → Environment Variables:
```
PB_URL = https://<your-app>.fly.dev
```
Redeploy. The site now builds from live PocketBase data (falls back to the bundled
snapshot if PocketBase is ever unreachable, so builds never fail).

## 5. Auto-update on publish
1. Vercel → Project → Settings → Git → **Deploy Hooks** → create one (e.g. "pb-publish").
   Copy the URL.
2. Give it to PocketBase as a secret:
   ```bash
   fly secrets set VERCEL_DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/xxxxx"
   ```
   (`pb_hooks/rebuild.pb.js` is already deployed and will POST to it whenever a
   `published` article is created, updated, or deleted.)

Now: client edits → saves → PocketBase pings the hook → Vercel rebuilds → live in ~1–2 min.

## Costs
A single shared-cpu-1x / 256 MB machine + 1 GB volume sits in Fly's low-cost tier
(often a few £/month or less). The Vercel static hosting is free.
