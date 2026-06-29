// Diagnose why article inserts fail. Usage:
//   node diag.mjs stewart@syneluk.com 'PASSWORD' https://synel-kb-kimble.fly.dev
const [, , EMAIL, PASSWORD, URL_ARG] = process.argv;
const PB = (URL_ARG || "http://127.0.0.1:8090").replace(/\/$/, "");
const fs = await import("node:fs");

async function api(path, opt = {}) {
  const res = await fetch(PB + path, {
    method: opt.method || "GET",
    headers: { "Content-Type": "application/json", ...(opt.token ? { Authorization: opt.token } : {}) },
    body: opt.body ? JSON.stringify(opt.body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

const auth = await api("/api/collections/_superusers/auth-with-password", {
  method: "POST", body: { identity: EMAIL, password: PASSWORD },
});
if (!auth.json.token) { console.log("AUTH FAILED:", auth.status, auth.json); process.exit(1); }
const token = auth.json.token;
console.log("✓ auth ok");

// 1. show the collection's actual fields
const col = await api("/api/collections/articles", { token });
console.log("\n=== articles fields ===");
const fields = (col.json.fields || col.json.schema || []);
for (const f of fields) {
  console.log(`  ${f.name}  type=${f.type}  required=${f.required}  ${f.values ? "values=" + JSON.stringify(f.values) : ""}`);
}

// 2. how many records already exist?
const cnt = await api("/api/collections/articles/records?perPage=1", { token });
console.log("\nexisting records:", cnt.json.totalItems);

// 3. try to create ONE real record and print the FULL error
const sample = JSON.parse(fs.readFileSync("articles_data.json", "utf8"))[0];
const body = {
  uid: sample.uid, title: sample.title, category: sample.category,
  body_html: sample.body_html, product: sample.product || "",
  quality: sample.quality || "", also_covers: sample.also_covers || "",
  status: sample.status || "published",
};
console.log("\n=== trying to create:", sample.uid, "| category:", JSON.stringify(sample.category), "| quality:", JSON.stringify(sample.quality), "===");
const cr = await api("/api/collections/articles/records", { method: "POST", token, body });
console.log("status:", cr.status);
console.log("response:", JSON.stringify(cr.json, null, 2));
