# Case Schema

Each case is a UTF-8 JSON file with these fields:

```json
{
  "slug": "demo",
  "title": "A short title",
  "question": "The decision to make",
  "audience": "Who will use the brief",
  "sources": [
    { "id": "s1", "title": "Interview notes", "file": "interview.md", "kind": "primary" }
  ],
  "claims": [
    { "id": "c1", "text": "A verifiable statement", "status": "supported", "sources": ["s1"] },
    { "id": "c2", "text": "A model conclusion", "status": "inference", "sources": ["s1"] },
    { "id": "c3", "text": "Something still unknown", "status": "open", "sources": [] }
  ],
  "options": [
    {
      "id": "a",
      "name": "Option A",
      "benefits": ["..."],
      "costs": ["..."],
      "risks": ["..."],
      "evidence": ["c1"],
      "score": 3
    }
  ],
  "decision": {
    "choice": "a",
    "why": ["c1", "c2"],
    "conditions": ["..."],
    "next_steps": ["..."],
    "acceptance": ["..."],
    "open_questions": ["c3"]
  }
}
```

`status` must be `supported`, `inference`, or `open`. Source and claim IDs are case-local and must be unique. A source path may contain subdirectories but must remain inside the case's `sources/` directory.

## Video production

A case becomes a video project when it also contains a `video` object:

```json
{
  "video": {
    "format": { "width": 1080, "height": 1920, "fps": 30, "duration": 10 },
    "theme": { "background": "#101c19", "ink": "#f3f7f4", "accent": "#13c89a", "muted": "#9bb2aa" },
    "voice": { "voice": "zh-CN-YunyangNeural", "rate": "+0%", "text": "旁白全文" },
    "scenes": [
      { "id": "hook", "from": 0, "to": 1.5, "kind": "hook", "title": "标题", "body": "开场" }
    ]
  }
}
```

Scenes must cover the duration continuously. Supported scene kinds are `hook`, `conversation`, and `cta`. Run `node tools/video.js cases/<slug> --srt` to generate the brief, HTML animation, silent video, voice track, final MP4, SRT, and `video-check.json` in the case's `out/` directory. The renderer uses Chrome and FFmpeg; set `VIDEOMAKER_CHROME`, `VIDEOMAKER_FFMPEG`, `VIDEOMAKER_FFPROBE`, or `VIDEOMAKER_PYTHON` when they are not discoverable. Install Python `edge-tts` for narration; it needs network access to synthesize the voice, while no large-language-model API is used.
