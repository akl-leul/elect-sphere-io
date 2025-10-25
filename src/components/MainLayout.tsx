import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "./Navbar";

// --- TYPE DEFINITIONS ---
interface Profile {
  role: string;
}

const MainLayout: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (error) throw error;
          setIsAdmin(data?.role === "admin");
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    fetchUserRole();
    // Re-fetch user role if the path changes, to ensure correct navbar display
  }, [location.pathname]);

  if (loading) {
    return null; // Don't render anything until the role check is complete
  }

  return (
    <div>
      {!isAdmin && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
