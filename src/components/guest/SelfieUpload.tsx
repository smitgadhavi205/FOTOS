import { useState, useRef, useCallback } from "react";
import { Camera, Upload, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SelfieUploadProps {
  onSelfieCapture: (file: File) => void;
  isProcessing?: boolean;
}

export function SelfieUpload({ onSelfieCapture, isProcessing = false }: SelfieUploadProps) {
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"camera" | "upload">("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      setCameraError("Unable to access camera. Please use file upload instead.");
      setCaptureMode("upload");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            setSelfiePreview(URL.createObjectURL(blob));
            stopCamera();
            onSelfieCapture(file);
          }
        }, "image/jpeg", 0.9);
      }
    }
  }, [onSelfieCapture, stopCamera]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelfiePreview(URL.createObjectURL(file));
      onSelfieCapture(file);
    }
  };

  const resetCapture = () => {
    setSelfiePreview(null);
    stopCamera();
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 pt-24">
      <Card variant="elevated" className="max-w-lg w-full animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">
            Take a Selfie
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            We'll use this to find all photos where you appear.
            Your selfie is deleted immediately after matching.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          {!selfiePreview && (
            <div className="flex rounded-xl bg-secondary p-1">
              <button
                onClick={() => {
                  setCaptureMode("camera");
                  startCamera();
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  captureMode === "camera"
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="w-4 h-4 inline-block mr-2" />
                Camera
              </button>
              <button
                onClick={() => {
                  setCaptureMode("upload");
                  stopCamera();
                }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  captureMode === "upload"
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-4 h-4 inline-block mr-2" />
                Upload
              </button>
            </div>
          )}

          {/* Camera / Preview Area */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
            {selfiePreview ? (
              <img
                src={selfiePreview}
                alt="Your selfie"
                className="w-full h-full object-cover"
              />
            ) : captureMode === "camera" ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                    <div className="text-center p-4">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">{cameraError}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-12 h-12 mb-3" />
                <span className="text-sm font-medium">Click to upload a photo</span>
                <span className="text-xs mt-1">JPG, PNG up to 10MB</span>
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Action Buttons */}
          {selfiePreview ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={resetCapture}
                disabled={isProcessing}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                variant="gold"
                size="lg"
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Finding Photos...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Find My Photos
                  </>
                )}
              </Button>
            </div>
          ) : captureMode === "camera" && !cameraError ? (
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={capturePhoto}
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
          ) : null}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Privacy reminder */}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Your selfie is encrypted and deleted within minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
