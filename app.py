from fastapi import FastAPI, Form, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from clone_my_voice import generate_voice

app = FastAPI(title="English Voice Cloning API")

# Update the CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dhwanii.netlify.app"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.post("/clone")
async def clone_voice(text: str = Form(...), reference_audio: UploadFile = None):
    output_path = "outputs/cloned_voice.wav"
    os.makedirs("outputs", exist_ok=True)
    generate_voice(text, reference_audio, output_path)
    return FileResponse(output_path, media_type="audio/wav")

@app.get("/")
def root():
    return {"message": "Voice Cloning Backend is Running 🚀"}
