import { useState } from "react";
import { Shield, Eye, Trash2, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface ConsentScreenProps {
  eventName: string;
  onConsent: () => void;
}

const privacyPoints = [
  {
    icon: Eye,
    title: "Face Matching Only",
    description: "Your selfie is used solely to find photos where you appear.",
  },
  {
    icon: Trash2,
    title: "Immediate Deletion",
    description: "Your selfie is deleted within minutes after matching.",
  },
  {
    icon: Lock,
    title: "No Identity Storage",
    description: "We don't store your name or any personal identifiers.",
  },
  {
    icon: Shield,
    title: "Private Access",
    description: "Only you can see the photos that match your face.",
  },
];

export function ConsentScreen({ eventName, onConsent }: ConsentScreenProps) {
  const [hasConsented, setHasConsented] = useState(false);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 pt-24">
      <Card variant="elevated" className="max-w-2xl w-full animate-scale-in">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl md:text-4xl">
            Welcome to {eventName}
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Before we find your photos, please review how we protect your privacy.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Privacy Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {privacyPoints.map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <point.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    {point.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Consent Checkbox */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={hasConsented}
                onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                className="mt-1"
              />
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  I understand and consent
                </span>
                <p className="text-muted-foreground mt-1">
                  I agree to have my selfie temporarily processed for face matching.
                  I understand my selfie will be deleted immediately after finding my photos.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="hero"
              size="lg"
              className="flex-1 group"
              disabled={!hasConsented}
              onClick={onConsent}
            >
              Continue to Find My Photos
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-center text-muted-foreground">
            You can request deletion of your data at any time.{" "}
            <a href="/privacy" className="text-accent hover:underline">
              View full privacy policy
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
