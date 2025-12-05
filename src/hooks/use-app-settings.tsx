import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

interface AiConfig {
  provider: 'groq' | 'openai';
  apiKey: string;
  isEnabled: boolean;
}

// NOVO: Configuração da Evolution API
interface EvolutionApiConfig {
  apiKey: string;
  instanceUrl: string;
  isEnabled: boolean;
}

interface AppSettings {
  logoLightUrl: string;
  logoDarkUrl: string;
  clientTelegramConfig: TelegramConfig;
  taskTelegramConfig: TelegramConfig;
  aiSummaryConfig: AiConfig;
  // NOVO: Configurações do WhatsApp
  clientWhatsappConfig: EvolutionApiConfig;
  crmWhatsappConfig: EvolutionApiConfig;
}

const SETTINGS_QUERY_KEY = 'appSettings';
const GLOBAL_SETTINGS_ID = 'global_settings';

const defaultSettings: AppSettings = {
  logoLightUrl: '/placeholder.svg',
  logoDarkUrl: '/placeholder.svg',
  clientTelegramConfig: {
    botToken: '',
    chatId: '',
    isEnabled: false,
  },
  taskTelegramConfig: {
    botToken: '',
    chatId: '',
    isEnabled: false,
  },
  aiSummaryConfig: {
    provider: 'groq',
    apiKey: '',
    isEnabled: false,
  },
  // NOVO: Padrões do WhatsApp
  clientWhatsappConfig: {
    apiKey: '',
    instanceUrl: '',
    isEnabled: false,
  },
  crmWhatsappConfig: {
    apiKey: '',
    instanceUrl: '',
    isEnabled: false,
  },
};

// Função para buscar as configurações do DB
const fetchSettings = async (): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('settings')
    .eq('id', GLOBAL_SETTINGS_ID)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Se for um erro diferente de "No rows found", lança o erro
    throw new Error(error.message);
  }
  
  // Se não houver dados ou se a coluna 'settings' for nula, retorna o padrão
  const loadedSettings = data?.settings || {};
  
  // Mescla com o padrão para garantir que todas as chaves existam
  return {
    ...defaultSettings,
    ...loadedSettings,
    clientTelegramConfig: { ...defaultSettings.clientTelegramConfig, ...loadedSettings.clientTelegramConfig },
    taskTelegramConfig: { ...defaultSettings.taskTelegramConfig, ...loadedSettings.taskTelegramConfig },
    aiSummaryConfig: { ...defaultSettings.aiSummaryConfig, ...loadedSettings.aiSummaryConfig },
    // NOVO: Mesclando configurações do WhatsApp
    clientWhatsappConfig: { ...defaultSettings.clientWhatsappConfig, ...loadedSettings.clientWhatsappConfig },
    crmWhatsappConfig: { ...defaultSettings.crmWhatsappConfig, ...loadedSettings.crmWhatsappConfig },
  };
};

// Função para salvar as configurações no DB
const updateSettingsInDB = async (newSettings: AppSettings): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('app_settings')
    .update({ 
        settings: newSettings, 
        updated_at: new Date().toISOString() 
    })
    .eq('id', GLOBAL_SETTINGS_ID)
    .select('settings')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  
  // Retorna o objeto AppSettings completo
  return { 
    ...defaultSettings, 
    ...data.settings,
    clientWhatsappConfig: { ...defaultSettings.clientWhatsappConfig, ...data.settings.clientWhatsappConfig },
    crmWhatsappConfig: { ...defaultSettings.crmWhatsappConfig, ...data.settings.crmWhatsappConfig },
  };
};


export const useAppSettings = () => {
  const queryClient = useQueryClient();

  // Query para buscar as configurações
  const { data: settings = defaultSettings, isLoading } = useQuery<AppSettings, Error>({
    queryKey: [SETTINGS_QUERY_KEY],
    queryFn: fetchSettings,
    staleTime: Infinity, // Configurações raramente mudam, mantemos o cache por muito tempo
  });

  // Mutação para atualizar as configurações
  const updateMutation = useMutation({
    mutationFn: updateSettingsInDB,
    onSuccess: (updatedSettings) => {
      // Atualiza o cache localmente
      queryClient.setQueryData([SETTINGS_QUERY_KEY], updatedSettings);
      showSuccess('Configurações salvas com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao salvar configurações: ${err.message}`);
    },
  });

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    const mergedSettings: AppSettings = {
      ...settings,
      ...newSettings,
      clientTelegramConfig: { ...settings.clientTelegramConfig, ...newSettings.clientTelegramConfig },
      taskTelegramConfig: { ...settings.taskTelegramConfig, ...newSettings.taskTelegramConfig },
      aiSummaryConfig: { ...settings.aiSummaryConfig, ...newSettings.aiSummaryConfig },
      // NOVO: Mesclando configurações do WhatsApp
      clientWhatsappConfig: { ...settings.clientWhatsappConfig, ...newSettings.clientWhatsappConfig },
      crmWhatsappConfig: { ...settings.crmWhatsappConfig, ...newSettings.crmWhatsappConfig },
    };
    updateMutation.mutate(mergedSettings);
  }, [settings, updateMutation]);

  return {
    settings,
    updateSettings,
    isLoading,
    isSaving: updateMutation.isPending,
  };
};