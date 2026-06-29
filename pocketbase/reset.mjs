// Delete the articles collection (and all its records) so it can be re-imported clean.
//   node reset.mjs stewart@syneluk.com 'PASSWORD' https://synel-kb-kimble.fly.dev
const [, , EMAIL, PASSWORD, URL_ARG] = process.argv;
const PB = (URL_ARG || "http://127.0.0.1:8090").replace(/\/$/, "");
async function api(p, o = {}) {
  const r = await fetch(PB + p, { method: o.method || "GET",
    headers: { "Content-Type": "application/json", ...(o.token ? { Authorization: o.token } : {}) },
    body: o.body ? JSON.stringify(o.body) : undefined });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  return { status: r.status, json: j };
}
const auth = await api("/api/collections/_superusers/auth-with-password", { method: "POST", body: { identity: EMAIL, password: PASSWORD } });
if (!auth.json.token) { console.log("AUTH FAILED:", auth.json); process.exit(1); }
const del = await api("/api/collections/articles", { method: "DELETE", token: auth.json.token });
console.log(del.status === 204 ? "✓ deleted 'articles' collection (now re-run the importer)" : "delete result: " + del.status + " " + JSON.stringify(del.json));
