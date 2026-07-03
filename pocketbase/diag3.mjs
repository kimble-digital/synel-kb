// Diagnose "failed to update record". Usage:
//   node diag3.mjs stewart@syneluk.com 'PASSWORD' https://synel-kb-kimble.fly.dev
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
const token = auth.json.token;
if (!token) { console.log("AUTH FAILED", auth.json); process.exit(1); }

// grab one record
const list = await api("/api/collections/articles/records?perPage=1", { token });
const rec = list.json.items[0];
console.log("editing:", rec.uid, "| current title:", rec.title);

// try a trivial update
const t0 = Date.now();
const upd = await api("/api/collections/articles/records/" + rec.id, { method: "PATCH", token, body: { title: rec.title } });
console.log("update status:", upd.status, "| took", Date.now() - t0, "ms");
console.log("response:", JSON.stringify(upd.json).slice(0, 600));

// did it actually persist? re-fetch
const again = await api("/api/collections/articles/records/" + rec.id, { token });
console.log("record still readable:", again.status === 200, "| updated field:", again.json.updated);
