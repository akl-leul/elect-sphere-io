import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminRoute from "@/components/auth/AdminRoute";
import { Textarea } from "@/components/ui/textarea";

const Requirements = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    election_id: "",
    title: "",
    file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, elecRes] = await Promise.all([
        supabase.from("election_requirements").select("*, elections(title)").order("created_at", { ascending: false }),
        supabase.from("elections").select("*").order("created_at", { ascending: false })
      ]);

      if (reqRes.error) throw reqRes.error;
      if (elecRes.error) throw elecRes.error;

      setRequirements(reqRes.data || []);
      setElections(elecRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.election_id || !formData.title) {
      toast.error("Please fill all fields and select a file");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', formData.file);
      form.append('electionId', formData.election_id);
      form.append('title', formData.title);

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: form,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Requirements document processed and saved successfully!");
      setDialogOpen(false);
      setFormData({ election_id: "", title: "", file: null });
      fetchData();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to process document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete these requirements?")) return;

    try {
      const { error } = await supabase
        .from("election_requirements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Requirements deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Election Requirements</h1>
            <p className="text-muted-foreground">Upload and manage election requirements documents</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Requirements
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Requirements Document</DialogTitle>
                <DialogDescription>
                  Upload a PDF or document containing election requirements. Google Gemini will extract the text automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="election">Select Election</Label>
                  <Select
                    value={formData.election_id}
                    onValueChange={(value) => setFormData({ ...formData, election_id: value })}
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

                <div>
                  <Label htmlFor="title">Requirements Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Candidate Eligibility Requirements"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="file">Upload Document</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: PDF, DOC, DOCX • Max 20MB
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing with AI...
                    </>
                  ) : (
                    "Upload & Process"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {requirements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No requirements uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            requirements.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {req.title}
                      </CardTitle>
                      <CardDescription>
                        Election: {req.elections?.title || "Unknown"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {req.document_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(req.document_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Document
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(req.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={req.content}
                    readOnly
                    rows={8}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Uploaded: {new Date(req.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminRoute>
  );
};

export default Requirements;
