import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Vote as VoteIcon, CheckCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getDeviceFingerprint, getClientIP } from "@/lib/fingerprint";

const Vote = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      if (!profileData?.is_approved) {
        setLoading(false);
        return;
      }

      const { data: electionData } = await supabase
        .from("elections")
        .select("*")
        .eq("is_active", true)
        .single();

      if (!electionData) {
        setLoading(false);
        return;
      }

      setElections([electionData]);

      const { data: posData } = await supabase
        .from("positions")
        .select("*")
        .eq("election_id", electionData.id)
        .order("display_order");

      setPositions(posData || []);

      const { data: candData } = await supabase
        .from("candidates")
        .select(`
          *,
          profiles:user_id (full_name),
          positions:position_id (title)
        `)
        .eq("election_id", electionData.id)
        .eq("is_approved", true);

      setCandidates(candData || []);

      // Check which positions user has already voted for
      const { data: voteData } = await supabase
        .from("votes")
        .select("position_id")
        .eq("voter_id", user.id)
        .eq("election_id", electionData.id);

      const votedPositions: Record<string, boolean> = {};
      (voteData || []).forEach((vote) => {
        votedPositions[vote.position_id] = true;
      });
      setHasVoted(votedPositions);
    } catch (error: any) {
      toast.error("Failed to fetch voting data");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSubmit = async (positionId: string) => {
    try {
      const candidateId = votes[positionId];
      if (!candidateId) {
        toast.error("Please select a candidate");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const election = elections[0];

      // Get real device fingerprint and IP
      const [deviceFingerprint, ipAddress] = await Promise.all([
        getDeviceFingerprint(),
        getClientIP(),
      ]);

      const { error } = await supabase.from("votes").insert([
        {
          voter_id: user.id,
          election_id: election.id,
          position_id: positionId,
          candidate_id: candidateId,
          device_fingerprint: deviceFingerprint,
          ip_address: ipAddress,
        },
      ]);

      if (error) throw error;

      toast.success("Vote cast successfully!");
      setHasVoted({ ...hasVoted, [positionId]: true });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  if (!profile?.is_approved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              Your account is pending approval. You'll be able to vote once an administrator approves your registration.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VoteIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active elections at this time</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Cast Your Vote</h1>
        <p className="text-muted-foreground">Select your preferred candidates for each position</p>
      </div>

      <div className="space-y-6">
        {positions.map((position) => {
          const positionCandidates = candidates.filter(
            (c) => c.position_id === position.id
          );
          const hasVotedForPosition = hasVoted[position.id];

          return (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {position.title}
                  {hasVotedForPosition && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                </CardTitle>
                <CardDescription>{position.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {hasVotedForPosition ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-success mx-auto mb-2" />
                    <p className="text-success font-semibold">You have already voted for this position</p>
                  </div>
                ) : (
                  <>
                    <RadioGroup
                      value={votes[position.id]}
                      onValueChange={(value) =>
                        setVotes({ ...votes, [position.id]: value })
                      }
                      className="space-y-4"
                    >
                      {positionCandidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <RadioGroupItem value={candidate.id} id={candidate.id} />
                          <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                            <div className="flex items-start gap-3">
                              {candidate.campaign_logo_url && (
                                <img
                                  src={candidate.campaign_logo_url}
                                  alt={`${candidate.profiles?.full_name} logo`}
                                  className="h-12 w-12 rounded object-cover border"
                                />
                              )}
                              <div>
                                <p className="font-semibold">{candidate.profiles?.full_name}</p>
                                {candidate.slogan && (
                                  <p className="text-sm text-muted-foreground italic">
                                    "{candidate.slogan}"
                                  </p>
                                )}
                                {candidate.manifesto_url && (
                                  <a
                                    href={candidate.manifesto_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-primary underline mt-1 inline-block"
                                  >
                                    View manifesto
                                  </a>
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      className="w-full mt-6"
                      onClick={() => handleVoteSubmit(position.id)}
                      disabled={!votes[position.id]}
                    >
                      <VoteIcon className="h-4 w-4 mr-2" />
                      Submit Vote for {position.title}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Vote;
