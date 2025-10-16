import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, UserCheck, Users, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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
            <Vote className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Election Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage elections and oversee the voting process" : "Participate in elections and view results"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/elections")}>
                <CardHeader>
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Election Management</CardTitle>
                  <CardDescription>Control active elections and settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Elections</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/positions")}>
                <CardHeader>
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Position Management</CardTitle>
                  <CardDescription>Manage election positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Positions</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/voters")}>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Voter Management</CardTitle>
                  <CardDescription>View and approve registered voters</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Voters</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/candidates")}>
                <CardHeader>
                  <UserCheck className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Candidate Management</CardTitle>
                  <CardDescription>Review and approve candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Candidates</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/admins")}>
                <CardHeader>
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Admin Management</CardTitle>
                  <CardDescription>Manage system administrators</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Admins</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/results")}>
                <CardHeader>
                  <Vote className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>View Results</CardTitle>
                  <CardDescription>Election results and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Results</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/audit-logs")}>
                <CardHeader>
                  <Settings className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>System activity tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Logs</Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/voter/vote")}>
            <CardHeader>
              <Vote className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Cast Your Vote</CardTitle>
              <CardDescription>Participate in active elections</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Vote Now</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/candidate/register")}>
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

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/voter/profile")}>
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
        </div>

        {!profile?.is_approved && (
          <Card className="mt-6 bg-warning-light border-warning">
            <CardContent className="pt-6">
              <p className="text-sm">
                Your account is pending approval. You'll be able to vote once an administrator approves your registration.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;