import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Shield, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import heroImage from "@/assets/hero-election.png";

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
      const { data: { session } } = await supabase.auth.getSession();
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
    <div className="min-h-screen font-sans bg-gradient-to-br from-[#131415] to-[#323C43]">
    {/* Hero Section */}
<section className="min-h-screen font-sans bg-gradient-to-b from-transparent to-[#006400] relative">
  <div className="absolute inset-0 opacity-25">
    <img 
      src={heroImage} 
      alt="Shaggar Institute of Technology Student Council Election" 
      className="w-full h-full object-cover object-center"
    />
  </div>

  <div className="mx-auto px-4 py-20 relative z-10 h-screen flex items-center justify-center flex-col text-center">
    <div className="max-w-4xl mx-auto">
      <Badge className="mb-4 bg-primary/10 text-white border-primary/20">
        Transparent • Secure • Democratic
      </Badge>

      <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-white">
        Your Voice, Your Vote at Shaggar Institute of Technology
      </h1>

      <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
        Participate in the Shaggar Institute of Technology’s Student Council Elections. Vote with confidence on a secure and transparent platform.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
        <Button size="lg" className="w-full sm:w-auto transition-all hover:scale-105" onClick={handleGetStarted}>
          <Vote className="mr-2 h-5 w-5" />
          {isAuthenticated ? "Go to Dashboard" : "Get Started"}
        </Button>

        {!isAuthenticated && (
          <Button size="lg" variant="outline" className="w-full sm:w-auto transition-all hover:scale-105" onClick={() => navigate("/auth")}>
            Login to Vote
          </Button>
        )}
      </div>

      {activeElections > 0 && (
        <div className="inline-flex items-center gap-2 bg-success-light text-success px-4 py-2 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">{activeElections} Active Student Council Election{activeElections !== 1 ? 's' : ''}</span>
        </div>
      )}

      {loading && <p className="text-white mt-4">Loading...</p>}
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>

    {/* Scroll Indicator */}
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white cursor-pointer">
      
      <div className="mt-2 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 text-white">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7 7 7-7" />
        </svg>
      </div>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section className="py-20 bg-[#232A2D]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose Our Election Platform?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform is built with security, transparency, and accessibility at its core to ensure a seamless experience for all students.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all transform hover:scale-105 text-white">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure Voting</CardTitle>
                <CardDescription>
                  End-to-end encryption and device verification ensure your vote remains safe and confidential.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-all transform hover:scale-105 text-white">
              <CardHeader>
                <Vote className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Voting</CardTitle>
                <CardDescription>
                  Our intuitive interface makes it simple for all students to cast their votes in the Student Council Election.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-all transform hover:scale-105 text-white p-4 pt-6">
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Results</CardTitle>
              <CardDescription>
                Stay updated with live election results as the votes are counted transparently.
              </CardDescription>
            </Card>

            <Card className="border-2 hover:border-primary transition-all transform hover:scale-105 text-white  p-4 pt-6">
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Candidate Profiles</CardTitle>
              <CardDescription>
                Get to know the candidates running for the Student Council with their profiles and manifestos.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#232A2D]">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Make Your Voice Heard?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join thousands of students at Shaggar Institute of Technology in choosing the next Student Council leaders. Trust our platform for a secure and transparent voting process.
          </p>
          <Button size="lg" variant="secondary" className="transition-all hover:scale-105" onClick={handleGetStarted}>
            {isAuthenticated ? "Go to Dashboard" : "Register Now"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-[#181C1F]">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Shaggar Institute of Technology Student Council Elections. All rights reserved.</p>
          <p className="mt-2">Built with security and transparency in mind.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
