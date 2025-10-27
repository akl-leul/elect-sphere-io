import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Shield, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-election.jpg";

/*
  Ethiopian theme:
  - Primary palette: green (#0a8a3b), yellow (#f2c94c), red (#e03b2d)
  - Accent neutrals kept dark for contrast
  - Subtle flag-gradient overlays and patterned accent for hero
*/

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeElections, setActiveElections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchActiveElections();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (err) {
      setError("Error checking authentication.");
    }
  };

  const fetchActiveElections = async () => {
    try {
      const { count } = await supabase
        .from("elections")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      setActiveElections(count || 0);
      setLoading(false);
    } catch (err) {
      setError("Error fetching active elections.");
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-[#071017] via-[#0b1216] to-[#0f171a] text-white">
      {/* Hero */}
      <section className="relative w-full">
        {/* background image */}
        <div className="relative h-[80vh] md:h-[72vh] lg:h-[84vh] overflow-hidden">
          <img
            src={heroImage}
            alt="Election hero"
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-50"
            loading="lazy"
          />

          {/* Ethiopian flag gradient overlay (top-left green, center yellow, bottom-right red) */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(120deg, rgba(10,138,59,0.18) 0%, rgba(242,201,76,0.14) 45%, rgba(224,59,45,0.16) 100%)",
                mixBlendMode: "overlay",
              }}
            />
            {/* subtle decorative sash */}
            <svg
              className="absolute -left-20 -top-10 opacity-12 w-96 h-96"
              viewBox="0 0 600 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M600 0C450 100 300 100 0 600V0H600Z" fill="#F2C94C" />
            </svg>
          </div>

          {/* content */}
          <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-28 lg:py-32 flex flex-col items-center text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20 px-4 py-1 rounded-full text-sm">
              Transparent • Secure • Democratic
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-4 bg-clip-text text-white">
              <span className="inline-block">Your Voice, Your Vote</span>
              <br />
              <span className="text-[#F2C94C]">
                Shaggar Institute of Technology
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm sm:text-base text-white/90">
              Participate in the Student Council Elections on a secure,
              accessible, and transparent platform built for students.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
              <Button
                size="lg"
                className="bg-[#0a8a3b] hover:bg-[#0a7a35] border-transparent text-white shadow-lg flex items-center gap-2 px-6 py-3"
                onClick={handleGetStarted}
              >
                <Vote className="h-5 w-5" />
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </Button>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-yellow-300 text-yellow-300 hover:bg-white/5 px-6 py-3"
                  onClick={() => navigate("/auth")}
                >
                  Login to Vote
                </Button>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-white/6 px-4 py-2 rounded-full border border-white/6">
                <CheckCircle2 className="h-4 w-4 text-[#0a8a3b]" />
                <span className="text-sm">
                  {activeElections} Active Election
                  {activeElections !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/4 border border-white/6">
                <Shield className="h-4 w-4 text-[#F2C94C]" />
                <span className="text-sm">End-to-end Privacy</span>
              </div>
            </div>

            {loading && (
              <p className="mt-4 text-sm text-white/70">Loading...</p>
            )}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </div>

          {/* Hero bottom rounded panel */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-12 md:h-16 bg-gradient-to-b from-transparent to-[#0b1216]" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#0b1216]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Why choose our platform?
            </h2>
            <p className="mt-3 text-sm text-white/80">
              Built with local context and international best practices to
              ensure every vote counts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-[#071017] border border-white/6 p-4 hover:scale-105 transition-transform">
              <CardHeader className="flex flex-col items-start gap-2">
                <div className="p-3 rounded-md bg-[#0a8a3b]/10 text-[#0a8a3b]">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-white">
                  Secure Voting
                </CardTitle>
                <CardDescription className="text-sm text-white/80">
                  End-to-end encryption and verification keep every ballot
                  private and authentic.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[#071017] border border-white/6 p-4 hover:scale-105 transition-transform">
              <CardHeader className="flex flex-col items-start gap-2">
                <div className="p-3 rounded-md bg-[#F2C94C]/10 text-[#F2C94C]">
                  <Vote className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-white">
                  Easy to Use
                </CardTitle>
                <CardDescription className="text-sm text-white/80">
                  A simple, accessible interface designed for all students
                  across devices.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[#071017] border border-white/6 p-4 hover:scale-105 transition-transform">
              <CardHeader className="flex flex-col items-start gap-2">
                <div className="p-3 rounded-md bg-[#e03b2d]/10 text-[#e03b2d]">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-white">
                  Live Results
                </CardTitle>
                <CardDescription className="text-sm text-white/80">
                  Transparent result updates so the community can follow the
                  count in real time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[#071017] border border-white/6 p-4 hover:scale-105 transition-transform">
              <CardHeader className="flex flex-col items-start gap-2">
                <div className="p-3 rounded-md bg-[#0a8a3b]/10 text-[#0a8a3b]">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-white">
                  Candidate Profiles
                </CardTitle>
                <CardDescription className="text-sm text-white/80">
                  Read candidate statements and manifestos before casting your
                  ballot.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-gradient-to-b from-[#071017] to-[#091013]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to make your voice heard?
            </h3>
            <p className="text-sm text-white/80 mb-6">
              Join students across Shaggar Institute of Technology on a secure,
              locally-minded voting platform.
            </p>

            <div className="flex justify-center gap-3 flex-wrap">
              <Button
                size="lg"
                className="bg-[#0a8a3b] hover:bg-[#0a7a35] px-6 py-3 text-white"
                onClick={handleGetStarted}
              >
                {isAuthenticated ? "Go to Dashboard" : "Register Now"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-6 bg-[#061014]">
        <div className="container mx-auto px-4 text-center text-sm text-white/70">
          <div className="max-w-3xl mx-auto space-y-2">
            <p>
              © {new Date().getFullYear()} Shaggar Institute of Technology
              Student Council Elections.
            </p>
            <p>Built with security, accessibility, and transparency in mind.</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="inline-block w-4 h-4 rounded-full bg-[#0a8a3b]" />
              <span className="inline-block w-4 h-4 rounded-full bg-[#F2C94C]" />
              <span className="inline-block w-4 h-4 rounded-full bg-[#e03b2d]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
