import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LogOut, User } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

/*
  Changes:
  - Desktop avatar/initials now link to /voter/profile
  - Added an explicit "Profile" link in desktop nav
  - Mobile profile area avatar and name link to /voter/profile
*/

interface Profile {
  full_name: string;
  avatar_url?: string | null;
}

const Navbar: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        if (data) setProfile(data as Profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    navigate("/auth");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((s) => !s);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const user = session?.user;

  return (
    <nav className="sticky top-0 z-40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3"
            >
              <img
                src="https://sitedu.info/img/logo/primary-logo.webp"
                alt="SIT Logo"
                className="w-10 h-10 rounded-md object-cover shadow-sm"
              />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  SIT Election Portal
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Transparent • Secure • Local
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200"
              onClick={closeMobileMenu}
            >
              Home
            </Link>

            <Link
              to="/results"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200"
              onClick={closeMobileMenu}
            >
              Results
            </Link>

            <Link
              to="/candidates"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200"
              onClick={closeMobileMenu}
            >
              Candidates
            </Link>

            {user ? (
              <>
                <Link
                  to="/anonymous-vote"
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  onClick={closeMobileMenu}
                >
                  Vote
                </Link>

                <Link
                  to="/voter/profile"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-200"
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    Welcome,
                    <span className="font-medium ml-2">
                      {profile?.full_name ?? user.email}
                    </span>
                  </div>

                  {/* Profile avatar / initials link to profile page */}
                  <div className="flex items-center gap-2">
                    <Link
                      to="/voter/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="avatar"
                          className="w-9 h-9 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {profile?.full_name ? (
                            profile.full_name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                          ) : (
                            <User className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                          )}
                        </div>
                      )}
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button size="sm">Login</Button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <Button variant="outline" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {/* small quick action for authenticated users */}
            {user && (
              <Link
                to="/anonymous-vote"
                onClick={closeMobileMenu}
                className="inline-flex items-center"
              >
                <Button size="icon" variant="ghost" aria-label="Vote">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4"
                    />
                  </svg>
                </Button>
              </Link>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile panel (slide down) */}
      <div
        id="mobile-menu"
        className={`md:hidden transition-maxh duration-300 ease-in-out overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm ${isMobileMenuOpen ? "max-h-[1000px] py-4" : "max-h-0"}`}
      >
        <div className="container mx-auto px-4">
          <div className="space-y-3">
            {user ? (
              <>
                <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Link
                    to="/voter/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        className="w-11 h-11 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {profile?.full_name ? (
                          profile.full_name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to="/voter/profile"
                      onClick={closeMobileMenu}
                      className="text-sm font-medium text-slate-900 dark:text-white truncate"
                    >
                      {profile?.full_name ?? user.email}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Member
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                    className="whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </div>

                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Home
                </Link>

                <Link
                  to="/anonymous-vote"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  Vote
                </Link>

                <Link
                  to="/results"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Results
                </Link>

                <Link
                  to="/candidates"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Candidates
                </Link>

                <Link
                  to="/voter/profile"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  My Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Home
                </Link>

                <Link
                  to="/results"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Public Results
                </Link>

                <Link
                  to="/auth"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md"
                >
                  <Button size="sm" className="w-full">
                    Login
                  </Button>
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
