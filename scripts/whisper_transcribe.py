#!/usr/bin/env python3
"""
Whisper transcription script for Komic Freaks Studio.
Transcribes audio and optionally translates to English.

Usage:
  python whisper_transcribe.py <input.wav> <output.json> [--translate]

Output JSON format:
{
  "language": "ja",
  "segments": [
    { "start": 0.0, "end": 2.5, "text": "..." },
    ...
  ],
  "translation": [  // only if --translate
    { "start": 0.0, "end": 2.5, "text": "..." },
    ...
  ]
}
"""

import sys
import json
import whisper

def main():
    if len(sys.argv) < 3:
        print("Usage: whisper_transcribe.py <input.wav> <output.json> [--translate]", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    do_translate = "--translate" in sys.argv

    # Use 'base' model — good balance of speed vs accuracy
    # 'tiny' = fastest, 'small' = better, 'medium' = best for non-English
    model_name = "base"
    print(f"[whisper] Loading model: {model_name}", file=sys.stderr)
    model = whisper.load_model(model_name)

    # Step 1: Transcribe in original language
    print(f"[whisper] Transcribing: {input_path}", file=sys.stderr)
    result = model.transcribe(input_path, verbose=False)

    language = result.get("language", "en")
    print(f"[whisper] Detected language: {language}", file=sys.stderr)

    segments = []
    for seg in result["segments"]:
        segments.append({
            "start": round(seg["start"], 2),
            "end": round(seg["end"], 2),
            "text": seg["text"].strip(),
        })

    output = {
        "language": language,
        "segments": segments,
    }

    # Step 2: Translate to English if requested and not already English
    if do_translate and language != "en":
        print(f"[whisper] Translating to English...", file=sys.stderr)
        translate_result = model.transcribe(input_path, task="translate", verbose=False)

        translation = []
        for seg in translate_result["segments"]:
            translation.append({
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
                "text": seg["text"].strip(),
            })

        output["translation"] = translation
        print(f"[whisper] ✅ Translation complete: {len(translation)} segments", file=sys.stderr)

    print(f"[whisper] ✅ Transcription complete: {len(segments)} segments", file=sys.stderr)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # Also print to stdout for piping
    print(json.dumps(output, ensure_ascii=False))

if __name__ == "__main__":
    main()
