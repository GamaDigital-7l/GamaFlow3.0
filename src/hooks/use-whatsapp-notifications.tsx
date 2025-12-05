import { useAppSettings } from './use-app-settings';
import { useCallback } from 'react';
import { showError } from '@/utils/toast';

const WHATSAPP_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/send-whatsapp-notification';

interface WhatsappConfig {
    apiKey: string;
    instanceUrl: string;
    isEnabled: boolean;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função interna para enviar a notificação
const sendNotification = async (config: WhatsappConfig, number: string, message: string) => {
    if (!config.isEnabled || !config.apiKey || !config.instanceUrl) {
        // console.log("WhatsApp notification skipped: disabled or missing config.");
        return;
    }
    
    // Formata o número: remove caracteres não numéricos e adiciona 55 se for número individual
    let formattedNumber = number.replace(/\D/g, '');
    
    // Se for um número individual (não um ID de grupo), garante o código do país (55)
    // IDs de grupo geralmente começam com 'g' ou têm um formato diferente, mas para simplificar,
    // se for um número longo (ex: 10+ dígitos) e não começar com 55, adicionamos.
    if (formattedNumber.length >= 10 && !formattedNumber.startsWith('55')) {
        formattedNumber = '55' + formattedNumber;
    }
    
    try {
        const response = await fetch(WHATSAPP_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.apiKey,
                ...corsHeaders
            },
            body: JSON.stringify({
                apiKey: config.apiKey,
                instanceUrl: config.instanceUrl,
                number: formattedNumber,
                message: message,
            }),
        });

        const result = await response.json()

        if (!response.ok || result.status === 'error') {
            console.error("Evolution API Error:", result);
            return new Response(JSON.stringify({ error: result.message || 'Failed to send WhatsApp message.' }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
    } catch (error) {
        console.error("Network error sending WhatsApp notification:", error);
    }
};

export const useWhatsappNotifications = () => {
    const { settings } = useAppSettings();
    
    // 1. Notificação de Clientes (Aprovação, Edição, Link Gerado)
    const notifyClientAction = useCallback((clientNumber: string, clientName: string, action: string, postTitle: string, details?: string) => {
        const config = settings.clientWhatsappConfig;
        
        const message = 
`*Gama Creative - Notificação*
Olá ${clientName}!
Ação: ${action}
Post/Tarefa: ${postTitle}
${details ? `Detalhes: ${details}` : ''}`;

        sendNotification(config, clientNumber, message);
    }, [settings.clientWhatsappConfig]);
    
    // 2. Notificação de CRM (Leads, Ações Internas)
    const notifyCrmAction = useCallback((targetNumber: string, title: string, status: string, board: string, details?: string) => {
        const config = settings.crmWhatsappConfig;
        
        const message = 
`*ALERTA CRM/PRODUTIVIDADE*
Título: ${title}
Status: ${status}
Quadro: ${board}
${details ? `Detalhes: ${details}` : ''}`;

        sendNotification(config, targetNumber, message);
    }, [settings.crmWhatsappConfig]);

    return {
        notifyClientAction,
        notifyCrmAction,
    };
};