import { useEffect, useState, useRef, createRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ExternalLink,
  Users,
  Share2,
  Twitter,
  Linkedin,
  Github,
  Link,
  Instagram,
  Facebook,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  social_links: Record<string, string> | null;
}

const SocialIcon = ({ platform, url }: { platform: string; url: string }) => {
  const iconMap: Record<string, React.ReactNode> = {
    twitter: <Twitter className="h-5 w-5" />,
    linkedin: <Linkedin className="h-5 w-5" />,
    github: <Github className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    facebook: <Facebook className="h-5 w-5" />,
  };

  const icon = iconMap[platform.toLowerCase()] || <Link className="h-5 w-5" />;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            {icon}
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Candidates = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedCandidate, setHighlightedCandidate] = useState<
    string | null
  >(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const candidateRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>(
    {},
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const electionIdFromUrl = params.get("election");
    const candidateIdFromUrl = params.get("candidate");

    if (candidateIdFromUrl) {
      setHighlightedCandidate(candidateIdFromUrl);
    }

    fetchElections(electionIdFromUrl);
  }, []);

  useEffect(() => {
    if (highlightedCandidate && candidates.length > 0) {
      const ref = candidateRefs.current[highlightedCandidate];
      if (ref && ref.current) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [candidates, highlightedCandidate]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedElection) {
      params.set("election", selectedElection);
    }
    if (highlightedCandidate) {
      params.set("candidate", highlightedCandidate);
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [selectedElection, highlightedCandidate, navigate, location.pathname]);

  useEffect(() => {
    if (selectedElection) {
      fetchPositionsAndCandidates(selectedElection);
    }
  }, [selectedElection]);

  const fetchElections = async (electionIdFromUrl: string | null) => {
    try {
      const { data, error } = await supabase
        .from("elections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setElections(data || []);
      if (electionIdFromUrl) {
        setSelectedElection(electionIdFromUrl);
      } else if (data && data.length > 0) {
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
      const { data: positionsData } = await supabase
        .from("positions")
        .select("*")
        .eq("election_id", electionId)
        .order("display_order");

      const { data: candidatesData } = await supabase
        .from("candidates")
        .select(
          `
          *,
          user:profiles(full_name, avatar_url)
        `,
        )
        .eq("election_id", electionId);

      setPositions(positionsData || []);
      setCandidates(candidatesData || []);

      (candidatesData || []).forEach((candidate) => {
        candidateRefs.current[candidate.id] = createRef();
      });
    } catch (error: any) {
      console.error("Failed to fetch positions and candidates", error);
    }
  };

  const handleShareCandidate = (candidateId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("election", selectedElection);
    url.searchParams.set("candidate", candidateId);

    navigator.clipboard.writeText(url.toString()).then(() => {
      toast({
        title: "Link Copied!",
        description: "A shareable link for this candidate has been copied.",
      });
    });
  };

  const getFilteredCandidatesForPosition = (positionId: string) => {
    return candidates
      .filter((c) => c.position_id === positionId)
      .filter(
        (c) =>
          c.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.slogan?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
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
          View candidates running for different positions and share them.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="max-w-xs">
            <Select
              value={selectedElection}
              onValueChange={(value) => {
                setSelectedElection(value);
                setHighlightedCandidate(null);
              }}
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
          </div>
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Search by name or slogan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {positions.map((position) => {
          const positionCandidates = getFilteredCandidatesForPosition(
            position.id,
          );

          if (positionCandidates.length === 0 && searchTerm) return null;

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
                  {positionCandidates.map((candidate) => {
                    const isHighlighted = highlightedCandidate === candidate.id;
                    return (
                      <div
                        key={candidate.id}
                        ref={candidateRefs.current[candidate.id]}
                      >
                        <Card
                          className={`overflow-hidden h-full flex flex-col transition-all ${
                            isHighlighted
                              ? "border-primary shadow-lg ring-2 ring-primary"
                              : ""
                          }`}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage
                                  src={candidate.user?.avatar_url ?? undefined}
                                  alt={candidate.user?.full_name ?? undefined}
                                />
                                <AvatarFallback>
                                  {candidate.user?.full_name?.charAt(0) || "C"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle>
                                  {candidate.user?.full_name}
                                </CardTitle>
                                <Badge
                                  variant={
                                    candidate.is_approved
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="mt-1"
                                >
                                  {candidate.is_approved
                                    ? "Approved"
                                    : "Pending"}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 flex-grow">
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
                            {candidate.social_links && (
                              <div>
                                <h3 className="font-semibold text-sm mb-1">
                                  Social Links
                                </h3>
                                <div className="flex items-center gap-3">
                                  {Object.entries(candidate.social_links).map(
                                    ([platform, url]) =>
                                      url && (
                                        <SocialIcon
                                          key={platform}
                                          platform={platform}
                                          url={url}
                                        />
                                      ),
                                  )}
                                </div>
                              </div>
                            )}
                            {candidate.manifesto_url && (
                              <a
                                href={candidate.manifesto_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-2 text-sm pt-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Full Manifesto
                              </a>
                            )}
                          </CardContent>
                          <CardFooter className="bg-muted/40 p-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => handleShareCandidate(candidate.id)}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Candidate
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {candidates.length > 0 &&
          positions.every(
            (p) => getFilteredCandidatesForPosition(p.id).length === 0,
          ) && (
            <div className="text-center text-muted-foreground py-12">
              <h3 className="text-xl font-semibold">No Results Found</h3>
              <p>No candidates match your search term "{searchTerm}".</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Candidates;
