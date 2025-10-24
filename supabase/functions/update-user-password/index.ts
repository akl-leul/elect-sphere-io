import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers to allow requests from any origin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to check if a user has the 'admin' role.
// This requires a Supabase client with service_role privileges.
async function isAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single(); // Use .single() to ensure we expect exactly one row

  // If there's an error or no data is returned, the user is not an admin.
  if (error || !data) {
    return false;
  }
  return true;
}

serve(async (req) => {
  // This is a preflight request. We don't need to do anything special here.
  // Just return the CORS headers.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service_role key to bypass RLS.
    // This is necessary for checking admin status and updating other users.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Authenticate the user making the request by validating their JWT.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(jwt);

    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // 2. Authorize the user by checking if they have the 'admin' role.
    const isUserAdmin = await isAdmin(supabaseAdmin, user.id);
    if (!isUserAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Not an admin" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    // 3. Validate the request body to ensure it has the required fields.
    const { user_id: targetUserId, new_password: newPassword } =
      await req.json();

    if (!targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "user_id and new_password are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(
        JSON.stringify({
          error: "Password must be a string of at least 6 characters",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // 4. Perform the main action: update the target user's password.
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });

    if (updateError) {
      throw updateError;
    }

    // 5. Return a success response.
    return new Response(
      JSON.stringify({ message: "Password updated successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    // Handle any unexpected errors.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
