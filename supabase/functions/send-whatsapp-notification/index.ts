import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { apiKey, instanceUrl, number, message } = await req.json()

    if (!apiKey || !instanceUrl || !number || !message) {
      return new Response(JSON.stringify({ error: 'Missing required parameters (apiKey, instanceUrl, number, or message).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // A Evolution API usa o formato: [URL_INSTANCIA]/message/sendText/[NUMERO_OU_GRUPO]
    const whatsappApiUrl = `${instanceUrl}/message/sendText/${number}`;
    
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey, // Evolution API usa 'apikey' no header
      },
      body: JSON.stringify({
        text: message,
      }),
    })

    const result = await response.json()

    if (!response.ok || result.status === 'error') {
      console.error("Evolution API Error:", result);
      return new Response(JSON.stringify({ error: result.message || 'Failed to send WhatsApp message.' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})