#!/usr/bin/env node
/*
 * One-shot importer for the Synel Knowledge Base into PocketBase (v0.23+ / tested format v0.39).
 * No npm install needed — uses Node 18+ built-in fetch.
 *
 * Usage:
 *   node import_to_pocketbase.mjs <ADMIN_EMAIL> <ADMIN_PASSWORD> [PB_URL]
 * Example:
 *   node import_to_pocketbase.mjs me@synel.com "mypassword"
 *   (defaults PB_URL to http://127.0.0.1:8090)
 *
 * It will: authenticate as superuser -> create the "articles" collection if missing
 * -> insert every record from articles_data.json. Safe to re-run: it skips records
 * whose uid already exists.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , EMAIL, PASSWORD, URL_ARG] = process.argv;
const PB = (URL_ARG || "http://127.0.0.1:8090").replace(/\/$/, "");
if (!EMAIL || !PASSWORD) {
  console.error("Usage: node import_to_pocketbase.mjs <ADMIN_EMAIL> <ADMIN_PASSWORD> [PB_URL]");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "articles_data.json");
const SCHEMA_FILE = path.join(__dirname, "articles_collection.json");

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(PB + pathname, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(PB + "/api/health");
      if (r.ok) return true;
    } catch (_) {}
    process.stdout.write(".");
    await sleep(2000);
  }
  return false;
}

(async () => {
  // 0) sanity
  if (!fs.existsSync(DATA_FILE)) { console.error("Missing " + DATA_FILE); process.exit(1); }
  const records = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, "utf8"));
  console.log(`PocketBase: ${PB}\nRecords to import: ${records.length}\n`);

  // 0.5) wait until the server is actually up (Fly machine may be cold-starting)
  process.stdout.write("Waiting for server");
  if (!(await waitForServer())) { console.error("\nServer not reachable — is the machine running? (fly machines list)"); process.exit(1); }
  console.log(" up");

  // 1) authenticate as superuser
  const auth = await api("/api/collections/_superusers/auth-with-password", {
    method: "POST",
    body: { identity: EMAIL, password: PASSWORD },
  });
  if (!auth.ok) { console.error("Auth failed:", auth.status, auth.json); process.exit(1); }
  const token = auth.json.token;
  console.log("✓ Authenticated as superuser");

  // 2) ensure collection exists
  const existing = await api("/api/collections/articles", { token });
  if (existing.ok) {
    console.log("✓ Collection 'articles' already exists — will add any missing records");
  } else {
    const created = await api("/api/collections", { method: "POST", token, body: schema });
    if (!created.ok) { console.error("Collection create failed:", created.status, JSON.stringify(created.json, null, 2)); process.exit(1); }
    console.log("✓ Created collection 'articles'");
  }

  // 3) find which uids already exist (so re-runs don't duplicate)
  const have = new Set();
  for (let page = 1; ; page++) {
    const r = await api(`/api/collections/articles/records?page=${page}&perPage=500&fields=uid`, { token });
    if (!r.ok) break;
    (r.json.items || []).forEach((it) => it.uid && have.add(it.uid));
    if (!r.json.items || page >= (r.json.totalPages || 1)) break;
  }
  if (have.size) console.log(`  (${have.size} records already present, will skip them)`);

  // 4) insert records
  let ok = 0, skip = 0, fail = 0;
  for (const rec of records) {
    if (rec.uid && have.has(rec.uid)) { skip++; continue; }
    const body = {
      uid: rec.uid,
      title: rec.title,
      category: rec.category,
      body_html: rec.body_html,
      product: rec.product || "",
      quality: rec.quality || "",
      also_covers: rec.also_covers || "",
      status: rec.status || "published",
    };
    let r, attempt = 0;
    while (true) {
      r = await api("/api/collections/articles/records", { method: "POST", token, body });
      if (r.ok) break;
      // already exists from a prior partial run -> treat as done
      if (r.status === 400 && JSON.stringify(r.json).includes("not_unique")) { r.ok = true; break; }
      if (++attempt >= 5) break;
      await sleep(2000); // transient (machine cold/restarting) -> wait and retry
    }
    if (r.ok) { ok++; if (ok % 50 === 0) console.log(`  ...${ok} inserted`); }
    else { fail++; if (fail <= 10) console.error("  ✗ failed:", rec.uid, r.status, JSON.stringify(r.json)); }
  }

  console.log(`\nDone. Inserted ${ok}, skipped ${skip}, failed ${fail}.`);
  console.log(`Public API check: ${PB}/api/collections/articles/records`);
  console.log(`Admin dashboard:  ${PB}/_/`);
})();
