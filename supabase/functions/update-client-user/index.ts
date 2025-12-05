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

  // 2. Processamento da Requisição
  try {
    // Recebe client_ids como array ou null
    const { id, email, role, client_ids, password } = await req.json()

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

    // 4. Atualização do Perfil (Role e Client IDs)
    
    let final_client_ids: string[] | null = null;
    
    if (role === 'client') {
        // Cliente deve ter exatamente 1 ID
        if (!client_ids || !Array.isArray(client_ids) || client_ids.length !== 1) {
            return new Response(JSON.stringify({ error: 'Client role requires exactly one client_id.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        final_client_ids = client_ids;
    } else if (role === 'equipe') {
        // Equipe deve ter pelo menos 1 ID
        if (!client_ids || !Array.isArray(client_ids) || client_ids.length === 0) {
            return new Response(JSON.stringify({ error: 'Equipe role requires at least one client_id.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        final_client_ids = client_ids;
    } 
    // Se a role for 'admin' ou 'user', final_client_ids permanece null.
    
    const profileUpdatePayload = {
        role: role,
        client_ids: final_client_ids, 
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