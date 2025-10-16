import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          *,
          profiles:user_id (id, email, full_name, created_at)
        `)
        .eq("role", "admin");

      if (error) throw error;
      setAdmins(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (userError || !userData) {
        toast.error("User with this email not found. They must register first.");
        return;
      }

      // Check if already admin
      const { data: existingAdmin } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userData.id)
        .eq("role", "admin")
        .single();

      if (existingAdmin) {
        toast.error("This user is already an admin");
        return;
      }

      // Add admin role
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userData.id, role: "admin" }]);

      if (error) throw error;

      toast.success("Admin added successfully");
      setDialogOpen(false);
      setEmail("");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRemoveAdmin = async (userId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${adminName}?`)) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast.success("Admin removed successfully");
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Management</h1>
          <p className="text-muted-foreground">Manage system administrators</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Enter the email address of a registered user to grant admin access
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Admin</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{admin.profiles?.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{admin.profiles?.email}</TableCell>
                  <TableCell>{new Date(admin.profiles?.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveAdmin(admin.user_id, admin.profiles?.full_name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No admins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admins;
