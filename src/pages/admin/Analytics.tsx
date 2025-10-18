import { useEffect, useState } from "react";
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
} from "recharts";
import AdminRoute from "@/components/auth/AdminRoute";
import { Users, UserCheck, Vote as VoteIcon, FileText } from "lucide-react";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

const Analytics = () => {
  const [kpis, setKpis] = useState({
    voters: 0,
    candidates: 0,
    votes: 0,
    elections: 0,
  });
  const [genderData, setGenderData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    const [
      { count: voters },
      { count: candidates },
      { count: votes },
      { count: elections },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase.from("votes").select("*", { count: "exact", head: true }),
      supabase.from("elections").select("*", { count: "exact", head: true }),
    ]);
    setKpis({
      voters: voters || 0,
      candidates: candidates || 0,
      votes: votes || 0,
      elections: elections || 0,
    });

    // Fetch gender distribution
    const { data: profiles } = await supabase.from("profiles").select("gender");
    const maleCount = profiles?.filter(p => p.gender === "male").length || 0;
    const femaleCount = profiles?.filter(p => p.gender === "female").length || 0;
    const unknownCount = profiles?.filter(p => !p.gender).length || 0;
    setGenderData([
      { name: "Male", value: maleCount },
      { name: "Female", value: femaleCount },
      { name: "Not Set", value: unknownCount },
    ]);

    // Fetch approval status
    const { data: allProfiles } = await supabase.from("profiles").select("is_approved, is_suspended");
    const approvedCount = allProfiles?.filter(p => p.is_approved && !p.is_suspended).length || 0;
    const pendingCount = allProfiles?.filter(p => !p.is_approved && !p.is_suspended).length || 0;
    const suspendedCount = allProfiles?.filter(p => p.is_suspended).length || 0;
    setStatusData([
      { name: "Approved", value: approvedCount },
      { name: "Pending", value: pendingCount },
      { name: "Suspended", value: suspendedCount },
    ]);
  };

  // Prepare data array for charts
  const chartData = [
    { name: "Voters", value: kpis.voters },
    { name: "Candidates", value: kpis.candidates },
    { name: "Votes", value: kpis.votes },
    { name: "Elections", value: kpis.elections },
  ];

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Key metrics and activity trends
          </p>
        </div>

        {/* KPIs cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Voters
              </CardTitle>
              <CardDescription>Total registered users</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.voters}</CardContent>
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
            <CardContent className="text-3xl font-bold">{kpis.votes}</CardContent>
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

        {/* Charts section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Pie chart */}
          <Card>
            <CardHeader>
              <CardTitle>KPIs Distribution</CardTitle>
              <CardDescription>Proportion of voters, candidates, votes, elections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>KPIs Comparison</CardTitle>
              <CardDescription>Number of voters, candidates, votes, and elections</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Demographic Analysis */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Voter demographics by gender</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={genderData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    label
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Voter Status */}
          <Card>
            <CardHeader>
              <CardTitle>Voter Status</CardTitle>
              <CardDescription>Approved, pending, and suspended voters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
};

export default Analytics;
