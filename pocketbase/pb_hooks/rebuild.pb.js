// Intentionally empty.
//
// Site rebuilds are handled by a SCHEDULED GitHub Action that polls this
// PocketBase API for changes — see .github/workflows/rebuild.yml in the
// synel-kb repo. We deliberately do NOT use PocketBase record hooks here,
// because an after-save hook error on this PocketBase build surfaces as a
// "Failed to update record" message in the editor even though the save
// succeeded. Keeping this file empty guarantees editing always works.
