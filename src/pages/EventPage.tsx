import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Camera, Calendar, ArrowLeft, Loader2, Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { InteractiveGallery } from "@/components/guest/InteractiveGallery";
import { GuestPhotoUpload } from "@/components/guest/GuestPhotoUpload";
import { categoryLabel } from "@/lib/photoCategories";
import { CategoryAlbums, type AlbumEntry } from "@/components/guest/CategoryAlbums";


interface Event {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  cover_image_url: string | null;
  allow_guest_uploads: boolean;
  require_password: boolean;
}

interface EventImage {
  id: string;
  image_url: string;
  category?: string | null;
  uploaded_by_guest?: boolean | null;
  created_at: string;
}

const accessKey = (id: string) => `mypic-event-access-${id}`;

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [allImages, setAllImages] = useState<EventImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      setUnlocked(sessionStorage.getItem(accessKey(eventId)) === "1");
      fetchEventData();
    }
  }, [eventId]);

  const fetchImages = async () => {
    const { data: images, error } = await supabase
      .from("event_images")
      .select("id, image_url, category, uploaded_by_guest, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    // Guest-contributed photos float to the top, newest first within each group
    const sorted = [...(images || [])].sort(
      (a, b) => Number(!!b.uploaded_by_guest) - Number(!!a.uploaded_by_guest)
    );
    setAllImages(sorted);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !password) return;
    setChecking(true);
    setPwError(null);
    const { data, error } = await supabase.rpc("verify_event_password", {
      _event_id: eventId,
      _password: password,
    });
    setChecking(false);
    if (error || !data) {
      setPwError("Incorrect password. Please try again.");
      return;
    }
    sessionStorage.setItem(accessKey(eventId), "1");
    setUnlocked(true);
  };

  const fetchEventData = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("is_public", true)
        .maybeSingle();

      if (eventError) throw eventError;
      if (!eventData) {
        setIsLoading(false);
        return;
      }

      setEvent(eventData as Event);
      await fetchImages();
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Albums: "All photos" first, then each category present in this event
  const categoryNames = Array.from(new Set(allImages.map((i) => categoryLabel(i.category))));
  const albums: AlbumEntry[] = [
    { name: "All photos", count: allImages.length, cover: allImages[0]?.image_url },
    ...categoryNames.map((name) => {
      const items = allImages.filter((i) => categoryLabel(i.category) === name);
      return { name, count: items.length, cover: items[0]?.image_url };
    }),
  ];

  const filteredImages =
    !openAlbum || openAlbum === "All photos"
      ? allImages
      : allImages.filter((i) => categoryLabel(i.category) === openAlbum);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Event Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              This event doesn't exist or is not publicly available.
            </p>
            <Link to="/">
              <Button variant="gold">Return Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (event.require_password && !unlocked) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="font-display text-xl">{event.title}</CardTitle>
                <CardDescription>This gallery is private. Enter the event password to view the photos.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitPassword} className="space-y-3">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Event password"
                    autoFocus
                    autoComplete="off"
                  />
                  {pwError && <p className="text-sm text-destructive">{pwError}</p>}
                  <Button type="submit" variant="gold" className="w-full" disabled={checking || !password}>
                    {checking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Unlock gallery
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 sm:pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>

          {/* Event Header */}
          <div className="mb-8">
            {event.cover_image_url && (
              <div className="aspect-[3/1] rounded-2xl overflow-hidden mb-5">
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mb-2">
              {event.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(event.event_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground max-w-2xl">{event.description}</p>
            )}
          </div>

          {/* Guest uploads — shown before the gallery when enabled */}
          {event.allow_guest_uploads && (
            <div className="mb-8">
              <GuestPhotoUpload eventId={event.id} onUploaded={fetchImages} />
            </div>
          )}

          {/* Event Gallery */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {openAlbum ?? "Albums"}{" "}
                {allImages.length > 0 && (
                  <span className="text-muted-foreground font-normal">
                    ({openAlbum ? filteredImages.length : allImages.length})
                  </span>
                )}
              </h2>
              {openAlbum ? (
                <button
                  onClick={() => setOpenAlbum(null)}
                  className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Albums
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Latest uploads first</span>
              )}
            </div>
            {allImages.length > 0 ? (
              openAlbum ? (
                <InteractiveGallery
                  images={filteredImages}
                  eventName={event.title}
                  emptyLabel="No photos in this album"
                />
              ) : (
                <CategoryAlbums albums={albums} onOpen={setOpenAlbum} />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Camera className="w-12 h-12 mb-4 opacity-50" />
                <p>No photos uploaded yet</p>
              </div>
            )}
          </div>


          {!event.allow_guest_uploads && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Guest uploads are closed</CardTitle>
                <CardDescription>
                  The photographer hasn't enabled guest photo sharing for this event.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                You can still browse, download, and share every photo above.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
