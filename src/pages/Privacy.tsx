import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { Shield, Eye, Trash2, Lock, Server, Clock, FileText } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "What We Collect",
    content: `When you use Mypic, we collect:
    
• **Selfie images**: Temporarily processed to generate a facial embedding (a mathematical representation of your face). The selfie is deleted within minutes of processing.

• **Facial embeddings**: Anonymous numerical vectors derived from photos. These cannot be reverse-engineered into images.

• **Event photos**: Uploaded by photographers with consent to use for face matching.

We do NOT collect names, email addresses, or any personally identifiable information from guests.`,
  },
  {
    icon: Server,
    title: "How We Use Your Data",
    content: `Your data is used exclusively for:

• **Face matching**: Comparing your selfie embedding against event photo embeddings to find photos you appear in.

• **Gallery display**: Showing you only the photos where your face was detected.

We never use your data for:
- Training AI models
- Advertising or marketing
- Selling to third parties
- Building facial recognition databases`,
  },
  {
    icon: Lock,
    title: "Data Security",
    content: `We implement industry-standard security measures:

• **Encryption**: All data is encrypted in transit (TLS 1.3) and at rest (AES-256).

• **Access control**: Strict authentication required for all administrative functions.

• **Infrastructure**: Hosted on secure, SOC 2 compliant cloud infrastructure.

• **Audit logging**: All access to sensitive data is logged and monitored.`,
  },
  {
    icon: Trash2,
    title: "Data Retention & Deletion",
    content: `We minimize data retention:

• **Selfies**: Deleted within 5 minutes of processing.

• **Guest embeddings**: Deleted after matching is complete.

• **Event photos**: Retained for the duration specified by the photographer, then deleted.

• **Request deletion**: You can request complete deletion of any data at any time by contacting us.`,
  },
  {
    icon: Clock,
    title: "Your Rights",
    content: `You have the right to:

• **Access**: Request a copy of any data we have about you.

• **Deletion**: Request immediate deletion of all your data.

• **Withdraw consent**: Stop using the service at any time.

• **Portability**: Receive your data in a portable format.

To exercise these rights, contact us at privacy@facefind.app`,
  },
  {
    icon: FileText,
    title: "Legal Basis",
    content: `Our legal basis for processing:

• **Consent**: You explicitly consent before any face matching occurs.

• **Legitimate interest**: Photographers have a legitimate interest in providing photo delivery services to event guests.

• **Contractual necessity**: Processing is necessary to fulfill the service you've requested.

We comply with GDPR, CCPA, and other applicable privacy regulations.`,
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy — Mypic AI Photo Gallery"
        description="How Mypic protects your privacy: selfies deleted after matching, anonymous face embeddings, no personal data stored, no third-party sharing."
        path="/privacy"
      />
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              At Mypic, privacy isn't just a feature—it's our foundation. 
              This policy explains exactly how we handle your data.
            </p>
          </div>

          {/* Sections */}
          <div className="max-w-3xl mx-auto space-y-8">
            {sections.map((section, index) => (
              <div
                key={section.title}
                className="p-6 md:p-8 rounded-2xl border border-border bg-card animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-4">
                      {section.title}
                    </h2>
                    <div className="prose prose-sm text-muted-foreground">
                      {section.content.split("\n").map((line, i) => (
                        <p key={i} className="mb-2 last:mb-0">
                          {line.startsWith("•") ? (
                            <span dangerouslySetInnerHTML={{ 
                              __html: line.replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>") 
                            }} />
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="max-w-3xl mx-auto mt-12 p-6 rounded-2xl bg-secondary/50 border border-border text-center">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Questions or Concerns?
            </h3>
            <p className="text-muted-foreground mb-4">
              We're here to help with any privacy-related questions.
            </p>
            <a
              href="mailto:privacy@facefind.app"
              className="text-accent hover:underline font-medium"
            >
              privacy@facefind.app
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
