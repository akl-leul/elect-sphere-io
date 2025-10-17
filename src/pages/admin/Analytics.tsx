import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import AdminRoute from "@/components/auth/AdminRoute";
import { Users, UserCheck, Vote as VoteIcon, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Analytics = () => {
  const [kpis, setKpis] = useState({ voters: 0, candidates: 0, votes: 0, elections: 0 });
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    fetchKpis();
    fetchTrend();
  }, []);

  const fetchKpis = async () => {
    const [{ count: voters }, { count: candidates }, { count: votes }, { count: elections }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase.from("votes").select("*", { count: "exact", head: true }),
      supabase.from("elections").select("*", { count: "exact", head: true }),
    ]);
    setKpis({ voters: voters || 0, candidates: candidates || 0, votes: votes || 0, elections: elections || 0 });
  };

  const fetchTrend = async () => {
    // naive trend by day for last 7 days using votes count
    const { data } = await supabase
      .from("votes")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1000);
    const byDay: Record<string, number> = {};
    (data || []).forEach((v) => {
      const d = new Date(v.created_at).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    });
    const arr = Object.entries(byDay).map(([date, count]) => ({ date, count }));
    setTrend(arr);
  };

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Key metrics and activity trends</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Voters</CardTitle>
              <CardDescription>Total registered users</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.voters}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Candidates</CardTitle>
              <CardDescription>Total candidates</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.candidates}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><VoteIcon className="h-5 w-5 text-primary" /> Votes</CardTitle>
              <CardDescription>Total votes cast</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.votes}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Elections</CardTitle>
              <CardDescription>Total elections</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.elections}</CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Votes Trend</CardTitle>
              <CardDescription>Daily votes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Votes by Day (Bar)</CardTitle>
              <CardDescription>Aggregated counts</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
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


