import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Search, Ban, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const Voters = () => {
  const [voters, setVoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchVoters = async () => {
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

  const filteredVoters = voters.filter(
    (voter) =>
      voter.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Voter Management</h1>
        <p className="text-muted-foreground">Approve, suspend, or manage registered voters</p>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVoters.map((voter) => (
                <TableRow key={voter.id}>
                  <TableCell className="font-medium">{voter.full_name}</TableCell>
                  <TableCell>{voter.email}</TableCell>
                  <TableCell>{voter.phone || "N/A"}</TableCell>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVoters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No voters found
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

export default Voters;
