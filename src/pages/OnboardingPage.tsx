import React, { useState, useMemo } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Loader2, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { showSuccess, showError } from '@/utils/toast';
import { usePlaybookContent } from '@/hooks/use-playbook-content';
import { OnboardingBlockEditor } from '@/components/onboarding/OnboardingBlockEditor';
import { OnboardingBlockRenderer } from '@/components/onboarding/OnboardingBlockRenderer';
import { OnboardingBlock, PlaybookFile, BriefingResponseEntry, OnboardingBlockType } from '@/types/playbook';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';
import { useParams } from 'react-router-dom'; // Importando useParams
import { supabase } from '@/integrations/supabase/client'; // Para registrar no briefing_responses global

// Conteúdo padrão para o Onboarding (Template Social Media + Tráfego)
const defaultOnboardingBlocks: OnboardingBlock[] = [
    { id: 'b1', type: OnboardingBlockType.Title, data: { title: 'Bem-vindo(a) à Gama Creative!' } },
    { id: 'b2', type: OnboardingBlockType.Text, data: { content: 'Este é o seu checklist de onboarding. Siga as etapas abaixo para garantir que tenhamos todos os acessos e materiais necessários para iniciar o trabalho de Social Media e Tráfego.' } },
    { id: 'b3', type: OnboardingBlockType.BriefingForm, data: { 
        formTitle: 'Briefing Inicial de Social Media', 
        formDescription: 'Por favor, preencha este formulário para nos dar uma visão geral do seu negócio e objetivos.',
        questions: [
            { id: 'q1', type: 'text', label: 'Nome da Empresa', required: true, placeholder: 'Sua Empresa Ltda.' },
            { id: 'q2', type: 'textarea', label: 'Descreva seu negócio e público-alvo', required: true, placeholder: 'Somos uma empresa de...' },
            { id: 'q3', type: 'select', label: 'Qual seu principal objetivo com as redes sociais?', required: true, options: ['Vendas', 'Engajamento', 'Reconhecimento de Marca', 'Outro'] },
            { id: 'q4', type: 'link', label: 'Link para seu Instagram', required: false, placeholder: 'https://instagram.com/suaempresa' },
            { id: 'q5', type: 'date', label: 'Data de Início Desejada', required: false, placeholder: 'Selecione a data' },
        ]
    }},
    { id: 'b4', type: OnboardingBlockType.FileUpload, data: { 
        title: 'Envio de Logos e Manual de Marca', 
        description: 'Por favor, faça o upload da sua logo em vetor (.ai, .eps, .svg) e seu manual de identidade visual (se tiver).',
        allowedFileTypes: ['image/svg+xml', 'application/illustrator', 'application/postscript', 'application/pdf', 'image/png', 'image/jpeg'],
        maxFiles: 5,
    }},
    { id: 'b5', type: OnboardingBlockType.Text, data: { content: 'Em breve entraremos em contato para agendar nossa reunião de kickoff!' } },
];


const OnboardingPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>(); // Obtém o ID da URL
  const SECTION_NAME = 'onboarding';
  
  // Se não houver clientId na URL, não faz a busca
  const validClientId = clientId || ''; 
  
  const { content, isLoading, saveContent, isSaving } = usePlaybookContent(validClientId, SECTION_NAME);
  const { userRole, user } = useSession();
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const isAdmin = userRole === 'admin';
  const [isEditing, setIsEditing] = useState(false);

  const initialBlocks: OnboardingBlock[] = useMemo(() => {
    // Se houver conteúdo salvo, usa-o. Caso contrário, usa o template padrão.
    return Array.isArray(content?.content?.blocks) && content.content.blocks.length > 0
      ? content.content.blocks
      : defaultOnboardingBlocks;
  }, [content]);
  
  // Estado para rastrear uploads feitos pelo cliente (simulando persistência)
  const [uploadedFiles, setUploadedFiles] = useState<PlaybookFile[]>(content?.content?.uploadedFiles || []);
  // Estado para rastrear respostas de briefing
  const [briefingResponses, setBriefingResponses] = useState<BriefingResponseEntry[]>(content?.briefing_responses || []);
  
  // Sincroniza o estado de uploadedFiles e briefingResponses ao carregar o conteúdo
  React.useEffect(() => {
    if (content?.content?.uploadedFiles) {
        setUploadedFiles(content.content.uploadedFiles);
    } else {
        setUploadedFiles([]); // Garante que seja um array vazio se não houver
    }
    if (content?.briefing_responses) {
        setBriefingResponses(content.briefing_responses);
    } else {
        setBriefingResponses([]);
    }
  }, [content]);


  const handleSave = (newBlocks: OnboardingBlock[]) => {
    if (!validClientId) {
        showError('ID do cliente ausente. Não foi possível salvar.');
        return;
    }
    // Salva os blocos, a lista de arquivos e as respostas do briefing
    const contentToSave = { 
        blocks: newBlocks, 
        uploadedFiles: uploadedFiles 
    };
    saveContent(SECTION_NAME, contentToSave, briefingResponses);
    setIsEditing(false);
  };
  
  // Função para lidar com uploads feitos pelo CLIENTE (via BlockRenderer)
  const handleClientUploadComplete = (blockId: string, fileUrl: string, fileName: string, fileType: string) => {
    const newFileEntry: PlaybookFile = {
        id: uuidv4(),
        name: fileName,
        type: fileType,
        url: fileUrl,
        blockId: blockId,
        uploadedBy: 'client',
        uploadedAt: new Date().toISOString(),
    };
    
    const updatedFiles = [...uploadedFiles, newFileEntry];
    setUploadedFiles(updatedFiles);
    
    // Salva a lista atualizada de arquivos no Playbook Content, mantendo os blocos e respostas
    const blocksToSave = initialBlocks;
    saveContent(SECTION_NAME, { blocks: blocksToSave, uploadedFiles: updatedFiles }, briefingResponses);
    
    showSuccess(`Upload do cliente '${fileName}' registrado!`);
  };
  
  // Função para lidar com a submissão de um formulário de briefing pelo cliente
  const handleBriefingFormSubmit = async (blockId: string, responses: { questionId: string; answer: string | string[]; }[]) => {
    const newBriefingResponse: BriefingResponseEntry = {
        blockId,
        responses,
        submittedAt: new Date().toISOString(), // Adiciona timestamp
    };
    
    const updatedBriefingResponses = [...briefingResponses, newBriefingResponse];
    setBriefingResponses(updatedBriefingResponses);
    
    // Salva as respostas atualizadas no Playbook Content, mantendo os blocos e arquivos
    const blocksToSave = initialBlocks;
    await saveContent(SECTION_NAME, { blocks: blocksToSave, uploadedFiles: uploadedFiles }, updatedBriefingResponses);

    // Opcional: Enviar para a tabela global 'briefing_responses' se o bloco for um briefing real
    const briefingBlock = initialBlocks.find(b => b.id === blockId && b.type === OnboardingBlockType.BriefingForm);
    if (briefingBlock && briefingBlock.data.formTitle) {
        try {
            const { error } = await supabase
                .from('briefing_responses')
                .insert({
                    form_id: blockId, // Usamos o ID do bloco como form_id
                    client_id: validClientId,
                    response_data: responses.reduce((acc, r) => ({ ...acc, [r.questionId]: r.answer }), {}),
                    submitted_at: new Date().toISOString(),
                });
            if (error) console.error("Erro ao salvar resposta no briefing_responses global:", error);
            else console.log("Resposta do briefing salva no briefing_responses global.");
        } catch (e) {
            console.error("Erro ao chamar Supabase para briefing_responses global:", e);
        }
    }
  };
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  if (!validClientId) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader><CardTitle className="text-2xl text-red-500">Link Inválido</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">O link de Onboarding deve incluir um ID de cliente válido.</p></CardContent>
            </Card>
        </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
              <img 
                src={finalLogoUrl} 
                alt="Gama Creative Logo" 
                className="h-12 object-contain" 
              />
            ) : (
              <CardTitle className="text-2xl text-center text-dyad-500">Gama Creative</CardTitle>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-dyad-500 mb-2">
            {initialBlocks.find(b => b.type === OnboardingBlockType.Title)?.data.title || 'Checklist de Onboarding'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {initialBlocks.find(b => b.type === OnboardingBlockType.Text)?.data.content || 'Siga as etapas para iniciar a parceria.'}
          </p>
          
          {isAdmin && (
            <div className="flex justify-end pt-4">
                <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    variant="outline"
                    className="text-dyad-500 border-dyad-500 hover:bg-dyad-50"
                    disabled={isSaving}
                >
                    <Edit className="h-4 w-4 mr-2" /> {isEditing ? 'Sair do Modo Edição' : 'Editar Conteúdo'}
                </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-8">
          
          {isEditing && isAdmin ? (
            <OnboardingBlockEditor
                initialBlocks={initialBlocks}
                onSubmit={handleSave}
                onCancel={() => setIsEditing(false)}
                isSaving={isSaving}
            />
          ) : (
            <>
                <OnboardingBlockRenderer 
                    blocks={initialBlocks} 
                    clientId={validClientId} 
                    existingUploadedFiles={uploadedFiles}
                    existingBriefingResponses={briefingResponses}
                    onUploadComplete={handleClientUploadComplete}
                    onBriefingSubmit={handleBriefingFormSubmit} // Passando o novo handler
                />
                
                {/* Exibir lista de arquivos enviados pelo cliente (apenas para referência) */}
                {uploadedFiles.length > 0 && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="text-lg font-semibold mb-2">Arquivos Enviados:</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="flex justify-between items-center">
                                    <span>{file.name}</span>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        Ver Link
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* Exibir respostas de briefing (apenas para referência) */}
                {briefingResponses.length > 0 && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <h3 className="text-lg font-semibold mb-2">Respostas de Briefing:</h3>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            {briefingResponses.map((response, index) => (
                                <li key={index}>
                                    <span className="font-medium">Formulário {response.blockId}:</span> {response.responses.length} perguntas respondidas.
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;