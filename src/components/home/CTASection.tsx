import { ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-accent/10 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl gradient-gold flex items-center justify-center mx-auto mb-8 shadow-gold animate-float">
            <Camera className="w-10 h-10 text-primary-foreground" />
          </div>

          {/* Content */}
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Ready to Find Your
            <span className="text-gradient-gold"> Photos?</span>
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of event guests who've discovered their perfect moments
            with complete privacy and zero hassle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/find-photos">
              <Button variant="hero" size="xl" className="group">
                Get Started Now
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="lg">
                For Photographers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
