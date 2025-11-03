# Hindi Voice Cloning — Multi-speaker (XTTSv2 + Speaker Embeddings)
Author: For Apoorv Mehrotra
Date: 2025-11-01

## What this package contains
- Multi-speaker fine-tuning setup using Coqui-TTS (XTTSv2) + SpeechBrain ECAPA-TDNN speaker embeddings.
- The model will learn unique speaker identities so you can synthesize per-speaker voice later.

## Folder layout
data/
  commonvoice_hindi.json    <-- place your JSON here (from CommonVoice)
  audio/                    <-- place all common_voice_hi_*.wav here
checkpoints/                <-- training will save models here
notebooks/train_hindi_multispeaker.ipynb
scripts/prepare_metadata.py
scripts/extract_embeddings.py
scripts/infer_from_checkpoint.py
requirements.txt
README.md

## Quick start (VS Code)
1. Unzip this repo and open in VS Code.
2. Put `commonvoice_hindi.json` into `data/` and all WAVs into `data/audio/`.
3. Create and activate a virtualenv, then install requirements:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Run metadata + embedding scripts (or open the notebook):
   ```bash
   python scripts/prepare_metadata.py --json data/commonvoice_hindi.json --audiodir data/audio --out data/metadata.csv
   python scripts/extract_embeddings.py --metadata data/metadata.csv --out data/embeddings.npy --audiodir data/audio
   ```
5. Open `notebooks/train_hindi_multispeaker.ipynb` in VS Code Jupyter and run cells to start fine-tuning. Use GPU.
6. After training, test with `scripts/infer_from_checkpoint.py --model checkpoints/best_model.pth --speaker <speaker_id>`

## Notes
- Training requires a CUDA-enabled GPU. Recommended: RTX 3060/3070 or better.
- The notebook and scripts are pre-configured to use speaker embeddings (ECAPA-TDNN). They compute and feed embeddings into XTTS trainer.
- If your JSON doesn't contain speaker IDs, embeddings will cluster per file and an `unknown_speaker` id will be used; you can later map embeddings to speakers.
