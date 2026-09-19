import { ArrowRight, Sparkles, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-accent/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-10 md:pt-24 md:pb-12 relative z-10">
        <div className="max-w-4xl mx-auto text-center stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/80 border border-border mb-5 md:mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground">
              AI-Powered • Privacy-First
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.15] mb-4 md:mb-6">
            AI Photo Finder for
            <span className="block text-gradient-gold">Weddings & Events</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            Upload a selfie, and our AI instantly finds all the photos you appear in.
            Your memories, delivered privately—your selfie is deleted immediately after matching.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/find-photos">
              <Button variant="hero" size="xl" className="group">
                Find My Photos
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="elegant" size="lg">
                I'm a Photographer
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>Privacy Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <span>Instant Matching</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
