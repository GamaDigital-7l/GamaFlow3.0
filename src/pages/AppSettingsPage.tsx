import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Image, Sun, Moon, MessageSquare, ListTodo, Switch as SwitchIcon, AlertTriangle, Brain, Send, Zap, Phone } from 'lucide-react';
import { useAppSettings } from '@/hooks/use-app-settings';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAiSummary } from '@/hooks/use-ai-summary';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload'; // Importando o hook de upload

const AppSettingsPage: React.FC = () => {
  const { settings, updateSettings, isSaving, isLoading } = useAppSettings();
  const { testAiSummary, isLoading: isAiLoading } = useAiSummary();
  
  // Usamos um clientId vazio para indicar que é um upload global de app settings
  const { uploadFile, isUploading: isLogoUploading } = usePlaybookUpload(''); 
  
  // Sincroniza estados locais com as configurações carregadas
  useEffect(() => {
    setLightUrl(settings.logoLightUrl);
    setDarkUrl(settings.logoDarkUrl);
    setClientToken(settings.clientTelegramConfig.botToken);
    setClientChatId(settings.clientTelegramConfig.chatId);
    setClientEnabled(settings.clientTelegramConfig.isEnabled);
    setTaskToken(settings.taskTelegramConfig.botToken);
    setTaskChatId(settings.taskTelegramConfig.chatId);
    setTaskEnabled(settings.taskTelegramConfig.isEnabled);
    setAiProvider(settings.aiSummaryConfig.provider);
    setAiApiKey(settings.aiSummaryConfig.apiKey);
    setAiEnabled(settings.aiSummaryConfig.isEnabled);
    
    // NOVO: WhatsApp Client
    setClientWaApiKey(settings.clientWhatsappConfig.apiKey);
    setClientWaInstanceUrl(settings.clientWhatsappConfig.instanceUrl);
    setClientWaEnabled(settings.clientWhatsappConfig.isEnabled);
    
    // NOVO: WhatsApp CRM
    setCrmWaApiKey(settings.crmWhatsappConfig.apiKey);
    setCrmWaInstanceUrl(settings.crmWhatsappConfig.instanceUrl);
    setCrmWaEnabled(settings.crmWhatsappConfig.isEnabled);
    
  }, [settings]);
  
  const [lightUrl, setLightUrl] = useState(settings.logoLightUrl);
  const [darkUrl, setDarkUrl] = useState(settings.logoDarkUrl);
  
  // Estados para Notificações de Clientes (Telegram)
  const [clientToken, setClientToken] = useState(settings.clientTelegramConfig.botToken);
  const [clientChatId, setClientChatId] = useState(settings.clientTelegramConfig.chatId);
  const [clientEnabled, setClientEnabled] = useState(settings.clientTelegramConfig.isEnabled);

  // Estados para Notificações de Tarefas (Telegram)
  const [taskToken, setTaskToken] = useState(settings.taskTelegramConfig.botToken);
  const [taskChatId, setTaskChatId] = useState(settings.taskTelegramConfig.chatId);
  const [taskEnabled, setTaskEnabled] = useState(settings.taskTelegramConfig.isEnabled);
  
  // Estados para IA
  const [aiProvider, setAiProvider] = useState(settings.aiSummaryConfig.provider);
  const [aiApiKey, setAiApiKey] = useState(settings.aiSummaryConfig.apiKey);
  const [aiEnabled, setAiEnabled] = useState(settings.aiSummaryConfig.isEnabled);
  
  const [isTesting, setIsTesting] = useState(false);
  
  // NOVO: Estados para WhatsApp Client
  const [clientWaApiKey, setClientWaApiKey] = useState(settings.clientWhatsappConfig.apiKey);
  const [clientWaInstanceUrl, setClientWaInstanceUrl] = useState(settings.clientWhatsappConfig.instanceUrl);
  const [clientWaEnabled, setClientWaEnabled] = useState(settings.clientWhatsappConfig.isEnabled);
  
  // NOVO: Estados para WhatsApp CRM
  const [crmWaApiKey, setCrmWaApiKey] = useState(settings.crmWhatsappConfig.apiKey);
  const [crmWaInstanceUrl, setCrmWaInstanceUrl] = useState(settings.crmWhatsappConfig.instanceUrl);
  const [crmWaEnabled, setCrmWaEnabled] = useState(settings.crmWhatsappConfig.isEnabled);


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      logoLightUrl: lightUrl.trim(),
      logoDarkUrl: darkUrl.trim(),
      clientTelegramConfig: {
        botToken: clientToken.trim(),
        chatId: clientChatId.trim(),
        isEnabled: clientEnabled,
      },
      taskTelegramConfig: {
        botToken: taskToken.trim(),
        chatId: taskChatId.trim(),
        isEnabled: taskEnabled,
      },
      aiSummaryConfig: {
        provider: aiProvider as 'groq' | 'openai',
        apiKey: aiApiKey.trim(),
        isEnabled: aiEnabled,
      },
      // NOVO: WhatsApp Client
      clientWhatsappConfig: {
        apiKey: clientWaApiKey.trim(),
        instanceUrl: clientWaInstanceUrl.trim(),
        isEnabled: clientWaEnabled,
      },
      // NOVO: WhatsApp CRM
      crmWhatsappConfig: {
        apiKey: crmWaApiKey.trim(),
        instanceUrl: crmWaInstanceUrl.trim(),
        isEnabled: crmWaEnabled,
      },
    });
  };
  
  const handleRunTest = async () => {
    setIsTesting(true);
    try {
        await testAiSummary();
    } finally {
        setIsTesting(false);
    }
  };
  
  // Função de upload de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadResult = await uploadFile(file, 'app-settings/logos');
      if (uploadResult) {
          if (type === 'light') {
            setLightUrl(uploadResult.url);
          } else {
            setDarkUrl(uploadResult.url);
          }
      } else {
          showError('Falha ao fazer upload da imagem.');
      }
    }
  };
  
  const isFormDisabled = isSaving || isLogoUploading;
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando configurações globais...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
      <p className="text-muted-foreground">Gerencie a identidade visual e configurações globais do Portal Gama Creative.</p>

      {/* Alerta de Configuração de Secrets */}
      <Alert className="bg-yellow-50 border-yellow-500/50 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-200 p-4 shadow-lg">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="font-bold text-lg">Atenção: Configuração de Secrets</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          Para que as notificações de Tarefas e o Resumo Semanal funcionem, você deve configurar os secrets 
          `TELEGRAM_TASK_BOT_TOKEN` e `TELEGRAM_TASK_CHAT_ID` na sua Edge Function `generate-weekly-summary` 
          no console do Supabase.
        </AlertDescription>
      </Alert>

      {/* Seção 1: Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Image className="h-5 w-5 text-dyad-500" />
            <span>Logos do Aplicativo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-6">
            
            {/* Logo Modo Claro */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoLightUrl" className="flex items-center">
                  <Sun className="h-4 w-4 mr-2" /> Logo Modo Claro
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="logoLightUrl"
                    value={lightUrl}
                    onChange={(e) => setLightUrl(e.target.value)}
                    placeholder="URL da logo para fundo claro"
                    className="flex-grow"
                    disabled={isFormDisabled}
                  />
                  <Input 
                    id="fileUploadLight" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'light')} 
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => document.getElementById('fileUploadLight')?.click()}
                    disabled={isFormDisabled}
                  >
                    {isLogoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview (Claro)</Label>
                <div className="h-10 w-full border rounded-md flex items-center justify-center bg-white p-1">
                  {lightUrl && <img src={lightUrl} alt="Logo Claro" className="max-h-full max-w-full object-contain" />}
                </div>
              </div>
            </div>
            
            <Separator />

            {/* Logo Modo Escuro */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoDarkUrl" className="flex items-center">
                  <Moon className="h-4 w-4 mr-2" /> Logo Modo Escuro
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="logoDarkUrl"
                    value={darkUrl}
                    onChange={(e) => setDarkUrl(e.target.value)}
                    placeholder="URL da logo para fundo escuro"
                    className="flex-grow"
                    disabled={isFormDisabled}
                  />
                  <Input 
                    id="fileUploadDark" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'dark')} 
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => document.getElementById('fileUploadDark')?.click()}
                    disabled={isFormDisabled}
                  >
                    {isLogoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preview (Escuro)</Label>
                <div className="h-10 w-full border rounded-md flex items-center justify-center bg-gray-900 p-1">
                  {darkUrl && <img src={darkUrl} alt="Logo Escuro" className="max-h-full max-w-full object-contain" />}
                </div>
              </div>
            </div>
            
            <Separator className="my-8" />
            
            {/* Seção 4: Configuração de IA */}
            <div className="space-y-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-dyad-500" />
                    <span>Resumo Diário por IA</span>
                </CardTitle>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <Label htmlFor="aiEnabled" className="font-medium">Ativar Resumo Diário por IA</Label>
                    <Switch
                        id="aiEnabled"
                        checked={aiEnabled}
                        onCheckedChange={setAiEnabled}
                        disabled={isFormDisabled}
                    />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="aiProvider">Provedor de IA</Label>
                        <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as 'groq' | 'openai')} disabled={isFormDisabled}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o Provedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="groq">Groq (Recomendado: Rápido)</SelectItem>
                                <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aiApiKey">Chave de API ({aiProvider.toUpperCase()})</Label>
                        <Input
                            id="aiApiKey"
                            value={aiApiKey}
                            onChange={(e) => setAiApiKey(e.target.value)}
                            placeholder="Sua chave de API"
                            disabled={isFormDisabled}
                        />
                    </div>
                </div>
                <Alert className="bg-blue-50 border-blue-500/50 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-200 p-4">
                    <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="font-bold">Atenção: Chave de API</AlertTitle>
                    <AlertDescription>
                        A chave de API será usada em uma Edge Function segura para gerar o resumo.
                        Você deve configurar a chave como um secret no Supabase com o nome `AI_API_KEY`.
                    </AlertDescription>
                </Alert>
                
                <Button 
                    type="button" 
                    onClick={handleRunTest} 
                    className="bg-green-600 hover:bg-green-700 w-full"
                    disabled={isFormDisabled || isTesting || !aiEnabled || !aiApiKey.trim()}
                >
                    {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    {isTesting ? 'Testando e Enviando...' : 'Testar Resumo Diário (Envia para Telegram)'}
                </Button>
            </div>
            
            <Separator className="my-8" />
            
            {/* Seção 5: Notificações de WhatsApp (Evolution API) */}
            <div className="space-y-6">
                <CardTitle className="text-xl flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-dyad-500" />
                    <span>Notificações de WhatsApp (Evolution API)</span>
                </CardTitle>
                
                {/* Configuração para Clientes (Aprovação) */}
                <Card className="p-4 border-l-4 border-blue-500/50">
                    <CardTitle className="text-lg flex items-center space-x-2 mb-3">
                        <MessageSquare className="h-4 w-4" />
                        <span>Clientes (Aprovação de Posts)</span>
                    </CardTitle>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 mb-4">
                        <Label htmlFor="clientWaEnabled" className="font-medium">Ativar Notificações de Clientes</Label>
                        <Switch
                            id="clientWaEnabled"
                            checked={clientWaEnabled}
                            onCheckedChange={setClientWaEnabled}
                            disabled={isFormDisabled}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="clientWaInstanceUrl">URL da Instância</Label>
                            <Input
                                id="clientWaInstanceUrl"
                                value={clientWaInstanceUrl}
                                onChange={(e) => setClientWaInstanceUrl(e.target.value)}
                                placeholder="Ex: https://api.evolution.com/instance/id"
                                disabled={isFormDisabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="clientWaApiKey">API Key</Label>
                            <Input
                                id="clientWaApiKey"
                                value={clientWaApiKey}
                                onChange={(e) => setClientWaApiKey(e.target.value)}
                                placeholder="Sua chave de API"
                                disabled={isFormDisabled}
                            />
                        </div>
                    </div>
                </Card>
                
                {/* Configuração para CRM (Leads) */}
                <Card className="p-4 border-l-4 border-green-500/50">
                    <CardTitle className="text-lg flex items-center space-x-2 mb-3">
                        <Zap className="h-4 w-4" />
                        <span>CRM (Leads e Ações Internas)</span>
                    </CardTitle>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 mb-4">
                        <Label htmlFor="crmWaEnabled" className="font-medium">Ativar Notificações de CRM</Label>
                        <Switch
                            id="crmWaEnabled"
                            checked={crmWaEnabled}
                            onCheckedChange={setCrmWaEnabled}
                            disabled={isFormDisabled}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="crmWaInstanceUrl">URL da Instância</Label>
                            <Input
                                id="crmWaInstanceUrl"
                                value={crmWaInstanceUrl}
                                onChange={(e) => setCrmWaInstanceUrl(e.target.value)}
                                placeholder="Ex: https://api.evolution.com/instance/id"
                                disabled={isFormDisabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="crmWaApiKey">API Key</Label>
                            <Input
                                id="crmWaApiKey"
                                value={crmWaApiKey}
                                onChange={(e) => setCrmWaApiKey(e.target.value)}
                                placeholder="Sua chave de API"
                                disabled={isFormDisabled}
                            />
                        </div>
                    </div>
                </Card>
            </div>
            
            <Separator className="my-8" />

            {/* Seção 2: Notificações de Clientes (Telegram) */}
            <div className="space-y-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-dyad-500" />
                    <span>Notificações de Clientes (Telegram)</span>
                </CardTitle>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <Label htmlFor="clientEnabled" className="font-medium">Ativar Notificações de Clientes</Label>
                    <Switch
                        id="clientEnabled"
                        checked={clientEnabled}
                        onCheckedChange={setClientEnabled}
                        disabled={isFormDisabled}
                    />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="clientToken">Telegram Bot Token</Label>
                        <Input
                            id="clientToken"
                            value={clientToken}
                            onChange={(e) => setClientToken(e.target.value)}
                            placeholder="Ex: 123456:ABC-DEF123456"
                            disabled={isFormDisabled}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clientChatId">Chat ID</Label>
                        <Input
                            id="clientChatId"
                            value={clientChatId}
                            onChange={(e) => setClientChatId(e.target.value)}
                            placeholder="Ex: -1001234567890"
                            disabled={isFormDisabled}
                        />
                    </div>
                </div>
            </div>
            
            <Separator className="my-8" />

            {/* Seção 3: Notificações de Tarefas */}
            <div className="space-y-4">
                <CardTitle className="text-xl flex items-center space-x-2">
                    <ListTodo className="h-5 w-5 text-dyad-500" />
                    <span>Notificações de Tarefas (Telegram)</span>
                </CardTitle>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <Label htmlFor="taskEnabled" className="font-medium">Ativar Notificações de Tarefas</Label>
                    <Switch
                        id="taskEnabled"
                        checked={taskEnabled}
                        onCheckedChange={setTaskEnabled}
                        disabled={isFormDisabled}
                    />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="taskToken">Telegram Bot Token</Label>
                        <Input
                            id="taskToken"
                            value={taskToken}
                            onChange={(e) => setTaskToken(e.target.value)}
                            placeholder="Ex: 123456:ABC-DEF123456"
                            disabled={isFormDisabled}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="taskChatId">Chat ID</Label>
                        <Input
                            id="taskChatId"
                            value={taskChatId}
                            onChange={(e) => setTaskChatId(e.target.value)}
                            placeholder="Ex: -1001234567890"
                            disabled={isFormDisabled}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isFormDisabled}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Configurações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettingsPage;