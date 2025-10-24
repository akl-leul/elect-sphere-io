import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Vote as VoteIcon, CheckCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getDeviceFingerprint, getClientIP } from "@/lib/fingerprint";
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
  profiles: {
    full_name: string;
  } | null;
  campaign_logo_url: string | null;
  slogan: string | null;
  manifesto_url: string | null;
}

const AnonymousVote = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
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
        .eq("is_active", true)
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

  const fetchPositionsAndCandidates = async (electionId: string) => {
    try {
      const deviceFingerprint = await getDeviceFingerprint();

      const { data: posData } = await supabase
        .from("positions")
        .select("*")
        .eq("election_id", electionId)
        .order("display_order");

      setPositions(posData || []);

      const { data: candData } = await supabase
        .from("candidates")
        .select(
          `
          *,
          profiles:user_id (full_name),
          positions:position_id (title)
        `,
        )
        .eq("election_id", electionId)
        .eq("is_approved", true);

      setCandidates(candData || []);

      // Check which positions this device has already voted for (anonymous)
      const { data: voteData } = await supabase
        .from("votes")
        .select("position_id")
        .eq("device_fingerprint", deviceFingerprint)
        .is("voter_id", null)
        .eq("election_id", electionId);

      const votedPositions: Record<string, boolean> = {};
      (voteData || []).forEach((vote) => {
        votedPositions[vote.position_id] = true;
      });
      setHasVoted(votedPositions);
    } catch (error: any) {
      toast.error("Failed to fetch voting data");
    }
  };

  const handleVoteSubmit = async (positionId: string) => {
    try {
      const candidateId = votes[positionId];
      if (!candidateId) {
        toast.error("Please select a candidate");
        return;
      }

      const election = elections.find((e) => e.id === selectedElection);
      if (!election) {
        toast.error("Selected election not found");
        return;
      }

      // Get real device fingerprint and IP
      const [deviceFingerprint, ipAddress] = await Promise.all([
        getDeviceFingerprint(),
        getClientIP(),
      ]);

      const { error } = await supabase.from("votes").insert([
        {
          voter_id: null,
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
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  if (elections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <img
              src="https://sitedu.info/img/logo/primary-logo.webp"
              alt=""
              className="w-10 h-10 rounded"
            />

            <p className="text-muted-foreground">
              No active elections at this time
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Cast Your Anonymous Vote</h1>
        <p className="text-muted-foreground">
          Select your preferred candidates for each position
        </p>
        <p className="text-muted-foreground mt-2">
          Votes are anonymous but tracked by device fingerprint to prevent
          multiple voting.
        </p>

        <div className="max-w-xs mt-4">
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

      <div className="space-y-6">
        {positions.map((position) => {
          const positionCandidates = candidates.filter(
            (c) => c.position_id === position.id,
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
                    <p className="text-success font-semibold">
                      You have already voted for this position
                    </p>
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
                          <RadioGroupItem
                            value={candidate.id}
                            id={candidate.id}
                          />
                          <Label
                            htmlFor={candidate.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              {candidate.campaign_logo_url && (
                                <img
                                  src={candidate.campaign_logo_url}
                                  alt={`${candidate.profiles?.full_name} logo`}
                                  className="h-12 w-12 rounded object-cover border"
                                />
                              )}
                              <div>
                                <p className="font-semibold">
                                  {candidate.profiles?.full_name}
                                </p>
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

export default AnonymousVote;
