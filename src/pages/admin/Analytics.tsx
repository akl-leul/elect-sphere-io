import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import AdminRoute from "@/components/auth/AdminRoute";
import { Users, UserCheck, Vote as VoteIcon, FileText } from "lucide-react";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#a4de6c",
  "#d0ed57",
];

const Analytics = () => {
  const [kpis, setKpis] = useState({
    voters: 0,
    candidates: 0,
    votes: 0,
    elections: 0,
  });
  const [genderData, setGenderData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [turnoutPercent, setTurnoutPercent] = useState(0);
  const [votesPerCandidate, setVotesPerCandidate] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [votesOverTime, setVotesOverTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // KPIs counts
      const [
        { count: votersCount },
        { count: candidatesCount },
        { count: votesCount },
        { count: electionsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("candidates").select("*", { count: "exact", head: true }),
        supabase.from("votes").select("*", { count: "exact", head: true }),
        supabase.from("elections").select("*", { count: "exact", head: true }),
      ]);

      const voters = votersCount || 0;
      const candidates = candidatesCount || 0;
      const votes = votesCount || 0;
      const elections = electionsCount || 0;

      setKpis({ voters, candidates, votes, elections });

      // Profiles (gender + approval/suspended)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, gender, is_approved, is_suspended");

      const maleCount =
        profiles?.filter((p) => p.gender === "male").length || 0;
      const femaleCount =
        profiles?.filter((p) => p.gender === "female").length || 0;
      const otherCount =
        profiles?.filter(
          (p) => p.gender && !["male", "female"].includes(p.gender),
        ).length || 0;
      const unknownCount = profiles?.filter((p) => !p.gender).length || 0;
      setGenderData([
        { name: "Male", value: maleCount },
        { name: "Female", value: femaleCount },
        { name: "Other", value: otherCount },
        { name: "Not Set", value: unknownCount },
      ]);

      const approvedCount =
        profiles?.filter((p) => p.is_approved && !p.is_suspended).length || 0;
      const pendingCount =
        profiles?.filter((p) => !p.is_approved && !p.is_suspended).length || 0;
      const suspendedCount =
        profiles?.filter((p) => p.is_suspended).length || 0;
      setStatusData([
        { name: "Approved", value: approvedCount },
        { name: "Pending", value: pendingCount },
        { name: "Suspended", value: suspendedCount },
      ]);

      // Votes details for deeper analysis
      // assume votes table has fields: id, candidate_id, created_at, election_id, voter_id
      const { data: votesRows } = await supabase
        .from("votes")
        .select("id, candidate_id, created_at, election_id, voter_id");

      // Votes per candidate
      const candidateCountsMap = new Map();
      votesRows?.forEach((v) => {
        const key = v.candidate_id || "unknown";
        candidateCountsMap.set(key, (candidateCountsMap.get(key) || 0) + 1);
      });
      // Fetch candidate names for top candidates
      const candidateIds = Array.from(candidateCountsMap.keys()).filter(
        (id) => id !== "unknown",
      );
      let candidatesById = {};
      if (candidateIds.length) {
        const { data: candidateRows } = await supabase
          .from("candidates")
          .select("id, profiles:user_id (full_name)")
          .in("id", candidateIds);
        candidatesById = (candidateRows || []).reduce((acc, c) => {
          acc[c.id] = c.profiles?.full_name || `Candidate ${c.id}`;
          return acc;
        }, {});
      }

      const votesPerCandidateArray = Array.from(
        candidateCountsMap.entries(),
      ).map(([id, count]) => ({
        id,
        name:
          id === "unknown"
            ? "Unknown"
            : candidatesById[id] || `Candidate ${id}`,
        value: count,
      }));
      // sort descending
      votesPerCandidateArray.sort((a, b) => b.value - a.value);
      setVotesPerCandidate(votesPerCandidateArray);

      // Top 5 candidates
      setTopCandidates(votesPerCandidateArray.slice(0, 5));

      // Turnout calculation: number of unique voters who cast vote / total registered voters
      const uniqueVoterIds = new Set(
        votesRows?.map((v) => v.voter_id).filter(Boolean),
      );
      const turnout = voters ? (uniqueVoterIds.size / voters) * 100 : 0;
      setTurnoutPercent(Number(turnout.toFixed(2)));

      // Votes over time (group by date)
      const timeMap = new Map(); // date string -> count
      (votesRows || []).forEach((v) => {
        const date = v.created_at
          ? new Date(v.created_at).toISOString().slice(0, 10)
          : "unknown";
        timeMap.set(date, (timeMap.get(date) || 0) + 1);
      });
      const sortedTime = Array.from(timeMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => (a.date > b.date ? 1 : -1));
      setVotesOverTime(sortedTime);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Simple chart data for KPIs
  const chartData = useMemo(
    () => [
      { name: "Voters", value: kpis.voters },
      { name: "Candidates", value: kpis.candidates },
      { name: "Votes", value: kpis.votes },
      { name: "Elections", value: kpis.elections },
    ],
    [kpis],
  );

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Key metrics and activity trends
          </p>
        </div>

        {loading && (
          <div className="mb-6">
            <Card>
              <CardContent>Loading analytics...</CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="mb-6">
            <Card>
              <CardContent className="text-destructive">{error}</CardContent>
            </Card>
          </div>
        )}

        {/* KPIs cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Voters
              </CardTitle>
              <CardDescription>Total registered users</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {kpis.voters}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Candidates
              </CardTitle>
              <CardDescription>Total candidates</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {kpis.candidates}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VoteIcon className="h-5 w-5 text-primary" /> Votes
              </CardTitle>
              <CardDescription>Total votes cast</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {kpis.votes}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Elections
              </CardTitle>
              <CardDescription>Total elections</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">
              {kpis.elections}
            </CardContent>
          </Card>
        </div>

        {/* Extra quick metrics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Turnout</CardTitle>
              <CardDescription>Unique voters who cast a vote</CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {turnoutPercent}%
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Votes per Candidate</CardTitle>
              <CardDescription>
                Mean number of votes each candidate received
              </CardDescription>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {votesPerCandidate.length
                ? (
                    votesPerCandidate.reduce((s, c) => s + c.value, 0) /
                    votesPerCandidate.length
                  ).toFixed(2)
                : "0.00"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Voted Candidate</CardTitle>
              <CardDescription>Top performer by votes</CardDescription>
            </CardHeader>
            <CardContent className="text-lg">
              {topCandidates.length ? (
                <div>
                  <div className="font-semibold">{topCandidates[0].name}</div>
                  <div className="text-sm text-muted-foreground">
                    {topCandidates[0].value} votes
                  </div>
                </div>
              ) : (
                <div>No votes yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* KPIs Pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>KPIs Distribution</CardTitle>
              <CardDescription>
                Proportion of voters, candidates, votes, elections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Votes over time - line chart */}
          <Card>
            <CardHeader>
              <CardTitle>Votes Over Time</CardTitle>
              <CardDescription>Activity trend by day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={votesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Demographic & status analysis */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Voter demographics by gender</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {genderData.map((entry, index) => (
                      <Cell
                        key={`gcell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voter Status</CardTitle>
              <CardDescription>
                Approved, pending, and suspended voters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Votes per candidate and top list */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Votes per Candidate</CardTitle>
              <CardDescription>
                How votes are distributed across candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={votesPerCandidate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {votesPerCandidate.map((entry, idx) => (
                      <Cell
                        key={`vpc-${idx}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Candidates</CardTitle>
              <CardDescription>Top 5 candidates by votes</CardDescription>
            </CardHeader>
            <CardContent>
              {topCandidates.length ? (
                <div className="space-y-3">
                  {topCandidates.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Candidate ID: {c.id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{c.value}</div>
                        <div className="text-sm text-muted-foreground">
                          {kpis.votes
                            ? ((c.value / kpis.votes) * 100).toFixed(1)
                            : "0"}
                          %
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>No candidate votes yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
};

export default Analytics;
