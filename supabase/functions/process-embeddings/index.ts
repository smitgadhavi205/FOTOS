import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, imageUrls } = await req.json();

    if (!eventId || !imageUrls || !Array.isArray(imageUrls)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, imageUrls (array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawFaceApiUrl = (Deno.env.get('FACE_API_URL') ?? '').trim().replace(/\/+$/, '');

    // Must be a valid absolute http(s) URL, otherwise skip gracefully
    let faceApiUrl: string | null = null;
    if (rawFaceApiUrl) {
      try {
        const parsed = new URL(rawFaceApiUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          faceApiUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '');
        }
      } catch (_e) {
        faceApiUrl = null;
      }
    }

    if (!faceApiUrl) {
      console.log('FACE_API_URL missing or not a valid http(s) URL, skipping embedding extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Embeddings skipped - face recognition backend not configured',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${imageUrls.length} images for event ${eventId}`);

    // Call the Railway backend to process images and build the FAISS index
    const response = await fetch(`${faceApiUrl}/upload-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        image_urls: imageUrls,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Railway backend error:', response.status, errorText);
      throw new Error(`Railway backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Railway backend response:', data);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${data.processed_count || imageUrls.length} images`,
        processed: data.processed_count || imageUrls.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Process embeddings error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
