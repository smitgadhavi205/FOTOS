import { Camera, Shield, Lock, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold">
                <Camera className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-semibold text-foreground tracking-wide">
                My<span className="text-gradient-gold italic">pic</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              A privacy-first photo gallery for events. Find your photos using AI face
              matching, without compromising your privacy.
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Privacy Promise</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>No facial data stored permanently</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>Selfies deleted after matching</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Trash2 className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>Request data deletion anytime</span>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/find-photos"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Find My Photos
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Photographer Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Mypic. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Shield className="w-4 h-4" />
              Your privacy is our priority
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
