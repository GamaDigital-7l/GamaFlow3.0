import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppSettings } from './use-app-settings';
import { useTaskStore } from './use-task-store';
import { format } from 'date-fns';
import { showSuccess, showError, dismissToast, showLoading } from '@/utils/toast';
import { useMemo } from 'react';
import { useTelegramNotifications } from './use-telegram-notifications'; // Importando o hook de notificação

const AI_SUMMARY_QUERY_KEY = 'aiDailySummary';
const AI_SUMMARY_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/ai-summary-proxy';

// Função para buscar o resumo da IA
const fetchAiSummary = async (
    provider: 'groq' | 'openai', 
    apiKey: string, 
    tasksCompleted: any[], 
    tasksPending: any[],
): Promise<string> => {
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Usuário não autenticado.");
    
    // Filtra dados essenciais para o prompt
    const completedData = tasksCompleted.map(t => ({
        title: t.title,
        clientName: t.clientName,
    }));
    
    const pendingData = tasksPending.map(t => ({
        title: t.title,
        dueDate: format(t.dueDate, 'dd/MM HH:mm'),
    }));

    const response = await fetch(AI_SUMMARY_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
            tasksCompleted: completedData,
            tasksPending: pendingData,
            provider,
            apiKey,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`AI API Error (${provider}):`, errorData);
        throw new Error(`Falha na API de IA: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.summary;
}

export const useAiSummary = () => {
    const { settings } = useAppSettings();
    const { notifyTaskAction } = useTelegramNotifications(); // Usando o hook de notificação para o teste
    const { completed, overdue, todayHigh, todayMedium, thisWeekLow, woeTasks, clientTasks, agencyTasks, isLoading: isLoadingTasks } = useTaskStore();
    
    // Garantindo que isAiEnabled seja um booleano explícito
    const isAiEnabled = !!(settings.aiSummaryConfig.isEnabled && settings.aiSummaryConfig.apiKey);
    const provider = settings.aiSummaryConfig.provider;
    const apiKey = settings.aiSummaryConfig.apiKey;
    
    // Agrupa todas as tarefas relevantes para o resumo
    const tasksCompletedToday = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return completed.filter(t => t.completedAt && format(t.completedAt, 'yyyy-MM-dd') === todayStr);
    }, [completed]);
    
    const tasksPendingToday = useMemo(() => {
        // Inclui todas as tarefas pendentes que estão no dashboard principal (exceto futuras)
        return [...overdue, ...todayHigh, ...todayMedium, ...thisWeekLow, ...woeTasks, ...clientTasks, ...agencyTasks];
    }, [overdue, todayHigh, todayMedium, thisWeekLow, woeTasks, clientTasks, agencyTasks]);
    
    // A chave de query inclui a data para garantir que o resumo seja gerado apenas uma vez por dia
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    
    // Habilita a query apenas se a IA estiver ativada E as tarefas tiverem sido carregadas
    const queryEnabled = isAiEnabled && !isLoadingTasks;

    const { data: summary = null, isLoading } = useQuery<string | null, Error>({
        queryKey: [AI_SUMMARY_QUERY_KEY, todayKey],
        queryFn: () => fetchAiSummary(provider, apiKey, tasksCompletedToday, tasksPendingToday),
        enabled: queryEnabled, // Usando o booleano explícito
        staleTime: 24 * 60 * 60 * 1000, // Válido por 24h
        onSettled: (data, err) => {
            if (err) {
                showError(`Erro no Resumo IA: ${err.message}`);
            }
        }
    });
    
    // Função de teste manual (não usa o cache da query)
    const testAiSummary = async () => {
        if (!isAiEnabled) {
            showError("Ative o Resumo Diário e forneça a chave de API antes de testar.");
            return;
        }
        
        const toastId = showLoading("Gerando resumo de teste e enviando ao Telegram...");
        
        try {
            // 1. Gera o resumo
            const testSummary = await fetchAiSummary(provider, apiKey, tasksCompletedToday, tasksPendingToday);
            
            // 2. Envia a notificação de teste via hook de Telegram (apenas uma vez)
            notifyTaskAction(
                "Resumo Diário Gerado", 
                'TESTE IA', 
                'Dashboard', 
                testSummary.substring(0, 150) + '...'
            );
            
            showSuccess(`Teste concluído! Resumo gerado e enviado ao Telegram. Resumo: "${testSummary.substring(0, 50)}..."`);
            return testSummary;
        } catch (err) {
            showError(`Falha no teste: ${err.message}`);
        } finally {
            dismissToast(toastId);
        }
    };

    return {
        summary,
        isLoading,
        isAiEnabled,
        tasksCompletedToday,
        tasksPendingToday,
        testAiSummary, // Exportando a função de teste
    };
};