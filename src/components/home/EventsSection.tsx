import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  title: string;
  event_date: string;
  cover_image_url: string | null;
  description: string | null;
}

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, cover_image_url, description')
        .eq('is_public', true)
        .order('event_date', { ascending: false })
        .limit(6);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
              Recent Events
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse recent events and find your photos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Recent Events
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse recent events and find your photos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} to={`/event/${event.id}`}>
              <Card className="overflow-hidden group hover:shadow-elevated transition-all duration-300 cursor-pointer h-full">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {event.cover_image_url ? (
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display text-base md:text-xl font-semibold text-foreground group-hover:text-accent transition-colors mb-2">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {events.length >= 6 && (
          <div className="text-center mt-10">
            <Button variant="elegant" className="group">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
