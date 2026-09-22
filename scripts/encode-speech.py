"""Compress our generated WAV prompts to MP3 using a build-only LAME encoder."""
import json
import sys
import wave
from pathlib import Path

if len(sys.argv) > 1:
    sys.path.insert(0, sys.argv[1])
import lameenc

root = Path(__file__).resolve().parents[1]
entries = json.loads((root / 'audio/prompts/manifest.json').read_text(encoding='utf-8'))
size_before = size_after = 0
for entry in entries:
    source = (root / entry['file']).with_suffix('.wav')
    target = source.with_suffix('.mp3')
    if not source.exists():
        if target.exists():
            continue
        raise FileNotFoundError(source)
    with wave.open(str(source), 'rb') as audio:
        assert audio.getsampwidth() == 2
        encoder = lameenc.Encoder()
        encoder.set_bit_rate(40)
        encoder.set_in_sample_rate(audio.getframerate())
        encoder.set_channels(audio.getnchannels())
        encoder.set_quality(2)
        encoded = encoder.encode(audio.readframes(audio.getnframes())) + encoder.flush()
    target.write_bytes(encoded)
    size_before += source.stat().st_size
    size_after += len(encoded)
# Only remove generated WAVs after all MP3s have encoded successfully; keep source text manifest.
for entry in entries:
    source = (root / entry['file']).with_suffix('.wav').resolve()
    assert source.parent == (root / 'audio/prompts').resolve()
    if source.exists():
        source.unlink()
catalog = root / 'speech-catalog.js'
catalog.write_text(catalog.read_text(encoding='utf-8').replace('.wav"', '.mp3"'), encoding='utf-8')
print(json.dumps({'recordings': len(entries), 'before_bytes': size_before, 'after_bytes': size_after}))
