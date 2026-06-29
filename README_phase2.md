# Synel KB - Phase 2: Line-by-line content review

Built on Phase 1's 619 unique articles. The 62 PII/needs-review items were left
out of this pass (per your instruction). The remaining **557** were reviewed.

## What happened
1. Dropped **30 thin stubs** (<12 words: "Coming Soon...", "TBD/TBC", one-liners).
2. Kept **6 French-market** entries -> new **"French (FR market)"** category (your call).
3. **527 articles read line-by-line** by reviewers. Verdicts:
   - **475 keep**
   - **28 merged** into a canonical article (near-identical / device-name-only variants)
   - **24 dropped** (placeholders, phantom-attachment-only, corrupted fragments, internal notes)
4. Re-categorised everything against the 14-category taxonomy.
5. Rebuilt HTML structure: **83 articles** had flattened numbered steps converted to
   proper `<ol>` ordered lists; the rest wrapped as clean paragraphs.

## FINAL: 475 published articles, fully categorised, HTML bodies.

## Files
| File | Purpose |
|---|---|
| `Synel_KB_Review.xlsx` | **Start here.** Every decision, with an override column. 5 tabs: Summary, All Reviewed (527), Final Published (475), Dropped, Merged away. |
| `kb_final_pocketbase.json` | The 475 final articles, HTML bodies, ready to import. |
| `kb_final_pocketbase.csv` | Same, CSV. |
| `pb_schema.json` | Updated PocketBase `articles` collection (incl. French category, `body_html` rich-text editor field, image upload). |

## On rich text / bullets
The `body_html` field is a PocketBase **editor (rich-text/HTML)** field, so bullets,
numbered lists, headings and bold all work. The source export had flattened all
formatting, so 83 step-by-step guides were auto-rebuilt as ordered lists; the other
~390 are clean paragraphs. The 82 "thin" articles (real but short) are flagged in the
workbook for editorial expansion later.

## Still to review by a human
- 82 "thin" articles flagged for expansion (kept, not blocking).
- Anything you override in the workbook's "YOUR OVERRIDE" column.
- The 62 PII-flagged items from Phase 1 (separate pass).

## Post-review consistency fixes (latest)
- **Brand normalised to "TimeLOG"** across all titles, body text and category names
  (was a mix of Timelog / TimelogWEB / Timelog Pro). 19 articles touched; 0 variants left.
- **Outbound URLs converted to real links** — 36 external URLs are now
  `<a href="..." target="_blank" rel="noopener noreferrer">` (open in new tab, secure).
  6 placeholder/example URLs (customername.synel-saas.com, xxx... etc.) left as plain text.
- NOTE for build phase: the Astro template must render `body_html` **raw** (not re-escaped)
  for these links and lists to display.

## Folder status
- `kb_dataset_phase2/` (this folder) = CURRENT deliverable.
- `kb_dataset_phase1/` = superseded, EXCEPT `_needs_review.csv` (the 62 PII-flagged
  articles still pending a separate pass).
