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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      {/* Sidebar: use responsive props and classes so it collapses on small screens */}
      <Sidebar
        variant="inset"
        collapsible="icon"
        className="fixed inset-y-0 left-0 z-40 w-64 sm:w-56 md:w-64 lg:w-64 transition-all ease-in-out duration-200
                   -translate-x-64 sm:translate-x-0 md:translate-x-0"
        // NOTE: if your Sidebar component accepts a "defaultCollapsed" prop, set it for small screens there
      >
        <SidebarHeader>
          <div className="flex items-center gap-2 px-3 py-2">
            <img
              src="https://sitedu.info/img/logo/primary-logo.webp"
              alt="SIT Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded"
            />
            <span className="font-semibold text-sm sm:text-base hidden sm:inline">
              Admin
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs sm:text-sm">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm",
                          location.pathname === item.to
                            ? "bg-accent/20 font-medium"
                            : "hover:bg-accent/10",
                        )}
                        aria-current={
                          location.pathname === item.to ? "page" : undefined
                        }
                      >
                        <item.icon className="h-4 w-4" aria-hidden />
                        <span className="truncate">{item.label}</span>
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
          <div className="px-3 py-3 w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-between gap-2"
              onClick={handleLogout}
            >
              <span className="hidden sm:inline">Logout</span>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main content inset that accounts for the fixed sidebar */}
      <SidebarInset>
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/80 backdrop-blur px-3 sm:px-4"
          role="banner"
        >
          {/* Trigger: visible on small screens to toggle sidebar; hidden on larger screens */}
          <div className="block sm:hidden">
            <SidebarTrigger aria-label="Toggle menu" />
          </div>

          <div className={cn("font-semibold text-sm sm:text-base")}>
            Admin Dashboard
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
            </div>

            {/* On very small screens show icon-only buttons */}
            <div className="flex items-center gap-2">
              <div className="sm:hidden">
                <ThemeToggle />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="p-2 rounded-md"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content: add responsive padding and center container */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto max-w-7xl">
            <Card className="border-0 shadow-none bg-transparent">
              {children}
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Mobile overlay styles and aria: if your Sidebar supports an "overlay" when open, ensure it is enabled */}
      <style jsx>{`
        @media (max-width: 639px) {
          /* adjust sidebar width on very small screens and enable translate for off-canvas */
          .sidebar {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </SidebarProvider>
  );
};

export default AdminLayout;
