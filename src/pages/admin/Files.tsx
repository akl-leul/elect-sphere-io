import { useEffect, useMemo, useState } from "react";
import AdminRoute from "@/components/auth/AdminRoute";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, RefreshCw, Image as ImageIcon, FileText, Trash2 } from "lucide-react";

type StorageObject = {
  id: string;
  name: string;
  bucket_id: string;
  created_at: string;
  updated_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, any> | null;
};

const BUCKETS = [
  { id: "candidate-files", label: "Candidate Files", public: true },
  { id: "voter-documents", label: "Voter Documents", public: false },
  { id: "avatars", label: "Avatars", public: true },
] as const;

const Files = () => {
  const [activeBucket, setActiveBucket] = useState<typeof BUCKETS[number]["id"]>("candidate-files");
  const [objects, setObjects] = useState<Record<string, StorageObject[]>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshAll();
  }, []);

  const filtered = useMemo(() => {
    const list = objects[activeBucket] || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((o) => o.name.toLowerCase().includes(q));
  }, [objects, activeBucket, search]);

  const refreshBucket = async (bucketId: string) => {
    try {
      setLoading(true);
      // List recursively by using "list" on root prefix and delimiter undefined
      const { data, error } = await supabase.storage.from(bucketId).list("", { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;

      // For nested folders: collect recursively
      const collectAll = async (prefix: string): Promise<StorageObject[]> => {
        const { data: page, error: err } = await supabase.storage.from(bucketId).list(prefix, { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
        if (err) throw err;
        const files: StorageObject[] = [];
        for (const item of page || []) {
          if (item.name.endsWith("/")) {
            const nested = await collectAll(`${prefix ? prefix + "/" : ""}${item.name}`);
            files.push(...nested);
          } else {
            files.push({
              id: `${prefix ? prefix + "/" : ""}${item.name}`,
              name: `${prefix ? prefix + "/" : ""}${item.name}`,
              bucket_id: bucketId,
              created_at: (item as any).created_at ?? "",
              updated_at: (item as any).updated_at ?? null,
              last_accessed_at: (item as any).last_accessed_at ?? null,
              metadata: (item as any).metadata ?? null,
            });
          }
        }
        return files;
      };

      let all: StorageObject[] = [];
      for (const entry of data || []) {
        if (entry.name.endsWith("/")) {
          const nested = await collectAll(entry.name);
          all.push(...nested);
        } else {
          all.push({
            id: entry.name,
            name: entry.name,
            bucket_id: bucketId,
            created_at: (entry as any).created_at ?? "",
            updated_at: (entry as any).updated_at ?? null,
            last_accessed_at: (entry as any).last_accessed_at ?? null,
            metadata: (entry as any).metadata ?? null,
          });
        }
      }

      setObjects((prev) => ({ ...prev, [bucketId]: all }));
    } catch (e: any) {
      toast.error(`Failed to list ${bucketId}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    for (const b of BUCKETS) {
      await refreshBucket(b.id);
    }
  };

  const getPublicUrl = (bucketId: string, path: string) => {
    const { data } = supabase.storage.from(bucketId).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownload = async (obj: StorageObject) => {
    try {
      const { data, error } = await supabase.storage.from(obj.bucket_id).download(obj.name);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = obj.name.split("/").pop() || obj.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error("Download failed");
    }
  };

  const handleDelete = async (obj: StorageObject) => {
    if (!confirm(`Delete ${obj.name}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.storage.from(obj.bucket_id).remove([obj.name]);
      if (error) throw error;
      toast.success("File deleted");
      refreshBucket(obj.bucket_id);
    } catch (e: any) {
      toast.error("Failed to delete file");
    }
  };

  const isImage = (name: string) => /\.(png|jpg|jpeg|webp|gif)$/i.test(name);
  const isDoc = (name: string) => /\.(pdf|docx?|txt)$/i.test(name);

  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Storage Files</h1>
          <p className="text-muted-foreground">Browse uploaded files across all buckets</p>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6 flex items-center gap-3">
            <Input
              placeholder="Search files by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" onClick={() => refreshBucket(activeBucket)} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={refreshAll} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeBucket} onValueChange={(v) => setActiveBucket(v as any)}>
          <TabsList>
            {BUCKETS.map((b) => (
              <TabsTrigger key={b.id} value={b.id}>{b.label}</TabsTrigger>
            ))}
          </TabsList>

          {BUCKETS.map((b) => (
            <TabsContent key={b.id} value={b.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{b.label}</CardTitle>
                  <CardDescription>
                    Bucket ID: {b.id} {b.public ? "(public)" : "(private)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(filtered.length ? filtered : objects[b.id] || []).map((obj) => {
                        const previewUrl = b.public ? getPublicUrl(b.id, obj.name) : undefined;
                        return (
                          <TableRow key={`${b.id}-${obj.name}`}>
                            <TableCell>
                              {previewUrl && isImage(obj.name) ? (
                                <img src={previewUrl} alt={obj.name} className="h-12 w-12 rounded object-cover border" />
                              ) : isDoc(obj.name) ? (
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium break-all">{obj.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {b.public && previewUrl && (
                                  <a className="underline text-primary" href={previewUrl} target="_blank" rel="noreferrer">Open</a>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleDownload(obj)}>
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(obj)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {((filtered.length === 0) && ((objects[b.id] || []).length === 0)) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                            No files found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminRoute>
  );
};

export default Files;


