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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Edit, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { candidateSchema } from "@/lib/validation";

const MyCandidacy = () => {
  const navigate = useNavigate();
  const [candidacies, setCandidacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedManifestoFile, setSelectedManifestoFile] =
    useState<File | null>(null);

  useEffect(() => {
    fetchCandidacies();
  }, []);

  const fetchCandidacies = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("candidates")
        .select(
          `
          *,
          election:elections(title, is_active, registration_enabled),
          position:positions(title)
        `,
        )
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
      social_links: candidacy.social_links || {
        facebook: "",
        twitter: "",
        instagram: "",
      },
      campaign_logo_url: candidacy.campaign_logo_url || "", // Keep URL in formData
      manifesto_url: candidacy.manifesto_url || "", // Keep URL in formData
    });
    setSelectedLogoFile(null); // Clear selected files when starting edit
    setSelectedManifestoFile(null);
  };

  const handleUpdate = async (id: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to update your candidacy.");
        return;
      }

      const validated = candidateSchema.parse(formData);
      let updatedLogoUrl = validated.campaign_logo_url; // Start with current URL or empty
      let updatedManifestoUrl = validated.manifesto_url; // Start with current URL or empty

      // Handle campaign logo upload
      if (selectedLogoFile) {
        const fileExtension = selectedLogoFile.name.split(".").pop();
        const path = `${user.id}/${id}/logo_${Date.now()}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("candidate-files") // Using 'candidate-files' bucket
          .upload(path, selectedLogoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading logo:", uploadError);
          toast.error("Failed to upload campaign logo");
          return;
        }
        const { data: publicUrlData } = supabase.storage
          .from("candidate-files")
          .getPublicUrl(path);
        updatedLogoUrl = publicUrlData.publicUrl;
      } else if (formData.campaign_logo_url === "") {
        // If no new file selected and user cleared the URL field
        updatedLogoUrl = "";
      }

      // Handle manifesto upload
      if (selectedManifestoFile) {
        const fileExtension = selectedManifestoFile.name.split(".").pop();
        const path = `${user.id}/${id}/manifesto_${Date.now()}.${fileExtension}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("candidate-files") // Using 'candidate-files' bucket
          .upload(path, selectedManifestoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading manifesto:", uploadError);
          toast.error("Failed to upload manifesto");
          return;
        }
        const { data: publicUrlData } = supabase.storage
          .from("candidate-files")
          .getPublicUrl(path);
        updatedManifestoUrl = publicUrlData.publicUrl;
      } else if (formData.manifesto_url === "") {
        // If no new file selected and user cleared the URL field
        updatedManifestoUrl = "";
      }

      const { error } = await supabase
        .from("candidates")
        .update({
          biography: validated.biography,
          slogan: validated.slogan,
          social_links: validated.social_links,
          campaign_logo_url: updatedLogoUrl,
          manifesto_url: updatedManifestoUrl,
        })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Candidacy updated successfully for ID:", id);
      toast.success("Candidacy updated successfully");
      setEditingId(null);
      setSelectedLogoFile(null);
      setSelectedManifestoFile(null);
      fetchCandidacies();
    } catch (error: any) {
      console.error("Error during candidacy update:", error);
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error(error.message || "Failed to update candidacy");
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("candidates").delete().eq("id", id);

      if (error) throw error;

      toast.success("Candidacy withdrawn successfully");
      fetchCandidacies();
    } catch (error: any) {
      toast.error("Failed to delete candidacy");
    }
  };

  const canEditOrDelete = (candidacy: any) => {
    return (
      !candidacy.election?.is_active && candidacy.election?.registration_enabled
    );
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
          <p className="text-muted-foreground">
            Manage your candidate registrations
          </p>
        </div>
        <Button onClick={() => navigate("/candidate/register")}>
          Register for New Position
        </Button>
      </div>

      {candidacies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't registered for any positions yet.
            </p>
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
                    <CardDescription>
                      {candidacy.election?.title}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Badge
                      variant={candidacy.is_approved ? "default" : "secondary"}
                    >
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            biography: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, slogan: e.target.value })
                        }
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.slogan.length}/200 characters
                      </p>
                    </div>
                    <div>
                      <Label htmlFor={`facebook-${candidacy.id}`}>
                        Facebook
                      </Label>
                      <Input
                        id={`facebook-${candidacy.id}`}
                        value={formData.social_links.facebook || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social_links: {
                              ...formData.social_links,
                              facebook: e.target.value,
                            },
                          })
                        }
                        placeholder="https://facebook.com/yourprofile"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`twitter-${candidacy.id}`}>Twitter</Label>
                      <Input
                        id={`twitter-${candidacy.id}`}
                        value={formData.social_links.twitter || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social_links: {
                              ...formData.social_links,
                              twitter: e.target.value,
                            },
                          })
                        }
                        placeholder="https://twitter.com/yourprofile"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`instagram-${candidacy.id}`}>
                        Instagram
                      </Label>
                      <Input
                        id={`instagram-${candidacy.id}`}
                        value={formData.social_links.instagram || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            social_links: {
                              ...formData.social_links,
                              instagram: e.target.value,
                            },
                          })
                        }
                        placeholder="https://instagram.com/yourprofile"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`logo-upload-${candidacy.id}`}>
                        Campaign Logo
                      </Label>
                      <Input
                        id={`logo-upload-${candidacy.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSelectedLogoFile(
                            e.target.files ? e.target.files[0] : null,
                          )
                        }
                      />
                      {(selectedLogoFile || formData.campaign_logo_url) && (
                        <div className="mt-2 flex items-center gap-2">
                          {selectedLogoFile ? (
                            <img
                              src={URL.createObjectURL(selectedLogoFile)}
                              alt="New campaign logo preview"
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : (
                            formData.campaign_logo_url && (
                              <img
                                src={formData.campaign_logo_url}
                                alt="Current campaign logo"
                                className="w-20 h-20 object-cover rounded"
                              />
                            )
                          )}
                          <p className="text-sm text-muted-foreground">
                            {selectedLogoFile
                              ? selectedLogoFile.name
                              : formData.campaign_logo_url
                                ? "Current logo"
                                : ""}
                          </p>
                          {formData.campaign_logo_url && !selectedLogoFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  campaign_logo_url: "",
                                })
                              }
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`manifesto-upload-${candidacy.id}`}>
                        Manifesto (PDF)
                      </Label>
                      <Input
                        id={`manifesto-upload-${candidacy.id}`}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setSelectedManifestoFile(
                            e.target.files ? e.target.files[0] : null,
                          )
                        }
                      />
                      {(selectedManifestoFile || formData.manifesto_url) && (
                        <div className="mt-2 flex items-center gap-2">
                          {selectedManifestoFile ? (
                            <p className="text-sm text-muted-foreground">
                              {selectedManifestoFile.name}
                            </p>
                          ) : (
                            formData.manifesto_url && (
                              <a
                                href={formData.manifesto_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                              >
                                <ExternalLink className="h-4 w-4" /> Current
                                Manifesto
                              </a>
                            )
                          )}
                          {formData.manifesto_url && !selectedManifestoFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setFormData({ ...formData, manifesto_url: "" })
                              }
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdate(candidacy.id)}>
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold mb-1">Slogan</h3>
                      <p className="text-muted-foreground">
                        {candidacy.slogan || "No slogan provided"}
                      </p>
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
                          <Button
                            variant="outline"
                            onClick={() => handleEdit(candidacy)}
                          >
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
                                <AlertDialogTitle>
                                  Withdraw Candidacy?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. You can register
                                  again if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(candidacy.id)}
                                >
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
