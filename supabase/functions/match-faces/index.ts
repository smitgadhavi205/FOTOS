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
    const { eventId, selfieUrl, sessionId } = await req.json();

    if (!eventId || !selfieUrl || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId, selfieUrl, sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rawFaceApiUrl = (Deno.env.get('FACE_API_URL') ?? '').trim().replace(/\/+$/, '');
    let faceApiUrl: string | null = null;
    try {
      if (rawFaceApiUrl) {
        const parsed = new URL(rawFaceApiUrl);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          faceApiUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '');
        }
      }
    } catch (_e) {
      faceApiUrl = null;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing face match for event ${eventId}, session ${sessionId}`);

    let matchedImageIds: string[] = [];

    // Use Railway backend for face matching if configured
    if (faceApiUrl) {
      try {
        console.log('Calling Railway face matching backend...');
        
        const response = await fetch(`${faceApiUrl}/match-selfie`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: eventId,
            selfie_url: selfieUrl,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          matchedImageIds = data.matched_image_ids || [];
          console.log(`Railway backend found ${matchedImageIds.length} matches`);
        } else {
          const errorText = await response.text();
          console.error('Railway backend error:', response.status, errorText);
        }
      } catch (apiError) {
        console.error('Error calling Railway backend:', apiError);
      }
    } else {
      console.log('FACE_API_URL not configured, using fallback AI matching...');
      
      // Fallback to Lovable AI if Railway not configured
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      
      if (lovableApiKey) {
        // Fetch event images for AI analysis
        const { data: eventImages, error: imagesError } = await supabase
          .from('event_images')
          .select('id, image_url')
          .eq('event_id', eventId);

        if (imagesError) {
          console.error('Error fetching event images:', imagesError);
          throw imagesError;
        }

        if (eventImages && eventImages.length > 0) {
          try {
            const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${lovableApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  {
                    role: 'system',
                    content: `You are a face matching assistant. Given a selfie and event photos, identify which photos contain the person from the selfie. Return ONLY a JSON array of matching image IDs. If you cannot determine matches or see faces clearly, return an empty array []. Be conservative - only return matches you're confident about.`
                  },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: `Please analyze this selfie and compare it with the event photos below. Return a JSON array of IDs for photos that contain the same person.\n\nEvent images:\n${eventImages.map(img => `ID: ${img.id}, URL: ${img.image_url}`).join('\n')}\n\nReturn only the JSON array of matching IDs, nothing else.`
                      },
                      {
                        type: 'image_url',
                        image_url: { url: selfieUrl }
                      }
                    ]
                  }
                ],
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const content = data.choices?.[0]?.message?.content || '[]';
              
              try {
                const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
                if (Array.isArray(parsed)) {
                  matchedImageIds = parsed.filter(id => 
                    eventImages.some(img => img.id === id)
                  );
                }
              } catch (parseError) {
                console.log('Could not parse AI response:', content);
              }
            }
          } catch (aiError) {
            console.error('AI matching error:', aiError);
          }
        }
      }
    }

    // Store the match result
    const { error: insertError } = await supabase
      .from('guest_matches')
      .insert({
        event_id: eventId,
        selfie_url: selfieUrl,
        matched_image_ids: matchedImageIds,
        session_id: sessionId,
      });

    if (insertError) {
      console.error('Error storing match:', insertError);
    }

    // Clean up: delete the selfie after processing for privacy
    try {
      const selfiePathMatch = selfieUrl.match(/guest-selfies\/(.+)$/);
      if (selfiePathMatch) {
        await supabase.storage
          .from('guest-selfies')
          .remove([selfiePathMatch[1]]);
        console.log('Selfie deleted for privacy');
      }
    } catch (deleteError) {
      console.error('Error deleting selfie:', deleteError);
    }

    return new Response(
      JSON.stringify({ 
        matchedImageIds,
        message: matchedImageIds.length > 0 
          ? `Found ${matchedImageIds.length} matching photos` 
          : 'No matches found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Match faces error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
