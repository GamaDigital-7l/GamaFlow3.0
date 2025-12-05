import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Loader2, Link as LinkIcon, Copy, MessageSquare, ClipboardList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { showSuccess, showError } from '@/utils/toast';
import { usePlaybookContent } from '@/hooks/use-playbook-content';
import { OnboardingBlockEditor } from '@/components/onboarding/OnboardingBlockEditor';
import { OnboardingBlock, PlaybookFile, BriefingResponseEntry, OnboardingBlockType } from '@/types/playbook';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientStore } from '@/hooks/use-client-store';
import { OnboardingBlockRenderer } from '@/components/onboarding/OnboardingBlockRenderer'; // Reutilizando o renderer de briefing
import { Input } from '@/components/ui/input'; // Importando Input
import { withRole } from '@/components/withRole';

interface OnboardingConfigPageProps {
  clientId: string;
}

// Templates Mockados (Carregados do localStorage da página de templates)
const TEMPLATES_STORAGE_KEY = 'gama_onboarding_templates';

const loadTemplates = () => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    try {
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Erro ao carregar templates de onboarding:", e);
        return [];
    }
};

// Conteúdo padrão para o Onboarding (Template Social Media + Tráfego)
const defaultOnboardingBlocks: OnboardingBlock[] = [
    { id: 'b1', type: OnboardingBlockType.Title, data: { title: 'Bem-vindo(a) à Gama Creative!' } },
    { id: 'b2', type: OnboardingBlockType.Text, data: { content: 'Este é o seu checklist de onboarding. Siga as etapas abaixo para garantir que tenhamos tudo para iniciar o trabalho.' } },
    { id: 'b3', type: OnboardingBlockType.BriefingForm, data: { 
        formTitle: 'Briefing Inicial', 
        formDescription: 'Por favor, preencha este formulário para nos dar uma visão geral do seu negócio e objetivos.',
        questions: [
            { id: 'q1', type: 'text', label: 'Nome da Empresa', required: true, placeholder: 'Sua Empresa Ltda.' },
            { id: 'q2', type: 'textarea', label: 'Descreva seu negócio e público-alvo', required: true, placeholder: 'Somos uma empresa de...' },
        ]
    }},
    { id: 'b4', type: OnboardingBlockType.FileUpload, data: { 
        title: 'Envio de Logos e Materiais', 
        description: 'Por favor, faça o upload da sua logo e outros materiais de marca.',
        allowedFileTypes: ['image/*', 'application/pdf'],
        maxFiles: 5,
    }},
];


