// Build-time data layer for the Synel Knowledge Base.
// Pulls published articles from PocketBase (PB_URL) at build time, and falls
// back to the bundled snapshot (src/data/articles.json) when PB_URL is unset
// or unreachable — so the site always builds.

import fallback from '../data/articles.json';

// Default to the live PocketBase so the build always pulls fresh data + images,
// even if PB_URL isn't wired into the CI/Vercel build env. Override via PB_URL.
const PB_URL = (import.meta.env.PB_URL || process.env.PB_URL || 'https://synel-kb-kimble.fly.dev').replace(/\/$/, '');

let _cache = null;

export async function getArticles() {
  if (_cache) return _cache;

  let rows = null;

  if (PB_URL) {
    try {
      const all = [];
      for (let page = 1; ; page++) {
        const url = `${PB_URL}/api/collections/articles/records`
          + `?perPage=500&page=${page}&filter=${encodeURIComponent("status='published'")}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`PocketBase ${res.status}`);
        const data = await res.json();
        all.push(...(data.items || []));
        if (page >= (data.totalPages || 1)) break;
      }
      rows = all;
      console.log(`[articles] loaded ${rows.length} from PocketBase (${PB_URL})`);
    } catch (err) {
      console.warn(`[articles] PocketBase fetch failed (${err.message}); using local fallback`);
    }
  }

  if (!rows) {
    rows = fallback;
    console.log(`[articles] using local fallback: ${rows.length} articles`);
  }

  _cache = rows
    .filter((r) => (r.status || 'published') === 'published')
    .map((r) => ({
      uid: r.uid,
      title: r.title,
      category: r.category,
      body_html: r.body_html || '',
      product: r.product || '',
      quality: r.quality || '',
      also_covers: r.also_covers || '',
      // uploaded images live in PocketBase's `images` file field -> build public URLs
      image_urls: (Array.isArray(r.images) ? r.images : [])
        .filter(Boolean)
        .map((f) => (PB_URL ? `${PB_URL}/api/files/articles/${r.id}/${f}` : f)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return _cache;
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const categorySlug = slugify;

export async function getCategories() {
  const arts = await getArticles();
  const map = new Map();
  for (const a of arts) {
    const slug = slugify(a.category);
    if (!map.has(slug)) map.set(slug, { name: a.category, slug, count: 0, articles: [] });
    const c = map.get(slug);
    c.count++;
    c.articles.push(a);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function stripHtml(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function excerpt(html, n = 180) {
  const t = stripHtml(html);
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
}

// Friendly icon per category (used on cards). Simple inline emoji-free SVG keys.
export const CATEGORY_META = {
  'Terminals & Devices': { hue: 'var(--c-navy)' },
  'Access Control': { hue: 'var(--c-coral)' },
  'Biometrics & Enrolment': { hue: 'var(--c-green)' },
  'Scheduling & Absence': { hue: 'var(--c-amber)' },
  'Integrations & Payroll Export': { hue: 'var(--c-navy)' },
  'Modules & Reporting': { hue: 'var(--c-coral)' },
  'Software - TimeLOG Web / Synergy WF': { hue: 'var(--c-green)' },
  'Software - TimeLOG Pro / Legacy': { hue: 'var(--c-amber)' },
  'EPOS & Cashless': { hue: 'var(--c-navy)' },
  'Account & Login': { hue: 'var(--c-coral)' },
  'Networking & Infrastructure': { hue: 'var(--c-green)' },
  'Training Material': { hue: 'var(--c-amber)' },
  'French Integrations': { hue: 'var(--c-navy)' },
  'General / Uncategorised': { hue: 'var(--c-muted)' },
};
