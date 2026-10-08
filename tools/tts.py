import asyncio
import os
import sys

import edge_tts


async def main():
    text = os.environ["VIDEOMAKER_TTS_TEXT"]
    voice = os.environ.get("VIDEOMAKER_TTS_VOICE", "zh-CN-YunyangNeural")
    rate = os.environ.get("VIDEOMAKER_TTS_RATE", "+0%")
    output = os.environ["VIDEOMAKER_TTS_OUTPUT"]
    await edge_tts.Communicate(text, voice, rate=rate).save(output)


try:
    asyncio.run(main())
except Exception as exc:
    print(f"TTS failed: {exc}", file=sys.stderr)
    raise
