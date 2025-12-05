import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação: Obtém o token do usuário que está chamando
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }
  const token = authHeader.replace('Bearer ', '');

  // Cria o cliente Supabase com a Service Role Key (Admin)
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

  try {
    // 2. Obtém o ID do usuário logado usando o token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token or user not found.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const userId = user.id;

    // 3. Atualiza o perfil para 'admin' usando a Service Role Key (ignora RLS)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      
    if (profileUpdateError) {
      return new Response(JSON.stringify({ error: `Failed to force admin role: ${profileUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: `Role 'admin' forced for user ${userId}.` }), {
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