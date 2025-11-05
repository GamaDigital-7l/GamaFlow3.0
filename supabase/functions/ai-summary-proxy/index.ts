import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para chamar a API de IA
async function generateSummary(provider: 'groq' | 'openai', apiKey: string, prompt: string): Promise<string> {
    let apiUrl: string;
    let model: string;
    let headers: Record<string, string>;

    if (provider === 'groq') {
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        // Usando o modelo mais recente e estável do Groq
        model = 'llama-3.1-8b-instant'; 
        headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };
    } else if (provider === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-3.5-turbo';
        headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        };
    } else {
        throw new Error("Provedor de IA inválido.");
    }

    const body = JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
    });

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`AI API Error (${provider}):`, errorData);
        throw new Error(`Falha na API de IA: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação (Verifica se o usuário está logado)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }
  
  // Cria o cliente Supabase com a Service Role Key (não usado aqui, mas mantido por padrão)
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
    // Agora aceita 'prompt' genérico, além dos dados de tarefas
    const { tasksCompleted, tasksPending, provider, apiKey, prompt: genericPrompt } = await req.json();

    if (!provider || !apiKey) {
      return new Response(JSON.stringify({ error: 'Missing required data (provider, or apiKey).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    let finalPrompt: string;
    
    if (genericPrompt) {
        // Se um prompt genérico for fornecido (para propostas)
        finalPrompt = genericPrompt;
    } else {
        // Se não, usa a lógica de resumo de tarefas (padrão)
        if (!tasksCompleted || !tasksPending) {
             return new Response(JSON.stringify({ error: 'Missing task data for daily summary.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        
        finalPrompt = `Você é um assistente de produtividade da agência Gama Creative. Analise as seguintes listas de tarefas concluídas hoje e pendentes (incluindo atrasadas) e forneça um resumo conciso, profissional e motivacional em português.
        
        O resumo deve ter no máximo 4 parágrafos curtos e focar em:
        1. Reconhecer o volume de trabalho concluído.
        2. Destacar as 3 tarefas pendentes mais urgentes (pela data de vencimento).
        3. Dar uma recomendação de foco para o restante do dia.
        
        --- Dados de Tarefas ---
        
        Tarefas Concluídas (${tasksCompleted.length}):
        ${tasksCompleted.map((t: any) => `- [CONCLUÍDA] ${t.title} (${t.clientName || 'Geral'})`).join('\n')}
        
        Tarefas Pendentes (${tasksPending.length}):
        ${tasksPending.map((t: any) => `- [PENDENTE] ${t.title} (Vence em: ${t.dueDate})`).join('\n')}
        
        ---
        
        Gere apenas o texto do resumo.
        `;
    }

    // 3. Chamada à API de IA
    const summary = await generateSummary(provider, apiKey, finalPrompt);
    
    return new Response(JSON.stringify({ summary }), {
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