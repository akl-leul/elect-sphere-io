import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Trophy } from "lucide-react";

const Results = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults(selectedElection);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);
      if (data && data.length > 0) {
        setSelectedElection(data[0].id);
      }
    } catch (error: any) {
      toast.error("Failed to fetch elections");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (electionId: string) => {
    try {
      const { data: positions, error: posError } = await supabase
        .from("positions")
        .select("*")
        .eq("election_id", electionId)
        .order("display_order");

      if (posError) throw posError;

      const resultsData = await Promise.all(
        (positions || []).map(async (position) => {
          const { data: candidates, error: candError } = await supabase
            .from("candidates")
            .select(`
              *,
              profiles:user_id (full_name)
            `)
            .eq("position_id", position.id)
            .eq("is_approved", true);

          if (candError) throw candError;

          const candidatesWithVotes = await Promise.all(
            (candidates || []).map(async (candidate) => {
              const { count, error: voteError } = await supabase
                .from("votes")
                .select("*", { count: "exact", head: true })
                .eq("candidate_id", candidate.id);

              if (voteError) throw voteError;

              return {
                name: candidate.profiles?.full_name,
                votes: count || 0,
              };
            })
          );

          return {
            position: position.title,
            candidates: candidatesWithVotes,
          };
        })
      );

      setResults(resultsData);
    } catch (error: any) {
      toast.error("Failed to fetch results");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Election Results</h1>
        <p className="text-muted-foreground">View live and final election results</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Select value={selectedElection} onValueChange={setSelectedElection}>
            <SelectTrigger>
              <SelectValue placeholder="Select an election" />
            </SelectTrigger>
            <SelectContent>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                {result.position}
              </CardTitle>
              <CardDescription>
                Total votes: {result.candidates.reduce((sum: number, c: any) => sum + c.votes, 0)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.candidates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-2">
                {result.candidates
                  .sort((a: any, b: any) => b.votes - a.votes)
                  .map((candidate: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="font-medium">{candidate.name}</span>
                      </div>
                      <span className="text-lg font-bold">{candidate.votes} votes</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No results available for this election</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Results;
