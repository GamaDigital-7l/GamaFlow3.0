import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useClientStore } from '@/hooks/use-client-store';
import { Post, KanbanColumnId } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, FileText, ZoomIn, AlertTriangle, Repeat, Calendar, Edit } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ImageLightbox';
import { differenceInDays } from 'date-fns';
import { RequestEditDialog } from '@/components/playbook/RequestEditDialog';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';
import { FeedbackDialog } from '@/components/FeedbackDialog'; 
import { ClientAvatar } from '@/components/ClientAvatar';
import { usePublicClientData } from '@/hooks/use-public-client-data'; // NOVO HOOK

const MAX_DAYS_VALIDITY = 7; // Validade do link: 7 dias após o vencimento

// Helper function to ensure date is a Date object
const ensureDate = (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
};

const ClientApprovalListPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Usamos usePublicClientData para carregar o cliente sem autenticação
  const { client, isLoading: isLoadingPublicData, error: publicDataError } = usePublicClientData(clientId || '');
  
  // Usamos useClientStore apenas para as mutações (updatePost)
  const { updatePost, isUpdating } = useClientStore(); 
  
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null);
  
  // Estados para o modal de edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  
  // Estado para o modal de feedback
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  // Verifica se o parâmetro de feedback está no URL
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const shouldRequestFeedback = urlParams.get('feedback') === 'true';

  const pendingPosts = useMemo(() => {
    if (!client) return [];
    
    return client.posts
      .filter(p => p.status === 'Aprovação')
      .map(p => {
        const dueDate = ensureDate(p.dueDate);
        return {
          ...p,
          dueDate, // Garante que dueDate é um Date object
          isExpired: differenceInDays(new Date(), dueDate) > MAX_DAYS_VALIDITY,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()); // Mais antigos primeiro
  }, [client]);
  
  const activePendingPosts = pendingPosts.filter(p => !p.isExpired);
  const expiredPosts = pendingPosts.filter(p => p.isExpired);
  
  // Efeito para verificar se todos os posts foram resolvidos
  useEffect(() => {
    // Se não houver posts ativos e o feedback for solicitado, abre o modal
    if (activePendingPosts.length === 0 && shouldRequestFeedback && clientId) {
        // Pequeno delay para garantir que a UI se atualize
        setTimeout(() => {
            setIsFeedbackDialogOpen(true);
        }, 500);
    }
  }, [activePendingPosts.length, shouldRequestFeedback, clientId]);


  // Função para lidar com a aprovação (permanece na página)
  const handleApprove = async (post: Post) => {
    if (isUpdating) return;

    try {
      const updatedPost: Post = {
        ...post,
        status: 'Aprovado' as KanbanColumnId,
      };
      
      // A mutação do useClientStore é usada aqui
      await updatePost({ clientId: clientId!, updatedPost }); 
      showSuccess(`Post "${post.title}" aprovado com sucesso!`);
      
    } catch (error) {
      showError(`Erro ao processar a aprovação: ${error.message}`);
    }
  };
  
  // Abre o modal de edição
  const handleRequestEdit = (post: Post) => {
    setPostToEdit(post);
    setIsEditDialogOpen(true);
  };
  
  // Submete o feedback de edição
  const handleSubmitEditFeedback = async (postId: string, feedback: string) => {
    const post = pendingPosts.find(p => p.id === postId);
    if (!post) return;
    
    const updatedDescription = `[EDIÇÃO SOLICITADA - ${formatDate(new Date())}]\n${feedback}\n\n--- Descrição Original ---\n${post.description}`;

    try {
        const updatedPost: Post = {
            ...post,
            status: 'Edição' as KanbanColumnId, // Move para a coluna Edição
            description: updatedDescription,
        };
        
        // A mutação do useClientStore é usada aqui
        await updatePost({ clientId: clientId!, updatedPost }); 
        showSuccess(`Solicitação de edição para "${post.title}" enviada!`);
        setIsEditDialogOpen(false);
        setPostToEdit(null);
        
    } catch (error) {
        showError(`Erro ao enviar feedback: ${error.message}`);
    }
  };
  
  const handleImageClick = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setIsLightboxOpen(true);
  };
  
  const handleFeedbackSent = () => {
    // Após o feedback ser enviado, remove o parâmetro 'feedback' do URL para evitar que o modal abra novamente
    const newUrl = location.pathname;
    navigate(newUrl, { replace: true });
  };


  if (isLoadingPublicData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (publicDataError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Erro de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Cliente não encontrado ou ID inválido.</p>
            {publicDataError && <p className="text-xs text-red-400 mt-2">Detalhe: {publicDataError.message}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const clientLogoUrl = client.logoUrl; // Logo do cliente

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      {/* Ajustando a largura do Card principal */}
      <Card className="w-[98%] max-w-[1600px] shadow-xl">
        <CardHeader className="text-center">
          {/* Logo da Gama no topo */}
          <div className="flex justify-center mb-4">
            {logoUrl && logoUrl !== '/placeholder.svg' ? (
              <img 
                src={logoUrl} 
                alt="Gama Creative Logo" 
                className="h-10 object-contain mx-auto" 
              />
            ) : (
              <h1 className="text-2xl font-bold text-dyad-500">Gama Creative</h1>
            )}
          </div>
          
          {/* Avatar do Cliente */}
          <div className="flex justify-center mb-4">
            <ClientAvatar 
                name={client.name} 
                logoUrl={clientLogoUrl} 
                className="w-16 h-16 flex-shrink-0" 
            />
          </div>
          
          <h1 className="text-3xl font-bold text-dyad-500 mb-2">
            Aprovação de Posts
          </h1>
          <p className="text-lg text-muted-foreground">
            Olá, {client.name}! Revise e aprove os posts pendentes.
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Lista de Posts Pendentes */}
          {activePendingPosts.length === 0 && expiredPosts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-4 text-dyad-500" />
              <p className="text-xl font-semibold">Nenhum post pendente de aprovação no momento.</p>
              <p className="text-sm mt-2">Volte mais tarde ou entre em contato com a equipe Gama Creative.</p>
            </div>
          ) : (
            activePendingPosts.map((post, index) => (
              <React.Fragment key={post.id}>
                <div className="p-6 border rounded-xl shadow-lg space-y-4 bg-card">
                  
                  {/* Imagem (Topo) - Adicionando shadow-md e shadow-gray-400/50 */}
                  <div 
                    className={cn(
                      "relative w-full aspect-[4/5] overflow-hidden rounded-lg border bg-muted mx-auto max-w-sm cursor-zoom-in",
                      "shadow-md shadow-gray-400/50 dark:shadow-gray-900/50"
                    )}
                    onClick={() => handleImageClick(post.imageUrl || '/placeholder.svg', post.title)}
                  >
                    <img 
                      src={post.imageUrl || '/placeholder.svg'} 
                      alt={post.title} 
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute bottom-2 right-2 p-1 bg-black/50 rounded-full text-white">
                        <ZoomIn className="h-4 w-4" />
                    </div>
                  </div>
                  
                  {/* Detalhes e Ações */}
                  <div className="space-y-4 text-center max-w-md mx-auto">
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    
                    {post.description && (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap text-left border-t pt-3">
                          <h3 className="font-semibold mb-1">Descrição / Legenda:</h3>
                          <p>{post.description}</p>
                      </div>
                    )}
                    
                    {post.subtasks.length > 0 && (
                      <div className="space-y-1 pt-2 text-left">
                        <h3 className="text-sm font-semibold">Checklist:</h3>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {post.subtasks.map((task, index) => (
                            <li key={index}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Separator className="max-w-sm mx-auto" />
                    
                    {/* Ações Individuais (Embaixo) */}
                    <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                      <Button 
                        onClick={() => handleApprove(post)} 
                        className="bg-green-600 hover:bg-green-700 text-white px-6 w-full sm:w-auto h-10"
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} Aprovar
                      </Button>
                      <Button 
                        onClick={() => handleRequestEdit(post)} 
                        variant="outline"
                        // Corrigindo a cor do botão de edição para ser mais neutra/escura
                        className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-950 text-white px-6 w-full sm:w-auto h-10"
                        disabled={isUpdating}
                      >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />} Solicitar Edição
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Separador mais sutil entre posts */}
                {index < activePendingPosts.length - 1 && <Separator className="my-6 bg-border/50" />}
              </React.Fragment>
            ))
          )}
          
          {/* Posts Expirados */}
          {expiredPosts.length > 0 && (
            <div className="p-4 rounded-lg bg-red-100 text-red-700 font-semibold space-y-2 dark:bg-red-950 dark:text-red-300 border border-red-500/50">
              <h3 className="text-lg font-bold">Links Expirados ({expiredPosts.length})</h3>
              <p className="text-sm">Os posts abaixo venceram há mais de {MAX_DAYS_VALIDITY} dias e não podem mais ser aprovados por este portal. Entre em contato com a equipe Gama Creative.</p>
              <ul className="list-disc list-inside text-sm">
                {expiredPosts.map(post => (
                    <li key={post.id}>{post.title} (Vencimento: {formatDate(post.dueDate)})</li>
                ))}
              </ul>
            </div>
          )}
          
        </CardContent>
      </Card>
      
      {selectedImage && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
        />
      )}
      
      {/* Modal de Solicitação de Edição */}
      <RequestEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={postToEdit}
        onSubmit={handleSubmitEditFeedback}
        isSubmitting={isUpdating}
      />
      
      {/* Modal de Feedback */}
      {clientId && (
        <FeedbackDialog
          isOpen={isFeedbackDialogOpen}
          onOpenChange={setIsFeedbackDialogOpen}
          clientId={clientId}
          onFeedbackSent={handleFeedbackSent}
        />
      )}
    </div>
  );
};

export default ClientApprovalListPage;