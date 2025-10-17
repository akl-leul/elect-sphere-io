import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vote, Shield, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";
import heroImage from "@/assets/hero-election.png";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeElections, setActiveElections] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchActiveElections();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const fetchActiveElections = async () => {
    const { count } = await supabase
      .from("elections")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    setActiveElections(count || 0);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-background/80">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Election hero background" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10">
          <div className="container mx-auto px-4 py-6 flex justify-end">
            <ThemeToggle />
          </div>

          <div className="mx-auto px-4 pt-12 pb-24 md:pt-20 md:pb-32">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Secure • Transparent • Democratic
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Your Voice</span>, Your Vote
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
                A modern, secure platform for transparent elections. Simple voting, live results, and trusted governance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
                <Button size="lg" className="w-full sm:w-auto" onClick={handleGetStarted}>
                  <Vote className="mr-2 h-5 w-5" />
                  {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                </Button>
                {!isAuthenticated && (
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/auth")}>
                    Login to Vote
                  </Button>
                )}
              </div>

              {activeElections > 0 && (
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{activeElections} Active Election{activeElections !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Why Choose Our Platform?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with security, transparency, and accessibility at its core
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure</CardTitle>
                <CardDescription>
                  End-to-end encryption and device verification ensure your vote is protected
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Vote className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Voting</CardTitle>
                <CardDescription>
                  Intuitive interface makes casting your vote simple and straightforward
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-time Results</CardTitle>
                <CardDescription>
                  Watch election results update live with transparent vote counting
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Candidate Profiles</CardTitle>
                <CardDescription>
                  Learn about candidates with detailed profiles and manifestos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of voters who trust our platform for secure, transparent elections
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleGetStarted}
          >
            {isAuthenticated ? "Go to Dashboard" : "Register Now"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Secure Election Portal. All rights reserved.</p>
          <p className="mt-2">Built with security and transparency in mind</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;