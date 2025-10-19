import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const electionId = formData.get('electionId') as string;
    const title = formData.get('title') as string;

    if (!file || !electionId || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing document:', file.name, 'for election:', electionId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `requirements/${electionId}/${Date.now()}.${fileExt}`;
    
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('candidate-files')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload document');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('candidate-files')
      .getPublicUrl(fileName);

    // Convert file to base64 for Gemini
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    console.log('Calling Gemini API to extract text...');

    // Call Gemini API to extract text
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: 'Extract all text from this document. Format it clearly with proper headings and structure. Include all requirements, policies, and rules mentioned.'
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Data
                }
              }
            ]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error('Failed to process document with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!extractedText) {
      throw new Error('No text extracted from document');
    }

    console.log('Text extracted successfully, length:', extractedText.length);

    // Save to database
    const { data: requirement, error: dbError } = await supabase
      .from('election_requirements')
      .insert({
        election_id: electionId,
        title: title,
        content: extractedText,
        document_url: publicUrl
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save requirements');
    }

    console.log('Requirements saved successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      requirement,
      message: 'Document processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in process-document function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to process document' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
