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
    const { botToken, chatId, message } = await req.json()

    if (!botToken || !chatId || !message) {
      return new Response(JSON.stringify({ error: 'Missing botToken, chatId, or message.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Formatação da data/hora em São Paulo (simulada, pois Edge Functions usam UTC)
    // Usaremos a data/hora atual da Edge Function (UTC) e indicaremos que é BRT/BRST.
    const now = new Date();
    const brtTime = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false });
    const formattedMessage = `${message}\nData/Hora BR: ${brtTime}`;

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'Markdown', // Usando Markdown para formatação básica
      }),
    })

    const result = await response.json()

    if (!response.ok || result.status === 'error') {
      console.error("Telegram API Error:", result);
      return new Response(JSON.stringify({ error: result.description || 'Failed to send message to Telegram.' }), {
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