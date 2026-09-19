import { QrCode, Camera, Search, Images } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: QrCode,
    step: "01",
    title: "Access the Event",
    description: "Scan the QR code or use the private link shared by your photographer.",
  },
  {
    icon: Camera,
    step: "02",
    title: "Take a Selfie",
    description: "Snap a quick photo of yourself. We'll use it to find you in the album.",
  },
  {
    icon: Search,
    step: "03",
    title: "AI Matching",
    description: "Our AI scans all event photos to find the ones where you appear.",
  },
  {
    icon: Images,
    step: "04",
    title: "View Your Gallery",
    description: "Browse and download only the photos featuring you. Your selfie is deleted.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 stagger-children">
          <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
            Simple Process
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            Get your event photos in four simple steps, without compromising your privacy.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.step}
              variant="feature"
              className="relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                {/* Step number */}
                <span className="absolute top-4 right-4 font-display text-4xl md:text-6xl font-bold text-muted/30 group-hover:text-accent/20 transition-colors">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mb-6 shadow-gold group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-base md:text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
