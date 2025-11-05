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
    const { email, password, client_id } = await req.json()

    if (!email || !password || !client_id) {
      return new Response(JSON.stringify({ error: 'Missing email, password, or client_id.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Criação do Usuário (Auth)
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        // Adiciona o email ao metadata para que possamos buscá-lo no frontend via profiles
        email: email, 
      }
    })

    if (authError) {
      // Retorna o erro específico do Supabase Auth
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Atualização do Perfil (Role e Client ID)
    const newUserId = newUser.user.id;
    
    // Nota: O trigger handle_new_user já deve ter criado o perfil com role 'user'.
    // Aqui, atualizamos para 'client' e vinculamos o client_id.
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role: 'client', 
        client_id: client_id,
        first_name: 'Cliente',
        last_name: 'Portal',
      })
      .eq('id', newUserId)
      
    if (profileUpdateError) {
      // Se falhar ao atualizar o perfil, deleta o usuário recém-criado para evitar lixo
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Failed to link profile: ${profileUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'User created and linked successfully.', userId: newUserId }), {
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