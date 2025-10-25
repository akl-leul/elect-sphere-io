import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminRoute from "@/components/auth/AdminRoute";

const Candidates = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select(`
          *,
          profiles:user_id (full_name, email),
          elections:election_id (title),
          positions:position_id (title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch candidates");
    } finally {
      setLoading(false);
      setSelected([]);
    }
  };

  const handleApprove = async (candidateId: string) => {
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ is_approved: true })
        .eq("id", candidateId);

      if (error) throw error;
      toast.success("Candidate approved successfully");
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (candidateId: string) => {
    if (!confirm("Are you sure you want to reject this candidate application?")) return;

    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;
      toast.success("Candidate application rejected");
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk approve selected
  const handleBulkApprove = async () => {
    if (!selected.length) {
      toast.error("No candidates selected");
      return;
    }
    try {
      const { error } = await supabase
        .from("candidates")
        .update({ is_approved: true })
        .in("id", selected);
      if (error) throw error;
      toast.success("Selected candidates approved");
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Bulk reject selected (delete)
  const handleBulkReject = async () => {
    if (!selected.length) {
      toast.error("No candidates selected");
      return;
    }
    if (!confirm(`Reject (delete) ${selected.length} candidates? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from("candidates")
        .delete()
        .in("id", selected);
      if (error) throw error;
      toast.success("Selected candidates rejected");
      fetchCandidates();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.positions?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Derived selectAll from current selection and visible paginated rows
  const selectAll = paginatedCandidates.length > 0 && paginatedCandidates.every(v => selected.includes(v.id));
  const someSelected = !selectAll && selected.some(id => paginatedCandidates.some(v => v.id === id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Handler for master checkbox
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(prev => {
        const newSet = new Set(prev);
        paginatedCandidates.forEach(candidate => newSet.add(candidate.id));
        return Array.from(newSet);
      });
    } else {
      setSelected(prev => prev.filter(id => !paginatedCandidates.some(v => v.id === id)));
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
          <h1 className="text-4xl font-bold mb-2">Candidate Management</h1>
          <p className="text-muted-foreground">Review and approve candidate applications</p>
        </div>

        {/* Bulk action bar */}
        <div className="mb-4 flex gap-2">
          <Button size="sm" variant="default" onClick={handleBulkApprove}>Bulk Approve</Button>
          <Button size="sm" variant="destructive" onClick={handleBulkReject}>Bulk Reject</Button>
          <span className="text-sm text-muted-foreground ml-2">{selected.length} selected</span>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or position..."
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
                      ref={selectAllRef}
                      type="checkbox"
                      checked={selectAll}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Election</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCandidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.includes(candidate.id)}
                        onChange={() => handleSelect(candidate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{candidate.profiles?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {candidate.campaign_logo_url ? (
                        <img
                          src={candidate.campaign_logo_url}
                          alt={`${candidate.profiles?.full_name} logo`}
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded border bg-muted" />
                      )}
                    </TableCell>
                    <TableCell>{candidate.elections?.title}</TableCell>
                    <TableCell>{candidate.positions?.title}</TableCell>
                    <TableCell>
                      {candidate.is_approved ? (
                        <Badge variant="default">Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(candidate.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!candidate.is_approved && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(candidate.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(candidate.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedCandidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No candidates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCandidates.length)} of {filteredCandidates.length} candidates
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

        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Candidate Information</h3>
                  <p><strong>Name:</strong> {selectedCandidate.profiles?.full_name}</p>
                  <p><strong>Email:</strong> {selectedCandidate.profiles?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedCandidate.campaign_logo_url && (
                    <img
                      src={selectedCandidate.campaign_logo_url}
                      alt="Campaign logo"
                      className="h-20 w-20 rounded object-cover border"
                    />
                  )}
                  {selectedCandidate.manifesto_url && (
                    <a
                      href={selectedCandidate.manifesto_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      View manifesto
                    </a>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Application Details</h3>
                  <p><strong>Election:</strong> {selectedCandidate.elections?.title}</p>
                  <p><strong>Position:</strong> {selectedCandidate.positions?.title}</p>
                </div>
                {selectedCandidate.slogan && (
                  <div>
                    <h3 className="font-semibold mb-1">Campaign Slogan</h3>
                    <p className="italic">{selectedCandidate.slogan}</p>
                  </div>
                )}
                {selectedCandidate.biography && (
                  <div>
                    <h3 className="font-semibold mb-1">Biography</h3>
                    <p className="text-sm">{selectedCandidate.biography}</p>
                  </div>
                )}
                {selectedCandidate.social_links && (
                  <div>
                    <h3 className="font-semibold mb-1">Social Links</h3>
                  <div className="text-sm space-y-1">
  {Object.entries(selectedCandidate.social_links).map(([key, value]) => (
    <p key={key}>
      <strong>{key}:</strong>{" "}
      <a
        href={value as string}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {value as string}
      </a>
    </p>
  ))}
</div>

                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminRoute>
  );
};

export default Candidates;
