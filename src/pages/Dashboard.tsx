import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Vote,
  UserCheck,
  Users,
  Settings,
  LogOut,
  CircleUserRound,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/analytics", { replace: true });
    }
  }, [isAdmin, navigate]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roleData);
    } catch (error: any) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-trust-light to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://sitedu.info/img/logo/primary-logo.webp"
              alt=""
              className="w-10 h-10 rounded"
            />

            <span className="text-xl font-bold">SIT Election Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {!isAdmin && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Participate in elections and view results
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {!isAdmin && <></>}

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/anonymous-vote")}
          >
            <CardHeader>
              <Vote className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>Participate in active elections</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Vote Now</Button>
            </CardContent>
          </Card>
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/PublicResults")}
          >
            <CardHeader>
              <Vote className="h-8 w-8 text-primary mb-2" />
              <CardTitle>See Results</CardTitle>
              <CardDescription>Check all Election Results</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Check Result</Button>
            </CardContent>
          </Card>
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/candidate/register")}
          >
            <CardHeader>
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Register as Candidate</CardTitle>
              <CardDescription>Apply to run in elections</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Apply Now
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/voter/profile")}
          >
            <CardHeader>
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Profile
              </Button>
            </CardContent>
          </Card>
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/candidate/my-candidacy")}
          >
            <CardHeader>
              <CircleUserRound className="h-8 w-8 text-primary mb-2" />
              <CardTitle>My Candidacy</CardTitle>
              <CardDescription>See your candiday registration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Candidacy
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/candidates")}
          >
            <CardHeader>
              <ListChecks className="h-8 w-8 text-primary mb-2" />
              <CardTitle>View Candidates</CardTitle>
              <CardDescription>
                Browse all registered candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Candidates
              </Button>
            </CardContent>
          </Card>
        </div>

        {!profile?.is_approved && (
          <Card className="mt-6 bg-warning-light border-warning">
            <CardContent className="pt-6">
              <p className="text-sm">
                Your account is pending approval. You'll be able to vote once an
                administrator approves your registration.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
