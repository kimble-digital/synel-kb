/// <reference path="../pb_data/types.d.ts" />
//
// When a PUBLISHED article changes, tell GitHub to rebuild the public site.
// Sends a repository_dispatch ("pb-publish") which the GitHub Action picks up,
// pushes an empty commit, and Vercel auto-deploys. (Free — no Vercel Pro needed.)
//
// Set these as Fly secrets:
//   fly secrets set GITHUB_REPO="owner/synel-kb"
//   fly secrets set GITHUB_TOKEN="github_pat_xxx"   (fine-grained, Contents: write)
//
// Fully guarded so a hook error can NEVER block a save; e.next() always runs.

function notify(e) {
  try {
    const rec = e.record;
    if (rec && rec.get("status") === "published") {
      let token = "", repo = "";
      try { token = $os.getenv("GITHUB_TOKEN") || ""; } catch (_) {}
      try { repo = $os.getenv("GITHUB_REPO") || ""; } catch (_) {}
      if (token && repo) {
        try {
          $http.send({
            url: "https://api.github.com/repos/" + repo + "/dispatches",
            method: "POST",
            headers: {
              "Authorization": "Bearer " + token,
              "Accept": "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "synel-kb-pocketbase",
            },
            body: JSON.stringify({ event_type: "pb-publish" }),
            timeout: 15,
          });
          $app.logger().info("Triggered site rebuild via GitHub dispatch");
        } catch (_) {}
      }
    }
  } catch (_) {}
  e.next();
}

onRecordAfterCreateSuccess((e) => { notify(e); }, "articles");
onRecordAfterUpdateSuccess((e) => { notify(e); }, "articles");
onRecordAfterDeleteSuccess((e) => { notify(e); }, "articles");
