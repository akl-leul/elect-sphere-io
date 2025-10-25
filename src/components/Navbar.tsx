import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

// --- TYPE DEFINITIONS ---
interface Profile {
  full_name: string;
  role: string;
}

// --- COMPONENT DEFINITION ---
const Navbar: React.FC = () => {
  // --- STATE ---
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- EFFECTS ---
  // Effect to manage user session and authentication state changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Navbar Auth State Change:", session);
        setSession(session);
      },
    );

    // Cleanup subscription on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Effect to fetch user profile when the session is active.
  useEffect(() => {
    setLoading(true);
    if (session?.user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", session.user.id)
            .single();

          if (error) throw error;

          console.log("Navbar Profile Data:", data);
          if (data) {
            setProfile(data);
            setIsAdmin(data.role === "admin");
          } else {
            // If no profile found, assume not an admin
            setIsAdmin(false);
          }
        } catch (error: any) {
          console.error("Error fetching profile:", error.message);
          setIsAdmin(false);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setProfile(null);
      setIsAdmin(true);
      setLoading(false);
    }
  }, [session]);

  // --- HANDLERS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
    navigate("/auth"); // Redirect to login page
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const user = session?.user;

  // --- RENDER LOGIC ---
  console.log("Navbar Render State:", {
    loading,
    isAdmin,
    profile,
    user: session?.user,
  });
  if (loading) {
    return null; // Prevent rendering until user role is confirmed
  }

  if (isAdmin) {
    return null; // Hide navbar for admin users
  }
  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center gap-2">
            <img
              src="https://sitedu.info/img/logo/primary-logo.webp"
              alt="SIT Logo"
              className="w-10 h-10 rounded"
            />
            <Link
              to="/"
              className="text-xl font-bold"
              onClick={closeMobileMenu}
            >
              SIT Election Portal
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  to="/anonymous-vote"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Vote
                </Link>
                <Link
                  to="/results"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Results
                </Link>
                <Link
                  to="/candidates"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Candidates
                </Link>
                <Link
                  to="/voter/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Profile
                </Link>
                <span className="text-sm text-muted-foreground">
                  Welcome, {profile?.full_name || user.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-red-600 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Home
                </Link>
                <Link
                  to="/results"
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Public Results
                </Link>
                <Button asChild size="sm">
                  <Link to="/auth">Login</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMobileMenu}
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">Welcome,</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {profile?.full_name || user.email}
                  </p>
                </div>
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
                <Link
                  to="/anonymous-vote"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Anonymous Vote
                </Link>
                <Link
                  to="/results"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Results
                </Link>
                <Link
                  to="/candidates"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Candidates
                </Link>
                <Link
                  to="/candidate/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Become a Candidate
                </Link>
                <Link
                  to="/candidate/my-candidacy"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  My Candidacy
                </Link>
                <Link
                  to="/voter/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  My Profile
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
                <Link
                  to="/results"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Public Results
                </Link>
                <Link
                  to="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
