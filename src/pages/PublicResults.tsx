import { useEffect, useState } from "react";
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

// --- TYPE DEFINITIONS ---
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
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface VoteCount {
  position_id: string;
  candidate_id: string;
  vote_count: number;
}

interface ResultCandidate {
  name: string;
  avatarUrl: string | null;
  votes: number;
}

interface Result {
  position: string;
  candidates: ResultCandidate[];
}

const PublicResults = () => {
  // --- STATE ---
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  // --- EFFECTS ---
  // Fetch the list of elections with visible results when the component mounts.
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const { data, error } = await supabase
          .from("elections")
          .select("id, title")
          .eq("results_visible", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setElections(data || []);
        // If elections are found, automatically select the first one.
        if (data && data.length > 0) {
          setSelectedElection(data[0].id);
        }
      } catch (error: any) {
        toast.error("Failed to fetch elections");
      } finally {
        setLoadingElections(false);
      }
    };

    fetchElections();
  }, []);

  // Fetch the results for the currently selected election.
  useEffect(() => {
    const fetchResults = async (electionId: string) => {
      setLoadingResults(true);
      setResults([]); // Clear previous results
      try {
        // Step 1: Get vote counts from the secure RPC function.
        const { data: voteCounts, error: rpcError } = await supabase.rpc(
          "get_election_results",
          { p_election_id: electionId },
        );
        if (rpcError) throw rpcError;

        // Step 2: Get all positions for this election.
        const { data: positions, error: posError } = await supabase
          .from("positions")
          .select("id, title")
          .eq("election_id", electionId)
          .order("display_order");
        if (posError) throw posError;
        const typedPositions = (positions as Position[]) || [];

        // Step 3: Get all approved candidates for this election.
        const { data: candidates, error: candError } = await supabase
          .from("candidates")
          .select("id, position_id, profiles:user_id (full_name, avatar_url)")
          .eq("election_id", electionId);
        if (candError) throw candError;
        const typedCandidates = (candidates as Candidate[]) || [];

        // Step 4: Process and combine the data.
        const voteCountMap = new Map(
          (voteCounts as VoteCount[]).map((vc) => [
            vc.candidate_id,
            vc.vote_count,
          ]),
        );

        const candidatesByPosition = typedCandidates.reduce(
          (acc: Record<string, ResultCandidate[]>, cand) => {
            if (!acc[cand.position_id]) {
              acc[cand.position_id] = [];
            }
            acc[cand.position_id].push({
              name: cand.profiles?.full_name ?? "Unknown Candidate",
              avatarUrl: cand.profiles?.avatar_url ?? null,
              votes: voteCountMap.get(cand.id) || 0, // Default to 0 votes
            });
            return acc;
          },
          {},
        );

        const finalResults: Result[] = typedPositions.map((pos) => ({
          position: pos.title,
          candidates: (candidatesByPosition[pos.id] || []).sort(
            (a, b) => b.votes - a.votes,
          ),
        }));

        setResults(finalResults);
      } catch (error: any) {
        toast.error("Failed to fetch results");
      } finally {
        setLoadingResults(false);
      }
    };

    if (selectedElection) {
      fetchResults(selectedElection);
    }
  }, [selectedElection]);

  // --- RENDER LOGIC ---
  const renderContent = () => {
    if (loadingResults) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (results.every((r) => r.candidates.length === 0)) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              No results are available for this election yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
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
                {result.candidates.map((candidate, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        #{idx + 1}
                      </span>
                      {candidate.avatarUrl && (
                        <img
                          src={candidate.avatarUrl}
                          alt={`${candidate.name} profile picture`}
                          className="h-8 w-8 rounded-full object-cover border"
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
    );
  };

  if (loadingElections) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Public Election Results</h1>
        <p className="text-muted-foreground">View published election results</p>
      </div>

      {elections.length > 0 ? (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Select
                value={selectedElection}
                onValueChange={setSelectedElection}
              >
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
          {renderContent()}
        </>
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
