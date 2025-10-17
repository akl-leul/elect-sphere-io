import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Mail, Phone, CheckCircle, XCircle, Upload, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema } from "@/lib/validation";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setAvatarPreview(data.avatar_url || "");
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
      });
    } catch (error: any) {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // For private buckets, store the object path; for public buckets, store public URL
    if (bucket === 'voter-documents') {
      return fileName;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Validate form data
      const validated = profileSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let avatarUrl = profile?.avatar_url;
      let idUrl = profile?.identification_url;

      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, 'avatars', user.id);
      }

      // Upload ID document if provided
      if (idFile) {
        idUrl = await uploadFile(idFile, 'voter-documents', user.id);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          ...validated,
          avatar_url: avatarUrl,
          identification_url: idUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => toast.error(err.message));
      } else {
        toast.error(error.message || "Failed to update profile");
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your current account verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {profile?.is_approved ? (
              <>
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold text-success">Account Approved</p>
                  <p className="text-sm text-muted-foreground">
                    You can participate in elections
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-warning" />
                <div>
                  <p className="font-semibold text-warning">Pending Approval</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is awaiting admin approval
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Upload your profile photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} alt="Profile" />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Change Profile Picture
                </div>
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, or WEBP • Max 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={profile?.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: +[country code][number]
              </p>
            </div>

            <div>
              <Label htmlFor="identification" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Identification Document
              </Label>
              <Input
                id="identification"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload your ID card, passport, or student ID • Max 5MB
              </p>
              {!profile?.is_approved && profile?.identification_url && (
                <p className="text-xs text-warning mt-1">
                  ✓ Document uploaded - awaiting admin verification
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
