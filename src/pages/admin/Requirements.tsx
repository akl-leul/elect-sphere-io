import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminRoute from "@/components/auth/AdminRoute";
import { Textarea } from "@/components/ui/textarea";

const Requirements = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    election_id: "",
    title: "",
    content: "",
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
    if (!formData.election_id || !formData.title || !formData.content) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editMode && currentId) {
        const { error } = await supabase
          .from("election_requirements")
          .update({
            election_id: formData.election_id,
            title: formData.title,
            content: formData.content,
          })
          .eq("id", currentId);

        if (error) throw error;
        toast.success("Requirements updated successfully!");
      } else {
        const { error } = await supabase
          .from("election_requirements")
          .insert({
            election_id: formData.election_id,
            title: formData.title,
            content: formData.content,
          });

        if (error) throw error;
        toast.success("Requirements added successfully!");
      }

      setDialogOpen(false);
      setFormData({ election_id: "", title: "", content: "" });
      setEditMode(false);
      setCurrentId(null);
      fetchData();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save requirements");
    }
  };

  const handleEdit = (req: any) => {
    setFormData({
      election_id: req.election_id,
      title: req.title,
      content: req.content,
    });
    setCurrentId(req.id);
    setEditMode(true);
    setDialogOpen(true);
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

  const handleOpenNew = () => {
    setFormData({ election_id: "", title: "", content: "" });
    setEditMode(false);
    setCurrentId(null);
    setDialogOpen(true);
  };

  const renderFormattedContent = (content: string) => {
    // Simple markdown-like rendering
    let formatted = content
      // Headers
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return formatted;
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
            <p className="text-muted-foreground">Create and manage election requirements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Requirements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editMode ? "Edit Requirements" : "Add Requirements"}</DialogTitle>
                <DialogDescription>
                  Use markdown formatting: # for heading, **bold**, *italic*, - for list items
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
                  <Label htmlFor="content">Requirements Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter requirements with markdown formatting..."
                    rows={12}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatting: # Heading | **bold** | *italic* | - list item
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  {editMode ? "Update Requirements" : "Add Requirements"}
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
                <p className="text-muted-foreground">No requirements added yet</p>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(req)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
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
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderFormattedContent(req.content) }}
                  />
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(req.updated_at).toLocaleString()}
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
