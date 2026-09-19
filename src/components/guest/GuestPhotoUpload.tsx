import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/compressImage";

interface GuestPhotoUploadProps {
  eventId: string;
  onUploaded?: () => void;
}

interface Pending {
  id: string;
  file: File;
  preview: string;
}

export function GuestPhotoUpload({ eventId, onUploaded }: GuestPhotoUploadProps) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      toast({ title: "Only images", description: "Please pick image files.", variant: "destructive" });
      return;
    }
    setPending((prev) => [
      ...prev,
      ...images.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const remove = (id: string) =>
    setPending((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.preview);
      return prev.filter((p) => p.id !== id);
    });

  const upload = async () => {
    if (!pending.length) return;
    setIsUploading(true);
    let ok = 0;
    try {
      for (const item of pending) {
        const compressed = await compressImage(item.file);
        const path = `${eventId}/guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${compressed.extension}`;
        const { error: upErr } = await supabase.storage
          .from("event-images")
          .upload(path, compressed.blob, { cacheControl: "3600" });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage.from("event-images").getPublicUrl(path);

        const { error: insErr } = await supabase.from("event_images").insert({
          event_id: eventId,
          image_url: publicUrl,
          uploaded_by_guest: true,
        });
        if (insErr) throw insErr;
        ok++;
      }
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      toast({ title: "Thanks for sharing!", description: `${ok} photo${ok === 1 ? "" : "s"} added to the gallery.` });
      onUploaded?.();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Upload failed",
        description: e?.message || "Could not upload your photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ImagePlus className="w-5 h-5 text-accent" />
          Share your own photos
        </CardTitle>
        <CardDescription>
          Add photos you captured at this event so everyone can view and download them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-40 sm:h-52 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            isDragging ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-secondary/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Upload className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">Choose photos</p>
          <p className="text-xs text-muted-foreground mt-1">Drag & drop or tap to select</p>
        </div>

        {pending.length > 0 && (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {pending.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => remove(p.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="gold" className="w-full" onClick={upload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Add ${pending.length} photo${pending.length === 1 ? "" : "s"} to gallery`
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
