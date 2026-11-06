// Static file baked at build time: when this build was made and the newest
// PocketBase `updated` timestamp it contains. Read by /api/rebuild to decide
// whether a rebuild is needed.
import { getArticles, getLatestUpdated } from '../lib/articles.js';

export async function GET() {
  const articles = await getArticles();
  return new Response(
    JSON.stringify({
      builtAt: new Date().toISOString(),
      latestUpdated: getLatestUpdated(),
      articleCount: articles.length,
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
