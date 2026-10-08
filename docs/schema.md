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
