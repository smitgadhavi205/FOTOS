import { useState, useEffect } from "react";
import { Camera, Image, Users, Plus, LogOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateEventForm } from "./CreateEventForm";
import { EventImageUpload } from "./EventImageUpload";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  event_date: string;
  cover_image_url: string | null;
  description: string | null;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

function getEventTag(dateStr: string): { label: string; className: string } {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(dateStr));
  const diffDays = Math.round((day - today) / 86400000);

  if (diffDays === 0) return { label: "Live", className: "bg-accent text-accent-foreground animate-pulse" };
  if (diffDays === -1) return { label: "Yesterday", className: "bg-secondary text-foreground" };
  if (diffDays === 1) return { label: "Tomorrow", className: "bg-accent/20 text-accent" };
  if (diffDays > 1) return { label: "Upcoming", className: "bg-accent/10 text-accent" };
  if (diffDays >= -7) return { label: `${Math.abs(diffDays)} days ago`, className: "bg-secondary text-muted-foreground" };
  return { label: "Archived", className: "bg-secondary text-muted-foreground" };
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [view, setView] = useState<"events" | "create" | "upload">("events");
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, cover_image_url, description')
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);

      // Get total image count
      const { count } = await supabase
        .from('event_images')
        .select('*', { count: 'exact', head: true });
      
      setImageCount(count || 0);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "create") {
    return (
      <CreateEventForm
        onBack={() => setView("events")}
        onEventCreated={() => {
          fetchEvents();
          setView("events");
        }}
      />
    );
  }

  if (selectedEvent && view === "upload") {
    return (
      <EventImageUpload
        eventId={selectedEvent.id}
        eventTitle={selectedEvent.title}
        coverImageUrl={selectedEvent.cover_image_url}
        onCoverChange={(url) => {
          setSelectedEvent((prev) => (prev ? { ...prev, cover_image_url: url } : prev));
          setEvents((prev) =>
            prev.map((e) => (e.id === selectedEvent.id ? { ...e, cover_image_url: url } : e))
          );
        }}
        onBack={() => {
          setSelectedEvent(null);
          setView("events");
          fetchEvents();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Photographer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your events and photo albums
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="gold" onClick={() => setView("create")}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card variant="elevated">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">
                  {events.length}
                </p>
                <p className="text-sm text-muted-foreground">Active Events</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">
                  {imageCount}
                </p>
                <p className="text-sm text-muted-foreground">Total Photos</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display text-foreground">
                  0
                </p>
                <p className="text-sm text-muted-foreground">Guests Served</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>
              Click on an event to manage photos and view analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No events yet</p>
                <Button variant="gold" onClick={() => setView("create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent/50 hover:bg-secondary/50 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedEvent(event);
                      setView("upload");
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-7 h-7 text-muted-foreground group-hover:text-accent transition-colors" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {event.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getEventTag(event.event_date).className}`}
                          >
                            {getEventTag(event.event_date).label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.event_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Manage Photos →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
