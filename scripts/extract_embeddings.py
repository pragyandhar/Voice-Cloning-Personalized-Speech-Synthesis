# scripts/extract_embeddings.py
# Extract ECAPA-TDNN embeddings for all wavs listed in metadata.csv
import os, argparse, numpy as np, pandas as pd
from speechbrain.pretrained import EncoderClassifier

def run(meta_csv, audiodir, out_npy):
    df = pd.read_csv(meta_csv, header=None, names=['path','text','speaker'])
    classifier = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir='pretrained_models/spkrec')
    embeddings = []
    paths = []
    for idx, row in df.iterrows():
        wav = row['path']
        if not os.path.isabs(wav):
            wav = os.path.join(audiodir, wav)
        if not os.path.exists(wav):
            print('Missing file:', wav); embeddings.append(None); paths.append(wav); continue
        emb = classifier.encode_file(wav).squeeze().cpu().numpy()
        embeddings.append(emb)
        paths.append(wav)
        if (idx+1) % 100 == 0:
            print('Processed', idx+1)
    np.save(out_npy, {'paths': paths, 'embeddings': embeddings})
    print('Saved embeddings to', out_npy)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--metadata', required=True, help='metadata.csv path')
    parser.add_argument('--audiodir', required=True, help='audio directory (for relative paths)')
    parser.add_argument('--out', required=True, help='output npy path to save embeddings')
    args = parser.parse_args()
    run(args.metadata, args.audiodir, args.out)
