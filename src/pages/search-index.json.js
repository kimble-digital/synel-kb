// Build-time endpoint -> emits /search-index.json for the client-side search.
import { getArticles, categorySlug, stripHtml, excerpt } from '../lib/articles.js';

export async function GET() {
  const arts = await getArticles();
  const index = arts.map((a) => ({
    uid: a.uid,
    title: a.title,
    category: a.category,
    url: `/article/${a.uid}/`,
    catUrl: `/category/${categorySlug(a.category)}/`,
    excerpt: excerpt(a.body_html, 160),
    text: stripHtml(a.body_html).slice(0, 1200),
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
