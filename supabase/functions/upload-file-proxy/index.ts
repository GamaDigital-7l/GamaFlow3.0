import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. Authenticate the request (requires a valid session token)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }
  
  // 2. Create a Supabase client with the service role key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  
  // Verify user session and get user ID
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userError || !user) {
      return new Response('Invalid token or user not found.', { status: 401, headers: corsHeaders });
  }

  try {
    // 3. Extract data from the request
    const { filename, fileType, fileBase64, path } = await req.json()

    if (!filename || !fileType || !fileBase64 || !path) {
      return new Response('Missing required parameters (filename, fileType, fileBase64, path).', { status: 400, headers: corsHeaders })
    }

    // 4. Decode the base64 file data
    const fileData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    // 5. Upload the file to Supabase Storage (using 'playbook-files' bucket)
    const filePath = path + '/' + filename;
    const { data, error } = await supabaseAdmin
      .storage
      .from('playbook-files')
      .upload(filePath, fileData, {
        contentType: fileType,
        upsert: true
      })

    if (error) {
      console.error("Supabase upload error:", error);
      return new Response(JSON.stringify({ error: 'Failed to upload file to Supabase Storage: ' + error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 6. Get the public URL of the uploaded file
    const { data: { publicUrl } } = await supabaseAdmin
      .storage
      .from('playbook-files')
      .getPublicUrl(data.path)

    // 7. Return the public URL
    return new Response(JSON.stringify({ publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})