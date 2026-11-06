// On-demand endpoint called by Vercel Cron (see vercel.json) every 10 minutes.
// If PocketBase has any record newer than the live build, it POSTs the Vercel
// Deploy Hook so the site is rebuilt from the latest content. Safe to open in
// a browser: GET https://help.synel.co.uk/api/rebuild/ shows what it decided.
//
// Env vars (Vercel > synel-kb > Settings > Environment Variables):
//   VERCEL_DEPLOY_HOOK  required. The Deploy Hook URL (Settings > Git).
//   CRON_SECRET         optional. If set, only requests carrying
//                       "Authorization: Bearer <secret>" are accepted
//                       (Vercel Cron sends this header automatically).
export const prerender = false;

const PB_URL = 'https://synel-kb-kimble.fly.dev';

export async function GET({ request }) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });

  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return json({ error: 'unauthorized' }, 401);
  }

  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) {
    return json({ error: 'VERCEL_DEPLOY_HOOK is not set in Vercel environment variables' }, 500);
  }

  // 1. Newest change in PocketBase (any record, any status).
  let latest = null;
  try {
    const r = await fetch(`${PB_URL}/api/collections/articles/records?sort=-updated&perPage=1&fields=updated`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    latest = (await r.json()).items?.[0]?.updated || null;
  } catch (e) {
    return json({ action: 'skipped', reason: `PocketBase unreachable (${e.message})` });
  }

  // 2. What the live build was made from.
  let built = null;
  try {
    const r = await fetch(new URL('/build-info.json', request.url), { cache: 'no-store' });
    if (r.ok) built = await r.json();
  } catch {}
  const builtFrom = built?.latestUpdated || null;

  // 3. Rebuild if PocketBase is newer, or if the live build never saw PocketBase.
  const stale = !builtFrom || (latest && latest > builtFrom);
  if (!stale) {
    return json({ action: 'none', latest, builtFrom, builtAt: built?.builtAt || null });
  }

  const hr = await fetch(hook, { method: 'POST' });
  return json({
    action: 'rebuild-triggered',
    latest,
    builtFrom,
    builtAt: built?.builtAt || null,
    hookStatus: hr.status,
  });
}
