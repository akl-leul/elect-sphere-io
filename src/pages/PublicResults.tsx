import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Trophy, Loader2 } from "lucide-react";

interface Election {
  id: string;
  title: string;
}

interface Position {
  id: string;
  title: string;
}

interface Candidate {
  id: string;
  position_id: string;
  campaign_logo_url: string | null;
  profiles: {
    full_name: string;
  } | null;
}

interface VoteCount {
  position_id: string;
  candidate_id: string;
  vote_count: number;
}

interface ResultCandidate {
  name: string;
  logo: string | null;
  votes: number;
}

interface Result {
  position: string;
  candidates: ResultCandidate[];
}

const PublicResults = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchResults(selectedElection);

      const interval = setInterval(() => {
        fetchResults(selectedElection);
      }, 15000); // Refresh every 15 seconds

      return () => clearInterval(interval);
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .eq("results_visible", true)
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
    setResultsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_election_results",
        { p_election_id: electionId },
      );

      if (rpcError) throw rpcError;
      const voteCounts = (data as VoteCount[]) || [];

      // Fetch positions
      const { data: positions, error: posError } = await supabase
        .from("positions")
        .select("id, title")
        .eq("election_id", electionId)
        .order("display_order");

      if (posError) throw posError;
      const typedPositions = (positions as Position[]) || [];

      // Fetch candidates with details
      const { data: candidates, error: candError } = await supabase
        .from("candidates")
        .select(
          `
          id,
          position_id,
          campaign_logo_url,
          profiles:user_id (full_name)
        `,
        )
        .eq("election_id", electionId)
        .eq("is_approved", true);

      if (candError) throw candError;
      const typedCandidates = (candidates as Candidate[]) || [];

      // Create maps for quick lookup
      const candidateMap = new Map(
        typedCandidates.map((cand) => [
          cand.id,
          {
            name: cand.profiles?.full_name ?? "Unknown Candidate",
            logo: cand.campaign_logo_url,
            position_id: cand.position_id,
          },
        ]),
      );

      // Group vote counts by position
      const resultsByPosition = voteCounts.reduce(
        (acc: Record<string, ResultCandidate[]>, item) => {
          const { position_id, candidate_id, vote_count } = item;
          if (!acc[position_id]) {
            acc[position_id] = [];
          }
          const candidate = candidateMap.get(candidate_id);
          if (candidate) {
            acc[position_id].push({
              name: candidate.name,
              logo: candidate.logo,
              votes: vote_count,
            });
          }
          return acc;
        },
        {},
      );

      // Build results array
      const resultsData: Result[] = typedPositions.map((position) => ({
        position: position.title,
        candidates: resultsByPosition[position.id] || [],
      }));

      setResults(resultsData);
    } catch (error: any) {
      toast.error("Failed to fetch results");
    } finally {
      setResultsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Public Election Results</h1>
        <p className="text-muted-foreground">View published election results</p>
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

      {resultsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {result.position}
                </CardTitle>
                <CardDescription>
                  Total votes:{" "}
                  {result.candidates.reduce((sum, c) => sum + c.votes, 0)}
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
                    .sort((a, b) => b.votes - a.votes)
                    .map((candidate, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{idx + 1}
                          </span>
                          {candidate.logo && (
                            <img
                              src={candidate.logo}
                              alt={`${candidate.name} logo`}
                              className="h-8 w-8 rounded object-cover border"
                            />
                          )}
                          <span className="font-medium">{candidate.name}</span>
                        </div>
                        <span className="text-lg font-bold">
                          {candidate.votes} votes
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              There are no elections with public results at this time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicResults;
