# scripts/infer_from_checkpoint.py
import os, argparse
from TTS.api import TTS

parser = argparse.ArgumentParser()
parser.add_argument('--model', required=True, help='Path to model .pth or model folder')
parser.add_argument('--out', default='out.wav', help='Output WAV path')
parser.add_argument('--text', default='नमस्ते, यह एक परीक्षण है।')
parser.add_argument('--speaker_emb', default=None, help='Path to speaker embedding .npy (optional)')
args = parser.parse_args()

tts = TTS(model_path=args.model, gpu=True)
if args.speaker_emb:
    import numpy as np
    sp = np.load(args.speaker_emb, allow_pickle=True)
    # expect dict with 'embeddings' array
    emb = sp.get('embeddings')[0] if isinstance(sp, dict) else sp[0]
    tts.tts_to_file(text=args.text, speaker_embeddings=emb, file_path=args.out)
else:
    tts.tts_to_file(text=args.text, file_path=args.out)
print('Saved', args.out)
