import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reviews = [
  {
    name: "Sophia & James",
    role: "Wedding, Tuscany",
    quote:
      "Mypic delivered our wedding gallery with breathtaking precision. Every guest found their photos in seconds — it felt like magic wrapped in elegance.",
    initials: "SJ",
  },
  {
    name: "Isabella Moreau",
    role: "30th Birthday Gala",
    quote:
      "An absolute triumph. My guests were stunned by how effortless — and beautifully private — the entire experience felt. Truly a luxury service.",
    initials: "IM",
  },
  {
    name: "Rohan Kapoor",
    role: "Event Photographer",
    quote:
      "The gold standard for event galleries. My clients are speechless when they see the polish, and the AI matching is flawless. Indispensable.",
    initials: "RK",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/40 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-accent font-medium text-xs tracking-[0.3em] uppercase mb-4 block">
            Client Reviews
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-6xl font-bold text-foreground mb-4">
            Whispered in <span className="text-gradient-gold italic">Praise</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            From celebrated hosts and photographers who choose only the finest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <Card
              key={r.name}
              className="relative bg-card/80 backdrop-blur border border-border/60 hover:border-accent/40 transition-all duration-500 shadow-soft hover:shadow-gold"
            >
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-accent/40 mb-4" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed italic font-display text-sm md:text-lg mb-6 md:mb-8">
                  "{r.quote}"
                </p>
                <div className="flex items-center gap-4 pt-6 border-t border-border/60">
                  <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-display font-semibold shadow-gold">
                    {r.initials}
                  </div>
                  <div>
                    <div className="font-display text-base md:text-lg font-semibold text-foreground">
                      {r.name}
                    </div>
                    <div className="text-xs tracking-widest uppercase text-muted-foreground">
                      {r.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
