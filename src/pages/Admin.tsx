import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Admin = () => {
  const { user, isLoading: authLoading, signIn, signUp, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      // Handle specific error messages
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account.");
      } else {
        setError(signInError.message);
      }
    } else {
      toast.success("Welcome back!");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    setError(null);

    const { error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      // Handle specific error messages
      if (signUpError.message.includes("User already registered")) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        setError(signUpError.message);
      }
    } else {
      toast.success("Account created successfully! Welcome aboard.");
    }

    setIsLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("You've been signed out.");
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {user ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <AdminLogin
            onLogin={handleLogin}
            onSignUp={handleSignUp}
            isLoading={isLoading}
            error={error}
          />
        )}
      </main>
      {user && <Footer />}
    </div>
  );
};

export default Admin;
