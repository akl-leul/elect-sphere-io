import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const electionId = formData.get("electionId") as string;
    const title = formData.get("title") as string;

    if (!file || !electionId || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "Processing document:",
      file.name,
      "for election:",
      electionId,
      "size:",
      file.size,
    );

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("Supabase client initialized");

    // Upload file to storage
    const fileExt = file.name.split(".").pop();
    const fileName = `requirements/${electionId}/${Date.now()}.${fileExt}`;

    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("candidate-files")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload document");
    }

    console.log("File uploaded to Supabase storage");

    const {
      data: { publicUrl },
    } = supabase.storage.from("candidate-files").getPublicUrl(fileName);

    console.log("Public URL obtained:", publicUrl);

    console.log("Uploading file to Gemini File API...");

    // Upload to Gemini File API
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
    const uploadForm = new FormData();
    uploadForm.append(
      "file",
      new Blob([JSON.stringify({ file: { display_name: title } })], {
        type: "application/json",
      }),
    );
    uploadForm.append("file", file);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadForm,
    });

    console.log("Gemini upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Gemini upload error:", uploadResponse.status, errorText);
      throw new Error(`Failed to upload file to Gemini: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    const fileUri = uploadData.file.uri;

    console.log("File uploaded to Gemini, URI:", fileUri);

    console.log("Calling Gemini API to extract text...");

    // Call Gemini API to extract text using the uploaded file
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Extract all text from this document. Format it clearly with proper headings and structure. Include all requirements, policies, and rules mentioned.",
                },
                {
                  file_data: {
                    file_uri: fileUri,
                    mime_type: file.type,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    console.log(
      "Gemini generateContent response status:",
      geminiResponse.status,
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      throw new Error(`Failed to process document with Gemini: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const extractedText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!extractedText) {
      throw new Error("No text extracted from document");
    }

    console.log("Text extracted successfully, length:", extractedText.length);

    // Save to database
    const { data: requirement, error: dbError } = await supabase
      .from("election_requirements")
      .insert({
        election_id: electionId,
        title: title,
        content: extractedText,
        document_url: publicUrl,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save requirements");
    }

    console.log("Requirements saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        requirement,
        message: "Document processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in process-document function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process document",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
