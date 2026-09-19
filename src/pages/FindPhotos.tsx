import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { ConsentScreen } from "@/components/guest/ConsentScreen";
import { SelfieUpload } from "@/components/guest/SelfieUpload";
import { PhotoGallery } from "@/components/guest/PhotoGallery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Step = "consent" | "selfie" | "gallery";

interface MatchedPhoto {
  id: string;
  url: string;
  thumbnail: string;
}

const FindPhotos = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event");
  
  const [step, setStep] = useState<Step>("consent");
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [eventName, setEventName] = useState("Event Photos");

  const handleConsent = async () => {
    // Fetch event name if eventId is provided
    if (eventId) {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('title')
          .eq('id', eventId)
          .eq('is_public', true)
          .maybeSingle();
        
        if (event) {
          setEventName(event.title);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    }
    setStep("selfie");
  };

  const handleSelfieCapture = async (file: File) => {
    if (!eventId) {
      toast({
        title: "No event selected",
        description: "Please access this page from an event link.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate session ID for guest tracking
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Upload selfie to storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `${eventId}/${sessionId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('guest-selfies')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('guest-selfies')
        .getPublicUrl(filePath);

      // Call the face matching edge function
      const { data, error } = await supabase.functions.invoke('match-faces', {
        body: {
          eventId,
          selfieUrl: publicUrl,
          sessionId,
        },
      });

      if (error) throw error;

      // Get matched image IDs
      const matchedIds = data?.matchedImageIds || [];
      
      if (matchedIds.length > 0) {
        // Fetch matched images from database
        const { data: images, error: imagesError } = await supabase
          .from('event_images')
          .select('id, image_url')
          .in('id', matchedIds);

        if (imagesError) throw imagesError;

        // Transform to PhotoGallery format
        const photos: MatchedPhoto[] = (images || []).map(img => ({
          id: img.id,
          url: img.image_url,
          thumbnail: img.image_url, // Use same URL for thumbnail
        }));

        setMatchedPhotos(photos);
        
        toast({
          title: "Photos found!",
          description: `We found ${photos.length} photos with you in them.`,
        });
      } else {
        setMatchedPhotos([]);
        toast({
          title: "No matches found",
          description: "We couldn't find any photos with you. Try a clearer selfie.",
        });
      }

      setStep("gallery");

    } catch (error: any) {
      console.error("Error matching faces:", error);
      toast({
        title: "Error",
        description: "Failed to process your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Find My Event Photos — Mypic AI Selfie Search"
        description="Upload a selfie and instantly discover every wedding, birthday and event photo you appear in. Free, private, and AI-powered."
        path="/find-photos"
      />
      <Header />
      <main>
        {step === "consent" && (
          <ConsentScreen
            eventName={eventName}
            onConsent={handleConsent}
          />
        )}
        {step === "selfie" && (
          <SelfieUpload
            onSelfieCapture={handleSelfieCapture}
            isProcessing={isProcessing}
          />
        )}
        {step === "gallery" && (
          <PhotoGallery
            photos={matchedPhotos}
            eventName={eventName}
          />
        )}
      </main>
      {step === "gallery" && <Footer />}
    </div>
  );
};

export default FindPhotos;