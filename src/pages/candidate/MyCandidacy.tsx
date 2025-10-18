import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { candidateSchema } from "@/lib/validation";

const MyCandidacy = () => {
  const navigate = useNavigate();
  const [candidacies, setCandidacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    fetchCandidacies();
  }, []);

  const fetchCandidacies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          election:elections(title, is_active, registration_enabled),
          position:positions(title)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCandidacies(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch candidacies");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (candidacy: any) => {
    setEditingId(candidacy.id);
    setFormData({
      biography: candidacy.biography || "",
      slogan: candidacy.slogan || "",
      social_links: candidacy.social_links || { facebook: "", twitter: "", instagram: "" },
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      const validated = candidateSchema.parse(formData);
      
      const { error } = await supabase
        .from("candidates")
        .update({
          biography: validated.biography,
          slogan: validated.slogan,
          social_links: validated.social_links,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Candidacy updated successfully");
      setEditingId(null);
      fetchCandidacies();
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error(error.message || "Failed to update candidacy");
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Candidacy withdrawn successfully");
      fetchCandidacies();
    } catch (error: any) {
      toast.error("Failed to delete candidacy");
    }
  };

  const canEditOrDelete = (candidacy: any) => {
    return !candidacy.election?.is_active && candidacy.election?.registration_enabled;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Candidacies</h1>
          <p className="text-muted-foreground">Manage your candidate registrations</p>
        </div>
        <Button onClick={() => navigate("/candidate/register")}>
          Register for New Position
        </Button>
      </div>

      {candidacies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't registered for any positions yet.</p>
            <Button onClick={() => navigate("/candidate/register")}>
              Register as Candidate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {candidacies.map((candidacy) => (
            <Card key={candidacy.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{candidacy.position?.title}</CardTitle>
                    <CardDescription>{candidacy.election?.title}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Badge variant={candidacy.is_approved ? "default" : "secondary"}>
                      {candidacy.is_approved ? "Approved" : "Pending Approval"}
                    </Badge>
                    {candidacy.election?.is_active && (
                      <Badge variant="outline">Election Active</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === candidacy.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`bio-${candidacy.id}`}>Biography</Label>
                      <Textarea
                        id={`bio-${candidacy.id}`}
                        value={formData.biography}
                        onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.biography.length}/2000 characters
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`slogan-${candidacy.id}`}>Slogan</Label>
                      <Input
                        id={`slogan-${candidacy.id}`}
                        value={formData.slogan}
                        onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.slogan.length}/200 characters
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdate(candidacy.id)}>
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold mb-1">Slogan</h3>
                      <p className="text-muted-foreground">{candidacy.slogan || "No slogan provided"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Biography</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {candidacy.biography || "No biography provided"}
                      </p>
                    </div>
                    {candidacy.campaign_logo_url && (
                      <div>
                        <h3 className="font-semibold mb-1">Campaign Logo</h3>
                        <img
                          src={candidacy.campaign_logo_url}
                          alt="Campaign logo"
                          className="w-32 h-32 object-cover rounded"
                        />
                      </div>
                    )}
                    {candidacy.manifesto_url && (
                      <div>
                        <a
                          href={candidacy.manifesto_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Manifesto
                        </a>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {canEditOrDelete(candidacy) && (
                        <>
                          <Button variant="outline" onClick={() => handleEdit(candidacy)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Withdraw
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Withdraw Candidacy?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. You can register again if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(candidacy.id)}>
                                  Withdraw
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      {!canEditOrDelete(candidacy) && (
                        <p className="text-sm text-muted-foreground">
                          Cannot edit or withdraw once voting has started
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCandidacy;
