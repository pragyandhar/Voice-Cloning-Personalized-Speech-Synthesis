import sounddevice as sd
from scipy.io.wavfile import write
import os

# Paths
PROJECT_DIR = os.path.abspath(".")
DATA_DIR = os.path.join(PROJECT_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

OUTPUT_PATH = os.path.join(DATA_DIR, "speaker.wav")

# Settings
samplerate = 22050  # 22kHz is fine for XTTS
duration = 5  # seconds

print("\n🎙 Speak now! Recording for 5 seconds...")
recording = sd.rec(int(samplerate * duration), samplerate=samplerate, channels=1, dtype='int16')
sd.wait()
write(OUTPUT_PATH, samplerate, recording)
print(f"\n✅ Saved your voice sample at: {OUTPUT_PATH}")
