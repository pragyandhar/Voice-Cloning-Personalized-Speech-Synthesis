from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime
from clone_my_voice import generate_voice

# Initialize FastAPI application
app = FastAPI(
    title="English Voice Cloning API",
    description="API for cloning voices from reference audio and text input",
    version="1.0.0"
)

# CORS middleware configuration
# Update the origins to match your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dhwanii.netlify.app","http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Ensure necessary directories exist
os.makedirs("temp_uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

@app.post("/clone-voice")
async def clone_voice(
    audio: UploadFile = File(..., description="Reference audio file for voice cloning"),
    text: str = Form(..., description="Text to convert to speech using the cloned voice")
):
    """
    Clone voice from reference audio and generate speech from text.
    
    Args:
        audio: UploadFile - Reference audio file (webm, wav, mp3, etc.)
        text: str - Text to convert to speech
        
    Returns:
        JSON response with status and audio URL or error message
    """
    try:
        # Validate file type
        allowed_extensions = {'.webm', '.wav', '.mp3', '.ogg', '.m4a'}
        file_extension = os.path.splitext(audio.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error", 
                    "message": f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
                }
            )
        
        # Validate text input
        if not text.strip():
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Text cannot be empty"}
            )
        
        # Generate unique filename to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        temp_file = f"temp_uploads/temp_audio_{unique_id}{file_extension}"
        output_filename = f"cloned_voice_{unique_id}.wav"
        output_path = f"outputs/{output_filename}"
        
        # Save the uploaded file temporarily
        with open(temp_file, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        print(f"Processing voice cloning for text: {text[:50]}...")  # Log first 50 chars
        
        # Process the audio with your voice cloning logic
        # Note: Updated to match the expected function signature
        generate_voice(text, temp_file, output_path)
        
        # Clean up temporary uploaded file
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        # Return success response with file path
        return {
            "status": "success", 
            "audio_url": output_path,
            "message": "Voice cloning completed successfully",
            "filename": output_filename
        }
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in clone_voice endpoint: {str(e)}")
        
        # Clean up temporary files in case of error
        if 'temp_file' in locals() and os.path.exists(temp_file):
            os.remove(temp_file)
        
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": f"Voice cloning failed: {str(e)}"
            }
        )

@app.get("/download-audio/{filename}")
async def download_audio(filename: str):
    """
    Download the generated audio file.
    
    Args:
        filename: str - Name of the audio file to download
        
    Returns:
        FileResponse with the audio file
    """
    file_path = f"outputs/{filename}"
    
    if not os.path.exists(file_path):
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": "Audio file not found"}
        )
    
    return FileResponse(
        path=file_path,
        media_type="audio/wav",
        filename=filename
    )

@app.get("/")
async def root():
    """
    Root endpoint to check if the API is running.
    
    Returns:
        Basic health check response
    """
    return {
        "message": "Voice Cloning Backend is Running 🚀",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "clone_voice": "POST /clone-voice",
            "download_audio": "GET /download-audio/{filename}"
        }
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        Health status of the API
    """
    return {
        "status": "healthy",
        "service": "Voice Cloning API",
        "timestamp": datetime.now().isoformat()
    }

# Optional: Add cleanup task for old files
@app.on_event("startup")
async def startup_event():
    """Initialize application startup tasks."""
    print("Voice Cloning API starting up...")
    print("Ensuring directories exist...")
    os.makedirs("temp_uploads", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    print("API ready to accept requests!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)