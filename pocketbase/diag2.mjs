// Isolate the insert failure. Usage:
//   node diag2.mjs stewart@syneluk.com 'PASSWORD' https://synel-kb-kimble.fly.dev
const [, , EMAIL, PASSWORD, URL_ARG] = process.argv;
const PB = (URL_ARG || "http://127.0.0.1:8090").replace(/\/$/, "");
const fs = await import("node:fs");
async function api(path, opt = {}) {
  const res = await fetch(PB + path, { method: opt.method || "GET",
    headers: { "Content-Type": "application/json", ...(opt.token ? { Authorization: opt.token } : {}) },
    body: opt.body ? JSON.stringify(opt.body) : undefined });
  const t = await res.text(); let j; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  return { status: res.status, json: j };
}
const auth = await api("/api/collections/_superusers/auth-with-password", { method: "POST", body: { identity: EMAIL, password: PASSWORD } });
const token = auth.json.token;
const all = JSON.parse(fs.readFileSync("articles_data.json", "utf8"));
const k46 = all.find(a => a.uid === "KB0046");

// 1. does KB0046 already exist?
const ex = await api("/api/collections/articles/records?filter=" + encodeURIComponent("uid='KB0046'"), { token });
console.log("KB0046 already in DB?", ex.json.totalItems, ex.json.totalItems ? "(so the 400 was a UID collision / false failure)" : "");

// 2. brand-new uid, FULL body of KB0046
let r = await api("/api/collections/articles/records", { method: "POST", token,
  body: { uid: "ZTEST001", title: k46.title, category: k46.category, body_html: k46.body_html, status: "published", quality: k46.quality, product: k46.product||"", also_covers: k46.also_covers||"" } });
console.log("new uid + KB0046 full body ->", r.status, r.status===400 ? JSON.stringify(r.json) : "OK (body is fine)");

// 3. brand-new uid, minimal body
let r2 = await api("/api/collections/articles/records", { method: "POST", token,
  body: { uid: "ZTEST002", title: "t", category: k46.category, body_html: "<p>hello</p>", status: "published" } });
console.log("new uid + minimal body  ->", r2.status, r2.status===400 ? JSON.stringify(r2.json) : "OK");

// cleanup test records
for (const u of ["ZTEST001","ZTEST002"]) {
  const f = await api("/api/collections/articles/records?filter=" + encodeURIComponent(`uid='${u}'`), { token });
  if (f.json.items && f.json.items[0]) await api("/api/collections/articles/records/" + f.json.items[0].id, { method: "DELETE", token });
}
console.log("(cleaned up test records)");
