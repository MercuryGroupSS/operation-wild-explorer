"""Decode every generated MP3; report technical checks, never listening claims.
Run after generation: python3 scripts/verify-narration-audio.py
Requires the approved build environment's ffmpeg and numpy, not browser deps.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "public/assets/narration/bella-v1"
metadata = json.loads((PACK / "build-metadata.json").read_text())


def check(clip):
    path = ROOT / "public" / clip["file"]
    data = path.read_bytes()
    assert len(data) == clip["bytes"], f"Size mismatch: {path.name}"
    assert hashlib.sha256(data).hexdigest() == clip["sha256"], f"Hash mismatch: {path.name}"
    result = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-f", "f32le", "-acodec", "pcm_f32le", "-"],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    samples = np.frombuffer(result.stdout, dtype="<f4")
    assert samples.size, f"No decoded samples: {path.name}"
    assert np.isfinite(samples).all(), f"Non-finite waveform: {path.name}"
    peak = float(np.abs(samples).max())
    rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
    assert peak < 1, f"Full-scale clipping: {path.name}, {peak}"
    assert rms > 0.0001, f"Silent waveform: {path.name}"
    seconds = samples.size / 24000
    assert abs(seconds - clip["seconds"]) < 0.1, f"Duration mismatch: {path.name}"
    return {"key": clip["key"], "seconds": round(seconds, 3), "peak": round(peak, 6), "rms": round(rms, 6)}


with ThreadPoolExecutor(max_workers=3) as pool:
    checks = list(pool.map(check, metadata["clips"]))

report = {
    "clips": len(checks),
    "total_bytes": metadata["totalBytes"],
    "total_seconds": metadata["totalSeconds"],
    "maximum_decoded_peak": max(c["peak"] for c in checks),
    "minimum_decoded_rms": min(c["rms"] for c in checks),
    "checks": "Every MP3 decodes, matches its SHA-256 and byte count, has the expected duration, and contains a finite, non-silent waveform with no full-scale clipping.",
    "limits": "Technical validation only. No claim of auditory, pronunciation or speech-transcription review, or physical iPhone playback testing.",
    "files": checks,
}
destination = ROOT / "docs/narration-audio-validation.json"
destination.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({k: v for k, v in report.items() if k != "files"}, indent=2))
