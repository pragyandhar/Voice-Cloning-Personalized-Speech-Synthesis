# scripts/prepare_metadata.py
import os, json, argparse, pandas as pd

def build(json_path, audio_dir, out_csv):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    rows = []
    for item in data:
        text = item.get('text','').strip()
        wav = item.get('audioFilename','')
        speaker = item.get('client_id') or item.get('speaker') or item.get('clientId') or 'unknown_speaker'
        if text and wav.lower().endswith('.wav'):
            wav_path = os.path.join(audio_dir, wav)
            rows.append([wav_path, text, speaker])
    df = pd.DataFrame(rows, columns=['path','text','speaker_name'])
    df.to_csv(out_csv, index=False, header=False, encoding='utf-8')
    print('Wrote', len(df), 'rows to', out_csv)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', required=True, help='path to commonvoice JSON')
    parser.add_argument('--audiodir', required=True, help='directory containing wav files')
    parser.add_argument('--out', required=True, help='output metadata csv path')
    args = parser.parse_args()
    build(args.json, args.audiodir, args.out)
