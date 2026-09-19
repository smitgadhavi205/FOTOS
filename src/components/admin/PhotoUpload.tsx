import { useState, useCallback } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Image, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface PhotoUploadProps {
  eventId: string;
  eventName: string;
  onUploadComplete?: () => void;
}

export function PhotoUpload({ eventId, eventName, onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadingFile[] = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending" as const,
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const startUpload = async () => {
    // Simulate upload process
    for (const file of files) {
      if (file.status !== "pending") continue;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "uploading" as const } : f
        )
      );

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress } : f
          )
        );
      }

      // Simulate face detection processing
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "processing" as const } : f
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "complete" as const } : f
        )
      );
    }

    onUploadComplete?.();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading" || f.status === "processing").length;
  const completeCount = files.filter((f) => f.status === "complete").length;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        variant={isDragging ? "elevated" : "default"}
        className={`transition-all duration-300 ${
          isDragging ? "ring-2 ring-accent ring-offset-2" : ""
        }`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Photos
          </CardTitle>
          <CardDescription>
            Upload photos for {eventName}. Face detection runs automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragging
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50 hover:bg-secondary/50"
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="pointer-events-none">
              <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
                <Image className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Drag & drop your photos here
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                or click to browse your files
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, HEIC up to 50MB each
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {files.length} Photo{files.length !== 1 ? "s" : ""} Selected
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                {pendingCount > 0 && (
                  <span className="text-muted-foreground">{pendingCount} pending</span>
                )}
                {uploadingCount > 0 && (
                  <span className="text-accent">{uploadingCount} uploading</span>
                )}
                {completeCount > 0 && (
                  <span className="text-green-600">{completeCount} complete</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-secondary group"
                >
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  {file.status !== "complete" && file.status !== "pending" && (
                    <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center">
                      {file.status === "uploading" && (
                        <div className="text-center">
                          <RefreshCw className="w-6 h-6 text-primary-foreground animate-spin mx-auto mb-2" />
                          <span className="text-xs text-primary-foreground">
                            {file.progress}%
                          </span>
                        </div>
                      )}
                      {file.status === "processing" && (
                        <div className="text-center">
                          <RefreshCw className="w-6 h-6 text-primary-foreground animate-spin mx-auto mb-2" />
                          <span className="text-xs text-primary-foreground">
                            Detecting faces...
                          </span>
                        </div>
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-8 h-8 text-destructive" />
                      )}
                    </div>
                  )}

                  {/* Complete Badge */}
                  {file.status === "complete" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  {file.status === "pending" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground/80 text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploadingCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium text-foreground">
                    {completeCount} / {files.length}
                  </span>
                </div>
                <Progress
                  value={(completeCount / files.length) * 100}
                  className="h-2"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setFiles([])}
                disabled={uploadingCount > 0}
              >
                Clear All
              </Button>
              <Button
                variant="gold"
                onClick={startUpload}
                disabled={pendingCount === 0 || uploadingCount > 0}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {pendingCount} Photo{pendingCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
