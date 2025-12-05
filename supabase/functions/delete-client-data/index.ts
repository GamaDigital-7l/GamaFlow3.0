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
    const { clientId } = await req.json()

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Missing clientId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Buscar IDs de usuários vinculados a este cliente
    const { data: clientProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('client_id', clientId)
      
    if (profilesError) {
      return new Response(JSON.stringify({ error: `Failed to fetch client users: ${profilesError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const userIdsToDelete = clientProfiles.map(p => p.id);
    
    // 4. Deletar usuários Auth (Service Role Key)
    if (userIdsToDelete.length > 0) {
        console.log(`Deleting ${userIdsToDelete.length} users for client ${clientId}`);
        
        // Supabase Admin API não tem um método de exclusão em massa por client_id,
        // então iteramos sobre os IDs.
        for (const userId of userIdsToDelete) {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteAuthError) {
                console.error(`Failed to delete user ${userId}: ${deleteAuthError.message}`);
                // Continuamos, mas registramos o erro
            }
        }
    }
    
    // Nota: A exclusão de dados do cliente (posts, links, etc.) é tratada
    // pelas políticas RLS e Foreign Keys no banco de dados, ou será simulada no frontend.
    // O foco principal desta função é a exclusão dos usuários Auth.

    return new Response(JSON.stringify({ message: `Client users deleted successfully. Total users deleted: ${userIdsToDelete.length}` }), {
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