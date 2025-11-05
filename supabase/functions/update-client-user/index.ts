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

  // 1. Autenticação (Verifica se o usuário é admin)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const { data: { user: callerUser }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
  
  if (userError || !callerUser) {
    return new Response(JSON.stringify({ error: 'Invalid token or user not found.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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

  // 2. Processamento da Requisição
  try {
    const { id, email, role, client_id, password } = await req.json()

    if (!id || !email || !role) {
      return new Response(JSON.stringify({ error: 'Missing id, email, or role.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Atualização do Auth User (Email e Senha)
    const authUpdatePayload: { email?: string, password?: string } = {};
    if (email) authUpdatePayload.email = email;
    if (password) authUpdatePayload.password = password;
    
    if (Object.keys(authUpdatePayload).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdatePayload);
        
        if (authError) {
            return new Response(JSON.stringify({ error: `Failed to update Auth user: ${authError.message}` }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
    }

    // 4. Atualização do Perfil (Role e Client ID)
    const final_client_id = (client_id === 'none' || client_id === '') ? null : client_id;
    
    const profileUpdatePayload = {
        role: role,
        client_id: final_client_id, 
        updated_at: new Date().toISOString(),
    };
    
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', id)
      
    if (profileUpdateError) {
      return new Response(JSON.stringify({ error: `Failed to update profile: ${profileUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'User updated successfully.' }), {
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