const OnboardingConfigPage: React.FC<OnboardingConfigPageProps> = ({ clientId }) => {
  const SECTION_NAME = 'onboarding';
  const { content, isLoading, saveContent, isSaving } = usePlaybookContent(clientId, SECTION_NAME);
  const { getClientById } = useClientStore();
  const client = getClientById(clientId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Carrega os templates do localStorage (simulação)
  const templates = useMemo(() => loadTemplates(), []);

  const initialBlocks: OnboardingBlock[] = useMemo(() => {
    // Se houver conteúdo salvo, usa-o. Caso contrário, usa um array vazio para forçar a escolha de template.
    return Array.isArray(content?.content?.blocks) && content.content.blocks.length > 0
      ? content.content.blocks
      : [];
  }, [content]);
  
  // Garante que uploadedFiles e briefingResponses sejam arrays vazios se não existirem
  const uploadedFiles: PlaybookFile[] = content?.content?.uploadedFiles || [];
  const briefingResponses: BriefingResponseEntry[] = content?.briefing_responses || [];

  const handleSave = (newBlocks: OnboardingBlock[]) => {
    // Salva o array de blocos E a lista de arquivos (se houver)
    const contentToSave = { 
        blocks: newBlocks, 
        uploadedFiles: uploadedFiles 
    };
    saveContent(SECTION_NAME, contentToSave, briefingResponses);
    setIsEditing(false);
  };
  
  const handleApplyTemplate = () => {
    const template = templates.find((t: any) => t.id === selectedTemplateId);
    if (template) {
        // Salva o conteúdo do template diretamente no cliente
        // Nota: Não sobrescreve uploadedFiles e briefingResponses se houver
        saveContent(SECTION_NAME, { 
            blocks: template.blocks,
            uploadedFiles: uploadedFiles
        }, briefingResponses);
        showSuccess(`Template '${template.name}' aplicado ao cliente ${client?.name}.`);
        setSelectedTemplateId('');
    } else {
        showError('Selecione um template válido.');
    }
  };
  
  const handleCopyLink = () => {
    const origin = window.location.origin;
    const link = `${origin}/onboarding/${clientId}`;
    navigator.clipboard.writeText(link);
    showSuccess('Link de Onboarding copiado!');
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" /></div>;
  }
  
  if (!client) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center space-x-2">
        <ClipboardList className="h-6 w-6 text-dyad-500" />
        <span>Configuração de Onboarding</span>
      </h2>
      <p className="text-muted-foreground">Gerencie o checklist de Onboarding para o cliente <span className="font-semibold">{client.name}</span>.</p>

      {/* Seção de Link Público */}
      <Card className="p-4 border-l-4 border-dyad-500/50">
        <CardTitle className="text-lg mb-2">Link Público de Onboarding</CardTitle>
        <div className="flex items-center space-x-2">
            <Input 
                value={`${window.location.origin}/onboarding/${clientId}`} 
                readOnly 
                className="flex-grow bg-muted"
            />
            <Button onClick={handleCopyLink} size="icon" className="bg-dyad-500 hover:bg-dyad-600">
                <Copy className="h-4 w-4" />
            </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Compartilhe este link com o cliente para iniciar o processo de Onboarding.</p>
      </Card>

      <Separator />

      {/* Seção de Edição / Aplicação de Template */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">
                {initialBlocks.length > 0 ? 'Conteúdo Personalizado' : 'Aplicar Template'}
            </CardTitle>
            {initialBlocks.length > 0 && (
                <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className="bg-dyad-500 hover:bg-dyad-600"
                    disabled={isSaving}
                >
                    <Edit className="h-4 w-4 mr-2" /> {isEditing ? 'Sair do Editor' : 'Editar Conteúdo'}
                </Button>
            )}
        </CardHeader>
        <CardContent>
            {isEditing ? (
                <OnboardingBlockEditor
                    initialBlocks={initialBlocks}
                    onSubmit={handleSave}
                    onCancel={() => setIsEditing(false)}
                    isSaving={isSaving}
                />
            ) : initialBlocks.length > 0 ? (
                <div className="border p-4 rounded-lg max-h-96 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Preview:</h4>
                    {/* Passando clientId para o renderer para que o upload funcione no preview do admin */}
                    <OnboardingBlockRenderer 
                      blocks={initialBlocks} 
                      clientId={clientId} 
                      existingUploadedFiles={uploadedFiles}
                      existingBriefingResponses={briefingResponses}
                    /> 
                </div>
            ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Este cliente ainda não possui um Onboarding personalizado. Escolha um template para começar:</p>
                    <div className="flex space-x-2">
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Selecione um Template" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Adicionando um template padrão hardcoded para demonstração */}
                                <SelectItem value="default-social-media">Social Media & Tráfego (Padrão)</SelectItem>
                                {templates.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={() => {
                              if (selectedTemplateId === 'default-social-media') {
                                saveContent(SECTION_NAME, { blocks: defaultOnboardingBlocks, uploadedFiles: uploadedFiles }, briefingResponses);
                                showSuccess(`Template 'Social Media & Tráfego' aplicado ao cliente ${client?.name}.`);
                                setSelectedTemplateId('');
                              } else {
                                handleApplyTemplate();
                              }
                            }} 
                            disabled={!selectedTemplateId || isSaving}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Aplicar Template
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withRole(OnboardingConfigPage, 'admin');