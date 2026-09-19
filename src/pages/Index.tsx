import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedGallery } from "@/components/home/FeaturedGallery";
import { EventsSection } from "@/components/home/EventsSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PrivacySection } from "@/components/home/PrivacySection";
import { CTASection } from "@/components/home/CTASection";
import { SEO } from "@/components/SEO";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Mypic find my photos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Upload a quick selfie and our AI compares your facial embedding against every event photo, instantly returning only the ones you appear in.",
      },
    },
    {
      "@type": "Question",
      name: "Is Mypic private and secure?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your selfie is deleted within minutes, we store only anonymous face embeddings, and galleries are never indexed by search engines.",
      },
    },
    {
      "@type": "Question",
      name: "What events does Mypic support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Weddings, birthday parties, corporate events, galas, and any celebration where a photographer wants to deliver guest photos effortlessly.",
      },
    },
  ],
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mypic — AI Photo Finder for Weddings, Birthdays & Events"
        description="Upload a selfie and instantly find every wedding, birthday and event photo you appear in. Privacy-first AI photo gallery for guests and photographers."
        path="/"
        jsonLd={faqJsonLd}
      />
      <Header />
      <main>
        <EventsSection />
        <HeroSection />
        <FeaturedGallery />
        <HowItWorksSection />
        <TestimonialsSection />
        <PrivacySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
