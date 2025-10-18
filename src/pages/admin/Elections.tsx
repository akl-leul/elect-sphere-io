import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminRoute from "@/components/auth/AdminRoute";
import { electionSchema } from "@/lib/validation";

const Elections = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: false,
    registration_enabled: true,
    results_visible: false,
  });

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch elections");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      const validated = electionSchema.parse({
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      const dataToSubmit = {
        ...validated,
        is_active: formData.is_active,
        registration_enabled: formData.registration_enabled,
        results_visible: formData.results_visible,
      };

      if (editingElection) {
        const { error } = await supabase
          .from("elections")
          .update(dataToSubmit)
          .eq("id", editingElection.id);

        if (error) throw error;
        toast.success("Election updated successfully");
      } else {
        const { error } = await supabase
          .from("elections")
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success("Election created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchElections();
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error(error.message || "Failed to save election");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this election?")) return;

    try {
      const { error } = await supabase
        .from("elections")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Election deleted successfully");
      fetchElections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (election: any) => {
    setEditingElection(election);
    setFormData({
      title: election.title,
      description: election.description || "",
      start_date: election.start_date ? new Date(election.start_date).toISOString().slice(0, 16) : "",
      end_date: election.end_date ? new Date(election.end_date).toISOString().slice(0, 16) : "",
      is_active: election.is_active,
      registration_enabled: election.registration_enabled,
      results_visible: election.results_visible,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingElection(null);
    setFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      is_active: false,
      registration_enabled: true,
      results_visible: false,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Election Management</h1>
            <p className="text-muted-foreground">Create and manage elections</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Election
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingElection ? "Edit Election" : "Create New Election"}</DialogTitle>
                <DialogDescription>
                  Fill in the details to {editingElection ? "update" : "create"} an election
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date & Time</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date & Time</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active Election</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="registration_enabled">Registration Enabled</Label>
                    <Switch
                      id="registration_enabled"
                      checked={formData.registration_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, registration_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="results_visible">Results Visible</Label>
                    <Switch
                      id="results_visible"
                      checked={formData.results_visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, results_visible: checked })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingElection ? "Update" : "Create"} Election
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {elections.map((election) => (
            <Card key={election.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {election.title}
                      {election.is_active && (
                        <span className="px-2 py-1 text-xs bg-success/20 text-success rounded-full">Active</span>
                      )}
                    </CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(election)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(election.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Start: {election.start_date ? new Date(election.start_date).toLocaleString() : "Not set"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>End: {election.end_date ? new Date(election.end_date).toLocaleString() : "Not set"}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <span className={`text-sm ${election.registration_enabled ? "text-success" : "text-muted-foreground"}`}>
                    Registration: {election.registration_enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className={`text-sm ${election.results_visible ? "text-success" : "text-muted-foreground"}`}>
                    Results: {election.results_visible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {elections.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No elections created yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Election
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminRoute>
  );
};

export default Elections;
