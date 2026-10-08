# You Videomaker Agent Entry

Read `README.md`, then `docs/workflow.md` and `docs/schema.md` before editing a case.

## Working rules

- Put every external fact or user-provided constraint in `cases/<slug>/sources/`.
- Give every claim a stable ID. A `supported` claim must cite at least one source ID. Mark model reasoning as `inference`; mark missing evidence as `open`.
- Do not hide uncertainty in confident prose. Put unresolved questions in `decision.open_questions`.
- Every chosen option needs a reason, a condition, a next step, and an acceptance check.
- Run `node tools/check.js cases/<slug>` after every meaningful edit, then `node tools/render.js cases/<slug>`.
- Do not edit generated files under `out/` by hand.

## Done means

The case checker passes, the rendered brief exists, all sources are present, and a human can trace the recommendation back to the source IDs and acceptance checks.
