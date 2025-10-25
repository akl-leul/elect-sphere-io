import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Vote,
  Settings,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  LayoutGrid,
  ListChecks,
  FolderOpen,
  Trophy,
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = useMemo(
    () => [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/elections", label: "Elections", icon: Settings },
      { to: "/admin/positions", label: "Positions", icon: ListChecks },
      {
        to: "/admin/requirements",
        label: "Requirements",
        icon: ClipboardCheck,
      },
      { to: "/admin/candidates", label: "Candidates", icon: UserCheck },
      { to: "/admin/voters", label: "Voters", icon: Users },
      { to: "/admin/results", label: "Results", icon: Trophy },
      { to: "/admin/files", label: "Files", icon: FolderOpen },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
      { to: "/admin/admins", label: "Admins", icon: LayoutGrid },
    ],
    [],
  );

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <img
              src="https://sitedu.info/img/logo/primary-logo.webp"
              alt="SIT Logo"
              className="w-10 h-10 rounded"
            />
            <span className="font-semibold">Admin</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to} className="flex items-center">
                        <item.icon className="h-4 w-4" />
                        <span className="ml-2">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="px-2">
            <Button
              variant="outline"
              size="icon"
              className="w-full hover:bg-red-600"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out successfully");
                navigate("/auth");
              }}
            >
              {" "}
              <span className="">Logout</span>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-14 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger />
          <div className={cn("font-semibold")}>Admin Dashboard</div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="hover:bg-red-600"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Logged out successfully");
                navigate("/auth");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
        <div className="p-4 md:p-6 bg-gradient-to-br from-background via-trust-light to-background min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto max-w-7xl">
            <Card className="border-0 shadow-none bg-transparent">
              {children}
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
