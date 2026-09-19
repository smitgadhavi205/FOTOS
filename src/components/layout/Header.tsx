import { Camera, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold transition-transform group-hover:scale-105">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-semibold text-foreground tracking-wide">
              My<span className="text-gradient-gold italic">pic</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <Link
              to="/find-photos"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Find My Photos
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Privacy First</span>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link to="/">
                <Button variant="ghost" size="sm">
                  Exit Admin
                </Button>
              </Link>
            ) : (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  Photographer Login
                </Button>
              </Link>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <nav className="flex flex-col gap-3">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/find-photos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find My Photos
              </Link>
              <Link
                to="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Photographer Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
