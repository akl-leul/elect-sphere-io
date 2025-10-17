import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCheck, Upload, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { candidateSchema } from "@/lib/validation";

const Register = () => {
  const navigate = useNavigate();
  const [elections, setElections] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [manifestoFile, setManifestoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    election_id: "",
    position_id: "",
    slogan: "",
    biography: "",
    campaign_logo_url: "",
    manifesto_url: "",
    social_links: {
      facebook: "",
      twitter: "",
      instagram: "",
    },
  });

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .eq("is_active", true)
        .eq("registration_enabled", true);

      if (error) throw error;
      setElections(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch elections");
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async (electionId: string) => {
    try {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("election_id", electionId)
        .order("display_order");

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch positions");
    }
  };

  const handleElectionChange = (electionId: string) => {
    setFormData({ ...formData, election_id: electionId, position_id: "" });
    fetchPositions(electionId);
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Validate form data
      const validated = candidateSchema.parse({
        biography: formData.biography,
        slogan: formData.slogan,
        social_links: Object.fromEntries(
          Object.entries(formData.social_links).filter(([_, v]) => v !== "")
        ),
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to register as a candidate");
        navigate("/auth");
        return;
      }

      // Check if already applied
      const { data: existing } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", user.id)
        .eq("election_id", formData.election_id)
        .eq("position_id", formData.position_id)
        .single();

      if (existing) {
        toast.error("You have already applied for this position");
        return;
      }

      // Upload files if provided
      let logoUrl = formData.campaign_logo_url;
      let manifestoUrl = formData.manifesto_url;

      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'candidate-files', `${user.id}/logos`);
      }

      if (manifestoFile) {
        manifestoUrl = await uploadFile(manifestoFile, 'candidate-files', `${user.id}/manifestos`);
      }

      const { error } = await supabase.from("candidates").insert([
        {
          user_id: user.id,
          election_id: formData.election_id,
          position_id: formData.position_id,
          slogan: validated.slogan,
          biography: validated.biography,
          campaign_logo_url: logoUrl,
          manifesto_url: manifestoUrl,
          social_links: validated.social_links,
        },
      ]);

      if (error) throw error;

      toast.success("Candidate application submitted successfully! Awaiting approval.");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error(error.message || "Failed to submit application");
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (elections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Candidate registration is not currently open
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Register as Candidate</h1>
        <p className="text-muted-foreground">Apply to run in an election</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Application</CardTitle>
          <CardDescription>
            Fill in your details to apply as a candidate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="election">Select Election</Label>
              <Select
                value={formData.election_id}
                onValueChange={handleElectionChange}
                required
              >
                <SelectTrigger id="election">
                  <SelectValue placeholder="Choose an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.election_id && (
              <div>
                <Label htmlFor="position">Select Position</Label>
                <Select
                  value={formData.position_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, position_id: value })
                  }
                  required
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Choose a position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="logo" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Campaign Logo
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload an image (JPG, PNG, WEBP) • Max 5MB
              </p>
            </div>

            <div>
              <Label htmlFor="slogan">Campaign Slogan</Label>
              <Input
                id="slogan"
                value={formData.slogan}
                onChange={(e) =>
                  setFormData({ ...formData, slogan: e.target.value })
                }
                placeholder="Your inspiring campaign slogan"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.slogan.length}/200 characters
              </p>
            </div>

            <div>
              <Label htmlFor="biography">Biography / About You</Label>
              <Textarea
                id="biography"
                value={formData.biography}
                onChange={(e) =>
                  setFormData({ ...formData, biography: e.target.value })
                }
                placeholder="Tell voters about yourself, your qualifications, experience, and goals (minimum 10 characters)..."
                rows={6}
                minLength={10}
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.biography.length}/2000 characters (min 10)
              </p>
            </div>

            <div>
              <Label htmlFor="manifesto" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manifesto / Campaign Document (Optional)
              </Label>
              <Input
                id="manifesto"
                type="file"
                accept="application/pdf,.doc,.docx"
                onChange={(e) => setManifestoFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a PDF or Word document • Max 5MB
              </p>
            </div>

            <div className="space-y-3">
              <Label>Social Media Links (Optional)</Label>
              <Input
                placeholder="Facebook URL"
                value={formData.social_links.facebook}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: {
                      ...formData.social_links,
                      facebook: e.target.value,
                    },
                  })
                }
              />
              <Input
                placeholder="Twitter URL"
                value={formData.social_links.twitter}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: {
                      ...formData.social_links,
                      twitter: e.target.value,
                    },
                  })
                }
              />
              <Input
                placeholder="Instagram URL"
                value={formData.social_links.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    social_links: {
                      ...formData.social_links,
                      instagram: e.target.value,
                    },
                  })
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your application will be reviewed by administrators before approval
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
