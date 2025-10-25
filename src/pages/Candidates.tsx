import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Election {
  id: string;
  title: string;
}

interface Position {
  id: string;
  title: string;
  description: string | null;
}

interface Candidate {
  id: string;
  position_id: string;
  is_approved: boolean;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  campaign_logo_url: string | null;
  slogan: string | null;
  biography: string | null;
  manifesto_url: string | null;
}

const Candidates = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchPositionsAndCandidates(selectedElection);
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
      console.error("Failed to fetch elections", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionsAndCandidates = async (electionId: string) => {
    try {
      const [{ data: positionsData }, { data: candidatesData }] =
        await Promise.all([
          supabase
            .from("positions")
            .select("*")
            .eq("election_id", electionId)
            .order("display_order"),
          supabase
            .from("candidates")
            .select(
              `
            *,
            user:profiles(full_name, avatar_url)
          `,
            )
            .eq("election_id", electionId),
        ]);

      setPositions(positionsData || []);
      setCandidates(candidatesData || []);
    } catch (error: any) {
      console.error("Failed to fetch candidates", error);
    }
  };

  const getCandidatesForPosition = (positionId: string) => {
    return candidates.filter((c) => c.position_id === positionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Elections Found</h2>
            <p className="text-muted-foreground">
              There are no elections to display at the moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Election Candidates</h1>
        <p className="text-muted-foreground mb-4">
          View candidates running for different positions
        </p>

        <div className="max-w-xs">
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
        </div>
      </div>

      <div className="space-y-8">
        {positions.map((position) => {
          const positionCandidates = getCandidatesForPosition(position.id);

          return (
            <div key={position.id}>
              <h2 className="text-2xl font-bold mb-4">{position.title}</h2>
              {position.description && (
                <p className="text-muted-foreground mb-4">
                  {position.description}
                </p>
              )}

              {positionCandidates.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No candidates for this position yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {positionCandidates.map((candidate) => (
                    <Card key={candidate.id} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={candidate.user?.avatar_url}
                              alt={candidate.user?.full_name}
                            />
                            <AvatarFallback>
                              {candidate.user?.full_name?.charAt(0) || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle>{candidate.user?.full_name}</CardTitle>
                            <Badge
                              variant={
                                candidate.is_approved ? "default" : "secondary"
                              }
                              className="mt-1"
                            >
                              {candidate.is_approved ? "Approved" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {candidate.campaign_logo_url && (
                          <img
                            src={candidate.campaign_logo_url}
                            alt="Campaign logo"
                            className="w-full h-32 object-cover rounded"
                          />
                        )}
                        {candidate.slogan && (
                          <div>
                            <h3 className="font-semibold text-sm mb-1">
                              Slogan
                            </h3>
                            <p className="text-sm text-muted-foreground italic">
                              "{candidate.slogan}"
                            </p>
                          </div>
                        )}
                        {candidate.biography && (
                          <div>
                            <h3 className="font-semibold text-sm mb-1">
                              Biography
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-4">
                              {candidate.biography}
                            </p>
                          </div>
                        )}
                        {candidate.manifesto_url && (
                          <a
                            href={candidate.manifesto_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Full Manifesto
                          </a>
                        )}
                        {candidate.social_links && (
                          <div className="space-x-2">
                            {Object.entries(candidate.social_links).map(
                              ([platform, url]) => (
                                <a
                                  key={platform}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  {platform.charAt(0).toUpperCase() +
                                    platform.slice(1)}
                                </a>
                              ),
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Candidates;
