import { useAppSettings } from './use-app-settings';
import { useCallback } from 'react';
import { showError } from '@/utils/toast';

const TELEGRAM_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/send-telegram-notification';

interface TelegramConfig {
    botToken: string;
    chatId: string;
    isEnabled: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função interna para enviar a notificação
const sendNotification = async (config: TelegramConfig, message: string) => {
    if (!config.isEnabled || !config.botToken || !config.chatId) {
        // console.log("Telegram notification skipped: disabled or missing config.");
        return;
    }
    
    try {
        const response = await fetch(TELEGRAM_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
            },
            body: JSON.stringify({
                botToken: config.botToken,
                chatId: config.chatId,
                message: message,
            }),
        });

        if (!response.ok) {
            const result = await response.json();
            console.error("Telegram API Error:", result);
            throw new Error(result.description || 'Failed to send message to Telegram.');
        }
    } catch (error) {
        console.error("Network error sending Telegram notification:", error);
    }
};

export const useTelegramNotifications = () => {
    const { settings } = useAppSettings();
    
    // 1. Notificação de Clientes (Aprovação, Edição, Link Gerado)
    const notifyClientAction = useCallback((clientName: string, action: string, postTitle: string, details?: string) => {
        const config = settings.clientTelegramConfig;
        
        const message = 
`*CLIENTE: ${clientName}*
Ação: ${action}
Post/Tarefa: ${postTitle}
${details ? `Detalhes: ${details}` : ''}`;

        sendNotification(config, message);
    }, [settings.clientTelegramConfig]);
    
    // 2. Notificação de Tarefas Pessoais (Alta Prioridade, Atraso, Lembrete, Recorrente Falhada)
    const notifyTaskAction = useCallback((title: string, status: string, board: string, details?: string) => {
        const config = settings.taskTelegramConfig;
        
        const message = 
`*TAREFA PESSOAL*
Título: ${title}
Status: ${status}
Quadro: ${board}
${details ? `Detalhes: ${details}` : ''}`;

        sendNotification(config, message);
    }, [settings.taskTelegramConfig]);

    return {
        notifyClientAction,
        notifyTaskAction,
    };
};