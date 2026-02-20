"""
Whisper transcription script for MakeScript.
Takes a video/audio file path and outputs JSON with timestamped segments.
Includes hallucination detection: filters out segments with high no_speech_prob
and detects repetitive hallucinated text.
Usage: python transcribe.py <input_file> [model_size]
"""

import sys
import json
import os
import io
import re
import contextlib
import subprocess
import warnings
from collections import Counter

# Suppress tqdm progress bars (they pollute stderr and cause Node.js to treat exit as failure)
os.environ["TQDM_DISABLE"] = "1"

# Suppress FP16 warning from whisper (not supported on CPU, falls back to FP32 automatically)
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU")

# Set stdout to use utf-8 to avoid encoding errors
sys.stdout.reconfigure(encoding='utf-8')


def check_ffmpeg():
    """Check if ffmpeg is available in the system path."""
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        return True
    except FileNotFoundError:
        return False


def has_audio_stream(file_path: str) -> bool:
    """Check if the file has an audio stream using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-select_streams", "a",
             "-show_entries", "stream=codec_type", "-of", "json", file_path],
            capture_output=True, text=True, timeout=30
        )
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        return len(streams) > 0
    except Exception:
        # If ffprobe fails, let Whisper try anyway
        return True


def is_hallucinated(text: str) -> bool:
    """Detect common Whisper hallucination patterns."""
    t = text.strip().lower()

    # Common Whisper hallucination phrases
    hallucination_phrases = [
        "thank you for watching",
        "thanks for watching",
        "please subscribe",
        "like and subscribe",
        "click the bell",
        "see you in the next",
        "don't forget to subscribe",
        "please like and subscribe",
        "thank you so much for watching",
        "i'll see you in the next video",
        "bye bye",
        "subtitles by",
        "translated by",
        "amara.org",
        "www.",
        "http",
    ]
    for phrase in hallucination_phrases:
        if phrase in t:
            return True

    # Single word or very short repeated content
    if len(t) < 3:
        return True

    # Check for repeated characters/words (e.g., "you you you you")
    words = t.split()
    if len(words) >= 3:
        unique_words = set(words)
        if len(unique_words) == 1:
            return True

    return False


def detect_repetition(segments: list) -> set:
    """Detect segments that are repetitive hallucinations.
    Returns set of segment indices to remove."""
    texts = [s["text"].strip().lower() for s in segments]
    text_counts = Counter(texts)
    bad_indices = set()

    for i, text in enumerate(texts):
        # If same exact text appears 3+ times, it's likely hallucination
        if text_counts[text] >= 3:
            bad_indices.add(i)

    return bad_indices


def transcribe(file_path: str, model_name: str = "base") -> dict:
    """Transcribe a video/audio file using OpenAI Whisper with hallucination filtering."""
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}", "segments": []}

    if not check_ffmpeg():
        return {"error": "FFmpeg not found. Please install FFmpeg and add it to your PATH.", "segments": []}

    # Pre-check: does the file have an audio stream?
    if not has_audio_stream(file_path):
        return {
            "error": "no_audio_stream",
            "segments": [],
            "message": "This video has no audio track. Transcription requires audio."
        }

    try:
        import whisper

        # Suppress all stdout from whisper (it prints "Detected language: ...")
        # We only want our JSON output on stdout
        with contextlib.redirect_stdout(io.StringIO()):
            model = whisper.load_model(model_name)
            result = model.transcribe(
                file_path,
                verbose=False,
                word_timestamps=False,
                condition_on_previous_text=False,  # Prevents cascade hallucinations / early stopping
            )

        raw_segments = result.get("segments", [])
        total_raw = len(raw_segments)

        # Log audio coverage info to stderr for debugging
        if raw_segments:
            last_end = max(s.get("end", 0) for s in raw_segments)
            print(f"[Whisper] Raw: {total_raw} segments, audio covered: {last_end:.1f}s, language: {result.get('language', '?')}", file=sys.stderr)

        # Build segments with hallucination filtering
        segments = []
        speech_probs = []
        filtered_reasons = {"no_speech": 0, "hallucination": 0, "empty": 0, "repetition": 0}
        for i, seg in enumerate(raw_segments):
            no_speech_prob = seg.get("no_speech_prob", 0.0)
            text = seg.get("text", "").strip()

            # Skip segments with very high no_speech probability (likely hallucination)
            # Using 0.8 threshold — 0.6 was too aggressive and dropped real speech with background music
            if no_speech_prob > 0.8:
                filtered_reasons["no_speech"] += 1
                continue

            # Skip segments that match known hallucination patterns
            if is_hallucinated(text):
                filtered_reasons["hallucination"] += 1
                continue

            # Skip empty segments
            if not text:
                filtered_reasons["empty"] += 1
                continue

            speech_probs.append(1.0 - no_speech_prob)
            segments.append({
                "id": f"seg-{len(segments)}",
                "startTime": round(seg["start"], 2),
                "endTime": round(seg["end"], 2),
                "text": text,
            })

        # Second pass: detect repetitive hallucinations
        repetition_indices = detect_repetition(segments)
        if repetition_indices:
            filtered_reasons["repetition"] = len(repetition_indices)
            segments = [s for i, s in enumerate(segments) if i not in repetition_indices]
            speech_probs = [p for i, p in enumerate(speech_probs) if i not in repetition_indices]

        # Re-index segment IDs after filtering
        for i, seg in enumerate(segments):
            seg["id"] = f"seg-{i}"

        # Calculate average confidence
        avg_confidence = round(sum(speech_probs) / len(speech_probs), 3) if speech_probs else 0.0
        filtered_count = total_raw - len(segments)

        # Log filtering details
        if filtered_count > 0:
            print(f"[Whisper] Filtered {filtered_count}: {filtered_reasons}", file=sys.stderr)

        return {
            "segments": segments,
            "language": result.get("language", "en"),
            "text": result.get("text", ""),
            "avg_confidence": avg_confidence,
            "filtered_count": filtered_count,
            "total_raw": total_raw,
        }

    except Exception as e:
        return {"error": str(e), "segments": []}


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No file path provided", "segments": []}))
            sys.exit(1)

        input_file = sys.argv[1]
        model_size = sys.argv[2] if len(sys.argv) > 2 else "base"

        result = transcribe(input_file, model_size)
        # Only this JSON goes to stdout — everything else is suppressed
        print(json.dumps(result))
    except Exception as e:
        # Catch-all for any other crashes
        print(json.dumps({"error": f"Critical script failure: {str(e)}", "segments": []}))
