import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";

const ViewRequirements = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const electionId = searchParams.get("election");
  const [requirements, setRequirements] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (electionId) {
      fetchRequirements();
    }
  }, [electionId]);

  const fetchRequirements = async () => {
    try {
      const [reqRes, elecRes] = await Promise.all([
        supabase
          .from("election_requirements")
          .select("*")
          .eq("election_id", electionId)
          .order("created_at", { ascending: false }),
        supabase
          .from("elections")
          .select("*")
          .eq("id", electionId)
          .maybeSingle()
      ]);

      if (reqRes.error) throw reqRes.error;
      if (elecRes.error) throw elecRes.error;

      setRequirements(reqRes.data || []);
      setElection(elecRes.data);
    } catch (error: any) {
      toast.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedContent = (content: string) => {
    // Simple markdown-like rendering
    let formatted = content
      // Headers
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-6 mb-1">• $1</li>')
      // Line breaks
      .replace(/\n/g, '<br />');

    return formatted;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Election Requirements</h1>
        {election && (
          <p className="text-muted-foreground">Requirements for: {election.title}</p>
        )}
      </div>

      <div className="space-y-6">
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No requirements have been set for this election</p>
            </CardContent>
          </Card>
        ) : (
          requirements.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {req.title}
                </CardTitle>
                <CardDescription>
                  Last updated: {new Date(req.updated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderFormattedContent(req.content) }}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewRequirements;
