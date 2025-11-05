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
  
  // 1. Autenticação (Verifica se o usuário é admin)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }
  
  // Cria o cliente Supabase com a Service Role Key
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

  // Verifica a role do usuário que está chamando a função
  const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  
  if (userError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Invalid token or user not found.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Busca a role do usuário chamador na tabela profiles
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .single()

  if (profileError || profileData.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Access denied. Admin role required.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Busca de todos os usuários Auth
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  // 3. Busca de todos os perfis
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  // 4. Combina Auth Users e Profiles
  const profilesMap = new Map(profiles.map(p => [p.id, p]));
  
  const combinedUsers = authUsers.users.map(authUser => {
    const profile = profilesMap.get(authUser.id);
    
    return {
      id: authUser.id,
      email: authUser.email,
      role: profile?.role || 'user', // Padrão 'user' se o perfil não for encontrado
      client_id: profile?.client_id || null,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
    };
  });

  return new Response(JSON.stringify(combinedUsers), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})