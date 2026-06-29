// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Static knowledge base, deployed to Vercel.
// Data is pulled at BUILD time from PocketBase (PB_URL) with a local fallback.
export default defineConfig({
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'always',
});
