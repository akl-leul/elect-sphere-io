import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, Ban, UserCheck, Image as ImageIcon, FileText, ExternalLink, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminRoute from "@/components/auth/AdminRoute";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Voters = () => {
  const [voters, setVoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", gender: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVoters(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch voters");
    } finally {
      setLoading(false);
      setSelected([]);
    }
  };

  const resolveObjectPath = (value: string): string => {
    try {
      const url = new URL(value);
      const publicIdx = url.pathname.indexOf('/object/');
      if (publicIdx !== -1) {
        const afterObject = url.pathname.substring(publicIdx + '/object/'.length);
        const parts = afterObject.split('/');
        const startIdx = parts[0] === 'public' || parts[0] === 'signed' ? 1 : 0;
        const bucket = parts[startIdx];
        const key = parts.slice(startIdx + 1).join('/');
        if (bucket === 'voter-documents') return key;
      }
      const marker = '/voter-documents/';
      const idx = value.indexOf(marker);
      if (idx !== -1) return value.substring(idx + marker.length);
    } catch (_) {
      return value;
    }
    return value;
  };

  const openId = async (path: string) => {
    try {
      const key = resolveObjectPath(path);
      const { data, error } = await supabase.storage.from('voter-documents').createSignedUrl(key, 60);
      if (error || !data?.signedUrl) throw error || new Error('No URL');
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e: any) {
      try {
        const key = resolveObjectPath(path);
        const { data: fileData, error: dlErr } = await supabase.storage.from('voter-documents').download(key);
        if (dlErr || !fileData) throw dlErr || new Error('No file');
        const url = URL.createObjectURL(fileData);
        window.open(url, '_blank', 'noopener');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        toast.error("Failed to open ID document");
      }
    }
  };

  const handleApprove = async (voterId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .eq("id", voterId);

      if (error) throw error;
      toast.success("Voter approved successfully");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // BULK approve
  const handleBulkApprove = async () => {
    if (!selected.length) {
      toast.error("No voters selected");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true })
        .in("id", selected);
      if (error) throw error;
      toast.success("Selected voters approved");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSuspend = async (voterId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: suspend })
        .eq("id", voterId);

      if (error) throw error;
      toast.success(suspend ? "Voter suspended" : "Voter reactivated");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // BULK suspend
  const handleBulkSuspend = async (suspend: boolean) => {
    if (!selected.length) {
      toast.error("No voters selected");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: suspend })
        .in("id", selected);
      if (error) throw error;
      toast.success(suspend ? "Selected voters suspended" : "Selected voters reactivated");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // BULK delete
  const handleBulkDelete = async () => {
    if (!selected.length) {
      toast.error("No voters selected");
      return;
    }
    if (!confirm(`Delete ${selected.length} voters? This can't be undone.`)) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .in("id", selected);
      if (error) throw error;
      toast.success("Selected voters deleted");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // BULK reject (set is_approved: false)
  const handleBulkReject = async () => {
    if (!selected.length) {
      toast.error("No voters selected");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: false })
        .in("id", selected);
      if (error) throw error;
      toast.success("Selected voters rejected");
      fetchVoters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleOpenEdit = (voter: any) => {
    setEditingVoter(voter);
    setEditForm({ full_name: voter.full_name || "", phone: voter.phone || "", gender: voter.gender || "" });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoter) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editForm.full_name, phone: editForm.phone, gender: editForm.gender })
        .eq('id', editingVoter.id);
      if (error) throw error;
      toast.success('Voter updated');
      setEditDialogOpen(false);
      fetchVoters();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleClearId = async (voterId: string) => {
    if (!confirm('Remove identification document for this voter?')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ identification_url: null })
        .eq('id', voterId);
      if (error) throw error;
      toast.success('ID document cleared');
      fetchVoters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear');
    }
  };

  const handleDelete = async (voterId: string) => {
    if (!confirm('Are you sure you want to delete this voter? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', voterId);
      if (error) throw error;
      toast.success('Voter deleted successfully');
      fetchVoters();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete voter');
    }
  };

  const filteredVoters = voters.filter(
    (voter) =>
      voter.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Derived selectAll from current selection and visible paginated rows
  const selectAll = paginatedVoters.length > 0 && paginatedVoters.every(v => selected.includes(v.id));

  // Handler for master checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Add ids from visible page if not already selected
      setSelected(prev => {
        const newSet = new Set(prev);
        paginatedVoters.forEach(voter => newSet.add(voter.id));
        return Array.from(newSet);
      });
    } else {
      // Remove ids of visible page from selection
      setSelected(prev => prev.filter(id => !paginatedVoters.some(v => v.id === id)));
    }
  };

  // Handler for single selection
  const handleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Voter Management</h1>
          <p className="text-muted-foreground">Approve, suspend, reject, or manage registered voters</p>
        </div>

        {/* Bulk action bar */}
        <div className="mb-4 flex gap-2">
          <Button size="sm" variant="default" onClick={handleBulkApprove}>Bulk Approve</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>Bulk Delete</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkSuspend(true)}>Bulk Suspend</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkSuspend(false)}>Bulk Reactivate</Button>
          <Button size="sm" variant="outline" onClick={handleBulkReject}>Bulk Reject</Button>
          <span className="text-sm text-muted-foreground ml-2">{selected.length} selected</span>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      indeterminate={!selectAll && selected.some(id => paginatedVoters.some(v => v.id === id))}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Avatar</TableHead>
                  <TableHead>ID Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVoters.map((voter) => (
                  <TableRow key={voter.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.includes(voter.id)}
                        onChange={() => handleSelect(voter.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{voter.full_name}</TableCell>
                    <TableCell>{voter.email}</TableCell>
                    <TableCell>{voter.phone || "N/A"}</TableCell>
                    <TableCell className="capitalize">{voter.gender || "N/A"}</TableCell>
                    <TableCell>
                      {voter.avatar_url ? (
                        <img src={voter.avatar_url} alt={`${voter.full_name} avatar`} className="h-10 w-10 rounded object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {voter.identification_url ? (
                        <button
                          className="inline-flex items-center gap-1 text-primary underline"
                          onClick={() => openId(voter.identification_url)}
                          type="button"
                        >
                          <FileText className="h-4 w-4" />
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {voter.is_approved ? (
                          <Badge variant="default">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {voter.is_suspended && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(voter.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog open={editDialogOpen && editingVoter?.id === voter.id} onOpenChange={(o) => setEditDialogOpen(o)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(voter)}>Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Voter</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                              <div>
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input id="full_name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
                              </div>
                               <div>
                                 <Label htmlFor="phone">Phone</Label>
                                 <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                               </div>
                               <div>
                                 <Label htmlFor="gender">Gender</Label>
                                 <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Select gender" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="male">Male</SelectItem>
                                     <SelectItem value="female">Female</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div className="flex justify-end gap-2">
                                 <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                                 <Button type="submit">Save</Button>
                               </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        {!voter.is_approved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(voter.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {voter.identification_url && (
                          <Button size="sm" variant="outline" onClick={() => handleClearId(voter.id)}>Clear ID</Button>
                        )}
                        {voter.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(voter.id, false)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSuspend(voter.id, true)}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                        {/* Delete button */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(voter.id)}
                          title="Delete voter"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedVoters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No voters found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredVoters.length)} of {filteredVoters.length} voters
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminRoute>
  );
};

export default Voters;
