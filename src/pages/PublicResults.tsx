import { useEffect, useState, useMemo } from "react";
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

/* --- Types --- */
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

/* --- Helpers --- */
const formatNumber = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : `${n}`;

const PublicResults = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [loadingElections, setLoadingElections] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    const fetchElections = async () => {
      setLoadingElections(true);
      try {
        const { data, error } = await supabase
          .from("elections")
          .select("id, title")
          .eq("results_visible", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setElections(data || []);
        if (data && data.length > 0) setSelectedElection(data[0].id);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch elections");
      } finally {
        setLoadingElections(false);
      }
    };

    fetchElections();
  }, []);

  useEffect(() => {
    if (!selectedElection) return;
    const fetchResults = async (electionId: string) => {
      setLoadingResults(true);
      setResults([]);
      try {
        // get vote counts via RPC
        const { data: voteCounts, error: rpcError } = await supabase.rpc(
          "get_election_results",
          {
            p_election_id: electionId,
          },
        );
        if (rpcError) throw rpcError;

        // positions
        const { data: positions, error: posError } = await supabase
          .from("positions")
          .select("id, title")
          .eq("election_id", electionId)
          .order("display_order");
        if (posError) throw posError;
        const typedPositions = (positions as Position[]) || [];

        // candidates with profile
        const { data: candidates, error: candError } = await supabase
          .from("candidates")
          .select("id, position_id, profiles:user_id (full_name, avatar_url)")
          .eq("election_id", electionId);
        if (candError) throw candError;
        const typedCandidates = (candidates as Candidate[]) || [];

        // map vote counts
        const voteCountMap = new Map<string, number>(
          ((voteCounts as VoteCount[]) || []).map((vc) => [
            vc.candidate_id,
            vc.vote_count,
          ]),
        );

        // group candidates by position and attach votes
        const candidatesByPosition = typedCandidates.reduce(
          (acc: Record<string, ResultCandidate[]>, cand) => {
            if (!acc[cand.position_id]) acc[cand.position_id] = [];
            acc[cand.position_id].push({
              name: cand.profiles?.full_name ?? "Unknown Candidate",
              avatarUrl: cand.profiles?.avatar_url ?? null,
              votes: voteCountMap.get(cand.id) || 0,
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
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch results");
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults(selectedElection);
  }, [selectedElection]);

  const totalVotesFor = useMemo(
    () =>
      results.reduce(
        (acc, r) => {
          acc[r.position] = r.candidates.reduce((s, c) => s + c.votes, 0);
          return acc;
        },
        {} as Record<string, number>,
      ),
    [results],
  );

  /* --- UI --- */
  if (loadingElections) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Public Election Results
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Browse published election outcomes and visual summaries
        </p>
      </header>

      {elections.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <p className="text-muted-foreground">
              There are no elections with public results at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Card>
              <CardHeader>
                <CardTitle>Select election</CardTitle>
                <CardDescription>
                  Choose the election to view published results
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Select
                  value={selectedElection}
                  onValueChange={setSelectedElection}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an election" />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Card className="flex-1">
                <CardContent>
                  <div className="text-xs text-muted-foreground">Positions</div>
                  <div className="mt-2 text-lg font-semibold">
                    {results.length}
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1">
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Total Candidates
                  </div>
                  <div className="mt-2 text-lg font-semibold">
                    {results.reduce((s, r) => s + r.candidates.length, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {loadingResults ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center">
                    <p className="text-muted-foreground">
                      No results are available for this election yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                results.map((result, idx) => {
                  const totalVotes = totalVotesFor[result.position] || 0;
                  const chartData = result.candidates.map((c) => ({
                    name: c.name,
                    votes: c.votes,
                  }));
                  return (
                    <Card key={idx}>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                            <Trophy className="h-5 w-5 text-primary" />
                            {result.position}
                          </CardTitle>
                          <CardDescription>
                            Total votes:{" "}
                            <span className="font-medium">
                              {formatNumber(totalVotes)}
                            </span>
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-4">
                          {result.candidates[0] ? (
                            <div className="flex items-center gap-3">
                              {result.candidates[0].avatarUrl ? (
                                <img
                                  src={result.candidates[0].avatarUrl}
                                  alt={`${result.candidates[0].name} avatar`}
                                  className="h-10 w-10 rounded-full object-cover border"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center text-xs font-semibold">
                                  {result.candidates[0].name
                                    .split(" ")
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join("")}
                                </div>
                              )}
                              <div className="text-sm">
                                <div className="font-medium">
                                  {result.candidates[0].name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {totalVotes
                                    ? (
                                        (result.candidates[0].votes /
                                          totalVotes) *
                                        100
                                      ).toFixed(1)
                                    : "0.0"}
                                  % of votes
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No candidates
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart area: restored to the previous horizontal orientation */}
                        <div className="col-span-1 lg:col-span-2 h-64">
                          {chartData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData}
                                margin={{ left: 20, right: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                  formatter={(value: number) =>
                                    `${value} votes`
                                  }
                                />
                                <Legend />
                                <Bar
                                  dataKey="votes"
                                  fill="hsl(var(--primary))"
                                  barSize={30}
                                  radius={[6, 6, 6, 6]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              No candidate votes yet
                            </div>
                          )}
                        </div>

                        {/* Candidates list with progress bars */}
                        <div className="col-span-1 space-y-3">
                          {result.candidates.length === 0 ? (
                            <div className="text-muted-foreground">
                              No candidates for this position.
                            </div>
                          ) : (
                            result.candidates.map((candidate, i) => {
                              const percent = totalVotes
                                ? Math.round(
                                    (candidate.votes / totalVotes) * 100,
                                  )
                                : 0;
                              return (
                                <div
                                  key={i}
                                  className="p-3 rounded-md bg-muted/30"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      {candidate.avatarUrl ? (
                                        <img
                                          src={candidate.avatarUrl}
                                          alt={`${candidate.name} avatar`}
                                          className="h-9 w-9 rounded-full object-cover border"
                                        />
                                      ) : (
                                        <div className="h-9 w-9 rounded-full bg-muted/40 flex items-center justify-center text-xs font-semibold">
                                          {candidate.name
                                            .split(" ")
                                            .map((s) => s[0])
                                            .slice(0, 2)
                                            .join("")}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="font-medium truncate">
                                          {candidate.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {formatNumber(candidate.votes)} votes
                                        </div>
                                      </div>
                                    </div>

                                    <div className="w-24 text-right">
                                      <div className="text-sm font-semibold">
                                        {percent}%
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PublicResults;
