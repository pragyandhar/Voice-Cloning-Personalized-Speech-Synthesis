import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Play, Pause, Download, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AudioWaveform from './AudioWaveform';
import MicrophoneScene from '../three/MicrophoneScene';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
  onUploadComplete?: (result: any) => void;
  className?: string;
  textToSynthesize?: string; // Text input for voice cloning
}

export default function AudioRecorder({ 
  onRecordingComplete, 
  onUploadComplete, 
  className = "",
  textToSynthesize = "Hello, this is a sample text for voice cloning." 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recordedBlobRef.current = null;
      setUploadResult(null);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        recordedBlobRef.current = audioBlob;
        onRecordingComplete?.(audioBlob, url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [onRecordingComplete, toast]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      toast({
        title: "Recording complete",
        description: `Recorded ${recordingTime} seconds of audio`
      });
    }
  }, [isRecording, recordingTime, toast]);

  // Upload recording to backend for voice cloning
  const uploadRecording = useCallback(async () => {
    if (!recordedBlobRef.current) {
      toast({
        title: "No recording found",
        description: "Please record audio first",
        variant: "destructive"
      });
      return;
    }

    if (!textToSynthesize.trim()) {
      toast({
        title: "Text required",
        description: "Please provide text for voice synthesis",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', recordedBlobRef.current, 'recording.webm');
      formData.append('text', textToSynthesize);

      // Use your backend URL - update this to your actual backend URL
      const backendUrl = process.env.VITE_API_URL || 'https://dhwanii-backend.onrender.com';
      
      const response = await fetch(`${backendUrl}/clone-voice`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with the boundary
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      setUploadResult(result);
      onUploadComplete?.(result);
      
      toast({
        title: "Voice cloning successful!",
        description: "Your voice has been cloned and processed",
      });

      // If the backend returns an audio URL, you can handle it here
      if (result.audio_url) {
        // You can fetch and play the generated audio
        console.log("Generated audio URL:", result.audio_url);
      }
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process voice cloning",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [textToSynthesize, onUploadComplete, toast]);

  // Play recorded audio
  const playAudio = useCallback(() => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  // Download recorded audio
  const downloadAudio = useCallback(() => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voice-sample-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Your recording is being downloaded"
      });
    }
  }, [audioUrl, toast]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
    }
    setIsPlaying(false);
    setRecordingTime(0);
    recordedBlobRef.current = null;
    setUploadResult(null);
    
    toast({
      title: "Recording cleared",
      description: "The recording has been removed"
    });
  }, [audioUrl, toast]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`glass-effect ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* 3D Microphone */}
          <div className="w-48 h-48 rounded-xl overflow-hidden">
            <MicrophoneScene isRecording={isRecording} />
          </div>

          {/* Waveform Visualization */}
          <div className="w-full max-w-md h-16 flex items-center justify-center">
            <AudioWaveform 
              isRecording={isRecording} 
              isPlaying={isPlaying}
              bars={25}
            />
          </div>

          {/* Recording Time */}
          {(isRecording || recordingTime > 0) && (
            <div className="text-center">
              <div className={`text-2xl font-mono ${isRecording ? 'text-primary' : 'text-foreground'}`}>
                {formatTime(recordingTime)}
              </div>
              {isRecording && (
                <div className="text-sm text-muted-foreground mt-1">Recording...</div>
              )}
            </div>
          )}

          {/* Upload Result Display */}
          {uploadResult && (
            <div className="w-full max-w-md p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-800 dark:text-green-300">
                <strong>Success!</strong> Voice cloning completed.
                {uploadResult.filename && (
                  <div className="mt-1">Filename: {uploadResult.filename}</div>
                )}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Recording Controls */}
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 glow-primary recording-pulse"
                  disabled={isUploading}
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}

              {audioUrl && !isRecording && (
                <>
                  <Button
                    onClick={playAudio}
                    variant="secondary"
                    size="lg"
                    disabled={isUploading}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 mr-2" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>

                  <Button
                    onClick={downloadAudio}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={clearRecording}
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Upload Button */}
            {audioUrl && !isRecording && (
              <Button
                onClick={uploadRecording}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isUploading || !textToSynthesize.trim()}
              >
                <Upload className="w-5 h-5 mr-2" />
                {isUploading ? 'Processing...' : 'Clone Voice'}
              </Button>
            )}
          </div>

          {/* Text Preview */}
          {textToSynthesize && (
            <div className="w-full max-w-md text-center">
              <p className="text-sm text-muted-foreground mb-2">Text to synthesize:</p>
              <p className="text-sm bg-muted/50 p-3 rounded-lg border">
                "{textToSynthesize.length > 100 ? `${textToSynthesize.substring(0, 100)}...` : textToSynthesize}"
              </p>
            </div>
          )}

          {/* Hidden audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              hidden
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}