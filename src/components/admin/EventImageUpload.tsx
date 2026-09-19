import { useState, useCallback, useEffect } from "react";
import { Upload, X, Check, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EventPhotoManager } from "./EventPhotoManager";
import { PHOTO_CATEGORIES, UNCATEGORIZED } from "@/lib/photoCategories";


interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  imageUrl?: string;
}

interface EventImageUploadProps {
  eventId: string;
  eventTitle: string;
  coverImageUrl?: string | null;
  onCoverChange?: (url: string) => void;
  onBack: () => void;
}

export function EventImageUpload({ eventId, eventTitle, coverImageUrl, onCoverChange, onBack }: EventImageUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingEmbeddings, setIsProcessingEmbeddings] = useState(false);
  const [category, setCategory] = useState<string>(UNCATEGORIZED);
  const [libraryKey, setLibraryKey] = useState(0);
  const [allowGuestUploads, setAllowGuestUploads] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    supabase
      .from("events")
      .select("allow_guest_uploads, require_password")
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        setAllowGuestUploads(!!data?.allow_guest_uploads);
        setRequirePassword(!!data?.require_password);
      });
    supabase
      .from("event_passwords")
      .select("event_id")
      .eq("event_id", eventId)
      .maybeSingle()
      .then(({ data }) => setHasPassword(!!data));
  }, [eventId]);

  const toggleGuestUploads = async (next: boolean) => {
    setSavingToggle(true);
    const { error } = await supabase
      .from("events")
      .update({ allow_guest_uploads: next })
      .eq("id", eventId);
    setSavingToggle(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setAllowGuestUploads(next);
    toast({
      title: next ? "Guest uploads enabled" : "Guest uploads disabled",
      description: next
        ? "Guests can now add their own photos to this event."
        : "Only you can add photos to this event.",
    });
  };

  const toggleRequirePassword = async (next: boolean) => {
    if (next && !hasPassword) {
      // Turn the switch on visually so the password field appears; it is persisted once a password is saved.
      setRequirePassword(true);
      return;
    }
    setSavingToggle(true);
    const { error } = await supabase.from("events").update({ require_password: next }).eq("id", eventId);
    setSavingToggle(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setRequirePassword(next);
    toast({
      title: next ? "Password required" : "Password removed",
      description: next ? "Guests must enter the password to open this event." : "Anyone with the link can open this event.",
    });
  };

  const savePassword = async () => {
    if (newPassword.trim().length < 4) {
      toast({ title: "Too short", description: "Use at least 4 characters.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.rpc("set_event_password", { _event_id: eventId, _password: newPassword.trim() });
    if (!error) {
      await supabase.from("events").update({ require_password: true }).eq("id", eventId);
    }
    setSavingPassword(false);
    if (error) {
      toast({ title: "Could not save password", description: error.message, variant: "destructive" });
      return;
    }
    setHasPassword(true);
    setRequirePassword(true);
    setNewPassword("");
    toast({ title: "Password saved", description: "Guests now need this password to open the event." });
  };


  const processFiles = useCallback((selectedFiles: FileList | File[]) => {
    const imageFiles = Array.from(selectedFiles).filter(f => f.type.startsWith('image/'));
    
    const newFiles: UploadingFile[] = imageFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  }, [processFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const startUpload = async () => {
    const pendingFiles = files.filter(f => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images.",
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];

    for (const uploadFile of pendingFiles) {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: "uploading" as const } : f
      ));

      try {
        const fileExt = uploadFile.file.name.split('.').pop();
        const filePath = `${user.id}/${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, progress: 50 } : f
        ));

        // Insert record in database
        const { error: dbError } = await supabase
          .from('event_images')
          .insert({
            event_id: eventId,
            image_url: publicUrl,
            category: category === UNCATEGORIZED ? null : category,
          });

        if (dbError) throw dbError;

        uploadedUrls.push(publicUrl);

        // Mark as processing (for face embeddings)
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "processing" as const, progress: 75, imageUrl: publicUrl } : f
        ));

      } catch (error: any) {
        console.error("Upload error:", error);
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "error" as const } : f
        ));
      }
    }

    setIsUploading(false);

    // Process face embeddings for all uploaded images
    if (uploadedUrls.length > 0) {
      setIsProcessingEmbeddings(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('process-embeddings', {
          body: {
            eventId,
            imageUrls: uploadedUrls,
          },
        });

        if (error) {
          console.error('Embedding processing error:', error);
          toast({
            title: "Note",
            description: "Photos uploaded. Face indexing will be available once your backend is connected.",
          });
        } else {
          console.log('Embeddings processed:', data);
        }
      } catch (embeddingError) {
        console.error('Error calling embedding function:', embeddingError);
      }

      setIsProcessingEmbeddings(false);

      // Mark all processing files as complete
      setFiles(prev => prev.map(f => 
        f.status === "processing" ? { ...f, status: "complete" as const, progress: 100 } : f
      ));
    }
    
    toast({
      title: "Upload complete",
      description: `${uploadedUrls.length} images uploaded successfully.`,
    });
    setLibraryKey(k => k + 1);
  };

  const pendingCount = files.filter(f => f.status === "pending").length;
  const completedCount = files.filter(f => f.status === "complete").length;
  const overallProgress = files.length > 0 
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          ← Back to Events
        </button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">{eventTitle}</h1>
          <p className="text-muted-foreground mt-1">Upload photos for guests to discover</p>
        </div>

        {/* Guest upload toggle */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div>
              <p className="font-medium text-foreground">Allow guest uploads</p>
              <p className="text-sm text-muted-foreground">
                Let relatives and guests add their own photos to this event gallery.
              </p>
            </div>
            <Switch
              checked={allowGuestUploads}
              onCheckedChange={toggleGuestUploads}
              disabled={savingToggle}
              aria-label="Allow guest uploads"
            />
          </CardContent>
        </Card>

        {/* Password protection */}
        <Card className="mb-6">
          <CardContent className="py-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Require password</p>
                <p className="text-sm text-muted-foreground">
                  Guests must enter a password before viewing this event gallery.
                  {hasPassword && " A password is currently set."}
                </p>
              </div>
              <Switch
                checked={requirePassword}
                onCheckedChange={toggleRequirePassword}
                disabled={savingToggle}
                aria-label="Require password"
              />
            </div>
            {requirePassword && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={hasPassword ? "Enter a new password to change it" : "Set a password (min 4 characters)"}
                  className="flex-1"
                />
                <Button
                  variant="gold"
                  onClick={savePassword}
                  disabled={savingPassword || newPassword.trim().length < 4}
                >
                  {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save password
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Photos</CardTitle>
              <CardDescription>Drag and drop or click to select images</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative flex flex-col items-center justify-center w-full h-64
                  border-2 border-dashed rounded-xl transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-accent bg-accent/10' 
                    : 'border-border hover:border-accent/50 hover:bg-secondary/30'
                  }
                `}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">Drop images here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium text-foreground">Category for this batch</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNCATEGORIZED}>{UNCATEGORIZED}</SelectItem>
                    {PHOTO_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can change any photo's category later in the library below.
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {completedCount} of {files.length} uploaded
                    </span>
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>
                  
                  {isUploading && (
                    <Progress value={overallProgress} className="h-2" />
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="gold"
                      className="flex-1"
                      onClick={startUpload}
                      disabled={pendingCount === 0 || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        `Upload ${pendingCount} Photos`
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Photos</CardTitle>
              <CardDescription>
                {files.length === 0 
                  ? "No photos selected yet" 
                  : `${files.length} photo${files.length !== 1 ? 's' : ''} ready`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p>Selected photos will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {files.map((file) => (
                    <div key={file.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={file.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Status indicator */}
                      <div className="absolute bottom-1 right-1">
                        {file.status === "uploading" && (
                          <div className="p-1 rounded-full bg-background/80">
                            <Loader2 className="w-4 h-4 animate-spin text-accent" />
                          </div>
                        )}
                        {file.status === "complete" && (
                          <div className="p-1 rounded-full bg-green-500">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="p-1 rounded-full bg-destructive">
                            <AlertCircle className="w-4 h-4 text-destructive-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      {file.status === "pending" && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <EventPhotoManager
            eventId={eventId}
            refreshKey={libraryKey}
            coverImageUrl={coverImageUrl}
            onCoverChange={onCoverChange}
          />

        </div>

      </div>
    </div>
  );
}
