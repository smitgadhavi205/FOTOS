import { Shield, Eye, Trash2, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const privacyFeatures = [
  {
    icon: Eye,
    title: "Consent-Based Access",
    description: "You control when and how your face is used. No matching without your explicit permission.",
  },
  {
    icon: Trash2,
    title: "Immediate Deletion",
    description: "Your selfie is deleted within minutes of matching. We don't keep what we don't need.",
  },
  {
    icon: Lock,
    title: "Private Albums",
    description: "Event photos are never indexed by search engines. Only invited guests can access them.",
  },
  {
    icon: Shield,
    title: "No Identity Storage",
    description: "We store face embeddings, not names or identities. Your anonymity is preserved.",
  },
];

const privacyCommitments = [
  "Your selfie is processed and immediately deleted",
  "Face data is stored as anonymous mathematical vectors",
  "No facial data is shared with third parties",
  "You can request complete data deletion anytime",
  "Albums are private and not searchable online",
  "End-to-end encryption for all transfers",
];

export function PrivacySection() {
  return (
    <section className="py-24 bg-secondary/30 relative">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Privacy First</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4">
            Your Privacy, Protected
          </h2>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl mx-auto">
            We believe you should enjoy your memories without sacrificing your privacy. Here's how we keep you safe.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {privacyFeatures.map((feature, index) => (
            <Card key={feature.title} variant="glass" className="group">
              <CardContent className="p-8 flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-base md:text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commitments List */}
        <Card variant="elevated" className="max-w-3xl mx-auto">
          <CardContent className="p-8">
            <h3 className="font-display text-2xl font-semibold text-foreground mb-6 text-center">
              Our Privacy Commitments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privacyCommitments.map((commitment, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{commitment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
