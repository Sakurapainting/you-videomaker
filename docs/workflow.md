# Workflow

You Videomaker separates synthesis from verification. The model can read a large context and propose a coherent plan; the repository tools make the proposal traceable and repeatable.

1. Create a case with `node tools/new.js <slug> --title "..." --question "..."`.
2. Write source notes as Markdown files in `cases/<slug>/sources/`. Keep one source or experiment per file and record its date or version when relevant.
3. Ask the model to fill `case.json`. The useful prompt is: “Read the case sources. Extract claims, label each as supported, inference, or open, compare at least two options, and choose one only when its evidence and conditions are explicit.”
4. Run `node tools/check.js cases/<slug>`. Fix every error. Warnings are unresolved questions that should stay visible for review.
5. Run `node tools/render.js cases/<slug>`. The generated `out/brief.md` is the handoff artifact.
6. Review the brief as a human. Check that the recommendation is proportionate to the evidence and that the acceptance checks can actually falsify it.
7. When the decision changes, edit the source or case file, rerun the checker, and render again. Do not patch the generated report.

The model's advantage is used where it matters: compressing context, spotting dependencies, proposing alternatives, and writing a usable sequence. The repository handles identity, citations, consistency, and reproducibility.
