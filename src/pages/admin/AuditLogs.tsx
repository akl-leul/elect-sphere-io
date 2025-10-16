import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("INSERT")) return "default";
    if (action.includes("UPDATE")) return "secondary";
    if (action.includes("DELETE")) return "destructive";
    return "outline";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by action or table..."
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
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={getActionColor(log.action) as any}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{log.table_name || "N/A"}</TableCell>
                  <TableCell>
                    {log.user_id ? log.user_id.substring(0, 8) + "..." : "System"}
                  </TableCell>
                  <TableCell>{log.ip_address || "N/A"}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {log.changes && (
                      <details className="cursor-pointer">
                        <summary className="text-sm text-primary hover:underline">
                          View Changes
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </details>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No audit logs found</p>
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

export default AuditLogs;
