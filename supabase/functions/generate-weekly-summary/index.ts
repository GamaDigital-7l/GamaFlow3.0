import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para enviar notificação via Telegram
const sendTelegramNotification = async (botToken: string, chatId: string, message: string) => {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error("Telegram API Error:", result);
      throw new Error(result.description || 'Failed to send message to Telegram.');
    }
};

// Função para buscar configurações do app (simulando busca em secrets)
const getTelegramConfig = () => {
    // Assume que os secrets estão configurados no ambiente Deno
    const botToken = Deno.env.get('TELEGRAM_TASK_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_TASK_CHAT_ID');
    
    if (!botToken || !chatId) {
        console.warn("Telegram secrets not configured (TELEGRAM_TASK_BOT_TOKEN or TELEGRAM_TASK_CHAT_ID). Skipping summary.");
        return null;
    }
    
    return { botToken, chatId };
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // 1. Autenticação (Permite Service Role Key ou Admin para testes)
  const authHeader = req.headers.get('Authorization')
  const isServiceRole = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'INVALID');
  
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
  
  if (!isServiceRole) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''));
    const { data: profileData } = await supabaseAdmin.from('profiles').select('role').eq('id', user?.id).single();
    
    if (!user || profileData?.role !== 'admin') {
        return new Response('Unauthorized: Service Role or Admin required.', { status: 401, headers: corsHeaders })
    }
  }

  try {
    // 2. Configuração do Telegram
    const config = getTelegramConfig();
    if (!config) {
        return new Response(JSON.stringify({ message: 'Telegram config missing. Summary skipped.' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // 3. Definição do Período (Últimos 7 dias)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgoISO = oneWeekAgo.toISOString();
    
    // 4. Coleta de Dados (Usando supabaseAdmin para ignorar RLS)
    
    // A. Tarefas Concluídas
    const { data: completedTasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, title, client_name')
        .eq('status', 'Concluída')
        .gte('completed_at', oneWeekAgoISO);
        
    if (tasksError) throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    
    // B. Metas Concluídas
    const { data: completedGoals, error: goalsError } = await supabaseAdmin
        .from('goals')
        .select('id, title')
        .eq('status', 'Concluída')
        .gte('due_date', oneWeekAgoISO); // Usando due_date como proxy para conclusão recente
        
    if (goalsError) throw new Error(`Failed to fetch goals: ${goalsError.message}`);
    
    // C. Novos Feedbacks
    const { data: newFeedback, error: feedbackError } = await supabaseAdmin
        .from('client_feedback')
        .select('id, type, client_id')
        .gte('created_at', oneWeekAgoISO);
        
    if (feedbackError) throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);
    
    // 5. Geração do Resumo
    
    const totalTasks = completedTasks.length;
    const totalGoals = completedGoals.length;
    const praises = newFeedback.filter(f => f.type === 'praise').length;
    const improvements = newFeedback.filter(f => f.type === 'improvement').length;
    
    const summaryMessage = 
`*RESUMO SEMANAL DE PRODUTIVIDADE* 🚀
(Período: ${oneWeekAgo.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')})

*1. Tarefas e Entregas:*
✅ *${totalTasks}* tarefas concluídas.
🎯 *${totalGoals}* metas atingidas.

*2. Feedback de Clientes:*
👍 *${praises}* elogios recebidos.
👎 *${improvements}* sugestões de melhoria.

*3. Detalhes das Entregas (Top 5):*
${completedTasks.slice(0, 5).map(t => `- ${t.title} (${t.client_name || 'Geral'})`).join('\n')}
${totalTasks > 5 ? `... e mais ${totalTasks - 5} tarefas.` : ''}

*Atenção:* Verifique o CRM para leads estagnados e o Kanban para posts em edição.
`;

    // 6. Envio
    await sendTelegramNotification(config.botToken, config.chatId, summaryMessage);

    return new Response(JSON.stringify({ message: 'Weekly summary sent successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})