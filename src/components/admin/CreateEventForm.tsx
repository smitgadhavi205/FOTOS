import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateEventFormProps {
  onBack: () => void;
  onEventCreated: () => void;
}

export function CreateEventForm({ onBack, onEventCreated }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const removeCover = () => {
    setCoverImage(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !eventDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in the event title and date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let coverImageUrl = null;

      // Upload cover image if provided
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(filePath, coverImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-covers')
          .getPublicUrl(filePath);

        coverImageUrl = publicUrl;
      }

      // Create event record
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          photographer_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          event_date: eventDate,
          cover_image_url: coverImageUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Event created!",
        description: "Your event has been created successfully.",
      });

      onEventCreated();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Create New Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Wedding of John & Mary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Event Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    className="pl-10"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add details about the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                {coverPreview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeCover}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 hover:bg-secondary/30 transition-all">
                    <ImagePlus className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
