# You Videomaker

You Videomaker is a small, model-agnostic project workspace for turning an ambiguous request into a reviewable decision package.

The model does the work that benefits from language and reasoning: understanding the request, extracting claims, comparing options, stating uncertainty, and proposing a sequence of actions. The repository keeps that work inspectable. Sources live beside the case, claims cite source IDs, and a deterministic checker rejects unsupported decisions before a report is rendered.

This follows the useful part of the `D:\ft` workflow: keep the source material and intermediate decisions in the repository, make the final artifact reproducible, and use automated gates for the parts a machine can check. It does not call a model API. A person or an agent can edit `case.json`, then run the local tools.

## Quick start

```powershell
npm test
node tools/check.js cases/demo
node tools/render.js cases/demo
Get-Content cases/demo/out/brief.md
```

Create a new case:

```powershell
node tools/new.js migration-plan --title "Migration plan" --question "How should the old system be migrated?"
```

Then add source notes under `cases/migration-plan/sources/`, fill `case.json`, run the checker, and render the brief. The checker is intentionally strict about IDs and citations, but it does not pretend to judge prose quality. That remains a GPT or human review step.

## Case layout

```text
cases/<slug>/
  case.json       # claims, options, decision, next steps, acceptance
  sources/        # one Markdown file per source
  out/            # generated report and machine-readable check result
```

The expected shape is documented in [`docs/schema.md`](docs/schema.md). The end-to-end workflow is in [`docs/workflow.md`](docs/workflow.md). [`AGENTS.md`](AGENTS.md) is the model entry point when an agent is asked to work on a case.

## Design principles

- Context is explicit: source notes and constraints are files, not hidden chat history.
- Claims are typed: supported facts, inferences, and open questions are kept separate.
- Decisions are reversible where possible: every recommendation has risks, conditions, next steps, and acceptance checks.
- Generation is deterministic: the same `case.json` and sources produce the same Markdown report.
- The model is allowed to be uncertain: an open claim is visible instead of being silently turned into a fact.
