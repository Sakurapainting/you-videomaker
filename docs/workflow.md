# Workflow

You Videomaker separates synthesis from verification. The model can read a large context and propose a coherent plan; the repository tools make the proposal traceable and repeatable.

1. Create a case with `node tools/new.js <slug> --title "..." --question "..."`.
2. Write source notes as Markdown files in `cases/<slug>/sources/`. Keep one source or experiment per file and record its date or version when relevant.
3. Ask the model to fill `case.json`. The useful prompt is: “Read the case sources. Extract claims, label each as supported, inference, or open, compare at least two options, and choose one only when its evidence and conditions are explicit.”
4. Run `node tools/check.js cases/<slug>`. Fix every error. Warnings are unresolved questions that should stay visible for review.
5. Run `node tools/render.js cases/<slug>`. The generated `out/brief.md` is the handoff artifact.
6. Review the brief as a human. Check that the recommendation is proportionate to the evidence and that the acceptance checks can actually falsify it.
7. When the decision changes, edit the source or case file, rerun the checker, and render again. Do not patch the generated report.

## Video production

Add a `video` object to a case when the reviewed decision should become a short video. The video producer runs the whole local pipeline:

1. Validate the case and write the brief and normalized video plan.
2. Render the HTML scenes in Chrome as PNG frames.
3. Encode the frames into a silent H.264 MP4 with FFmpeg.
4. Generate local narration with Python and `edge-tts`.
5. Mux narration and video, optionally write an SRT subtitle file, and run FFprobe checks for duration and resolution.

Run it with:

```powershell
node tools/video.js cases/<slug> --srt
```

The producer writes the final MP4 and intermediate files under `cases/<slug>/out/`. Generated output is ignored by Git so each checkout can rebuild it from the case definition and source notes.

The model's advantage is used where it matters: compressing context, spotting dependencies, proposing alternatives, and writing a usable sequence. The repository handles identity, citations, consistency, and reproducibility.
