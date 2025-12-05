import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTaskStore } from './use-task-store';
import { useAppSettings } from './use-app-settings';
import { format, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Task } from '@/types/task';

const AI_SUMMARY_QUERY_KEY = 'aiDailySummary';
// URL da Edge Function para proxy de IA
const AI_SUMMARY_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/ai-summary-proxy';
// URL da Edge Function para notificação Telegram (usada no teste)
const TELEGRAM_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/send-telegram-notification';


// 1. Prepara os dados da tarefa para a IA
const prepareTaskData = (tasks: Task[]) => {
    const today = new Date();

    const completedToday = tasks.filter(t => 
        t.status === 'Concluída' && t.completedAt && isToday(t.completedAt)
    ).map(t => ({
        title: t.title,
        clientName: t.clientName,
    }));

    const pendingToday = tasks.filter(t => 
        t.status === 'Pendente'
    ).map(t => ({
        title: t.title,
        dueDate: format(t.dueDate, 'dd/MM HH:mm'),
    })).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Ordena por data de vencimento

    return { completedToday, pendingToday };
};

// 2. Busca o resumo da Edge Function de IA
const fetchAiSummary = async (tasks: Task[], settings: any): Promise<string> => {
    const { aiSummaryConfig } = settings;
    if (!aiSummaryConfig.isEnabled || !aiSummaryConfig.apiKey) {
        return "Resumo de IA desativado nas configurações.";
    }
    
    const { completedToday, pendingToday } = prepareTaskData(tasks);
    
    if (completedToday.length === 0 && pendingToday.length === 0) {
        return "Nenhuma tarefa para resumir hoje.";
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de usuário necessária.");

    const response = await fetch(AI_SUMMARY_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            tasksCompleted: completedToday,
            tasksPending: pendingToday,
            provider: aiSummaryConfig.provider,
            apiKey: aiSummaryConfig.apiKey,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Falha ao gerar resumo via IA.');
    }

    return result.summary;
};

export const useAiSummary = () => {
    const queryClient = useQueryClient();
    const { tasks, isLoading: isLoadingTasks } = useTaskStore();
    const { settings, isLoading: isLoadingSettings } = useAppSettings();
    
    const isAiEnabled = settings.aiSummaryConfig.isEnabled && !!settings.aiSummaryConfig.apiKey;

    // Query para buscar o resumo diário
    const { data: summary = '', isLoading: isLoadingSummary } = useQuery<string, Error>({
        queryKey: [AI_SUMMARY_QUERY_KEY, format(new Date(), 'yyyy-MM-dd')], // A chave muda diariamente
        queryFn: () => fetchAiSummary(tasks, settings),
        enabled: isAiEnabled && !isLoadingTasks && !isLoadingSettings,
        staleTime: 3600000, // Cache por 1 hora
    });
    
    // Função de teste para AppSettingsPage
    const testMutation = useMutation({
        mutationFn: async () => {
            const { completedToday, pendingToday } = prepareTaskData(tasks);
            
            if (completedToday.length === 0 && pendingToday.length === 0) {
                throw new Error("Nenhuma tarefa para resumir hoje. Adicione algumas tarefas concluídas ou pendentes para testar.");
            }
            
            const { aiSummaryConfig, taskTelegramConfig } = settings;
            if (!aiSummaryConfig.isEnabled || !aiSummaryConfig.apiKey) {
                throw new Error("Configuração de IA ausente.");
            }
            if (!taskTelegramConfig.isEnabled || !taskTelegramConfig.botToken || !taskTelegramConfig.chatId) {
                throw new Error("Configuração de Telegram para Tarefas ausente.");
            }

            const toastId = showLoading("Gerando resumo de teste...");
            
            try {
                // 1. Gerar o resumo
                const summaryText = await fetchAiSummary(tasks, settings);
                
                // 2. Enviar para o Telegram (usando a Edge Function de Telegram)
                const telegramMessage = `*TESTE DE RESUMO DIÁRIO DE IA*
                
${summaryText}

---
_Esta é uma mensagem de teste enviada das Configurações do App._`;

                const response = await fetch(TELEGRAM_FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        botToken: taskTelegramConfig.botToken,
                        chatId: taskTelegramConfig.chatId,
                        message: telegramMessage,
                    }),
                });
                
                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Falha ao enviar mensagem de teste para o Telegram.');
                }
                
                dismissToast(toastId);
                showSuccess("Resumo de teste gerado e enviado com sucesso para o Telegram!");
                
            } catch (error) {
                dismissToast(toastId);
                showError(`Falha no teste: ${error.message}`);
                throw error;
            }
        }
    });
    
    const { completedToday, pendingToday } = prepareTaskData(tasks);

    return {
        summary,
        isLoading: isLoadingSummary || isLoadingTasks || isLoadingSettings,
        isAiEnabled,
        testAiSummary: testMutation.mutateAsync,
        tasksCompletedToday: completedToday,
        tasksPendingToday: pendingToday,
    };
};