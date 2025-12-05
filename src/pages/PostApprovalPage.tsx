import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientStore } from '@/hooks/use-client-store';
import { Post, KanbanColumnId } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Calendar, Loader2, ZoomIn, AlertTriangle } from 'lucide-react';
import { formatDate, isTaskOverdue } from '@/utils/date';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ImageLightbox'; // Importando Lightbox
import { differenceInDays } from 'date-fns';
import { useAppSettings } from '@/hooks/use-app-settings'; // Importando useAppSettings
import { useTheme } from 'next-themes'; // Importando useTheme
import { ClientAvatar } from '@/components/ClientAvatar'; // Importando ClientAvatar

const MAX_DAYS_VALIDITY = 7; // Validade do link: 7 dias após o vencimento

const PostApprovalPage: React.FC = () => {
  const { clientId, postId } = useParams<{ clientId: string; postId: string }>();
  const { getClientById, updatePost, isUpdating } = useClientStore();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const client = getClientById(clientId || '');
  const [post, setPost] = useState<Post | undefined>(undefined);
  const [clientName, setClientName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // Estado do Lightbox

  useEffect(() => {
    if (clientId && postId) {
      const client = getClientById(clientId);
      
      // CORREÇÃO: Busca o post onde o approvalLink termina com o postId (UUID único)
      const fetchedPost = client?.posts.find(p => p.approvalLink.endsWith(`/${postId}`));
      
      if (client && fetchedPost) {
        setClientName(client.name);
        setPost(fetchedPost);
      } else {
        // Se não encontrar, garante que o estado de carregamento termine
        showError('Post ou Cliente não encontrado.');
      }
    }
    setIsLoading(false);
  }, [clientId, postId, getClientById]);

  const isLinkExpired = post && differenceInDays(new Date(), post.dueDate) > MAX_DAYS_VALIDITY;
  
  const handleApproval = async (approved: boolean) => {
    if (!post || isSubmitting || isLinkExpired) return;

    setIsSubmitting(true);
    
    // 'Aprovado' ou 'Edição' (Rejeitar)
    const newStatus: KanbanColumnId = approved ? 'Aprovado' : 'Edição';
    const action = approved ? 'aprovado' : 'edição solicitada';

    try {
      const updatedPost: Post = {
        ...post,
        status: newStatus,
      };
      
      // AGUARDA a conclusão da atualização do post
      await updatePost({ clientId: clientId!, updatedPost }); // Usando a mutação do store
      
      // Redireciona para a tela de confirmação
      navigate('/approval/confirmation', { state: { action: action, title: post.title } });

    } catch (error) {
      showError(`Erro ao processar a aprovação: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (!post || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Erro 404</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">O link de aprovação é inválido ou o post foi excluído.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isPendingApproval = post.status === 'Aprovação';
  const isFinalized = post.status === 'Aprovado' || post.status === 'Publicado';
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const clientLogoUrl = client.logoUrl; // Logo do cliente

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      <Card className="w-full max-w-3xl shadow-xl">
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
            Bem-vindo(a), {clientName}!
          </h1>
          <p className="text-lg text-muted-foreground">Portal de Aprovação</p>
          <p className="text-sm text-muted-foreground mt-1">
            Seu post está pronto para revisão.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Alerta de Link Expirado */}
          {isLinkExpired && (
            <div className="text-center p-4 rounded-lg bg-red-100 text-red-700 font-semibold">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              Este link expirou. O post venceu há mais de {MAX_DAYS_VALIDITY} dias.
            </div>
          )}
          
          {/* Imagem 1080x1350 (Aspecto 4/5) - Adicionando shadow-md e shadow-gray-400/50 */}
          <div 
            className={cn(
                "relative w-full aspect-[4/5] overflow-hidden rounded-lg border bg-muted mx-auto max-w-sm cursor-zoom-in",
                "shadow-md shadow-gray-400/50 dark:shadow-gray-900/50"
            )}
            onClick={() => setIsLightboxOpen(true)}
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

          <h2 className="text-2xl font-semibold text-center">{post.title}</h2>
          <p className="text-muted-foreground text-center whitespace-pre-wrap">{post.description}</p>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Vencimento:</span>
              <span>{formatDate(post.dueDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Status Atual:</span>
              <span className={cn(
                "font-semibold",
                isPendingApproval ? "text-yellow-600" : isFinalized ? "text-green-600" : "text-gray-600"
              )}>
                {post.status}
              </span>
            </div>
          </div>

          {post.subtasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Checklist de Subtarefas:</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {post.subtasks.map((task, index) => (
                  <li key={index}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {isPendingApproval && !isLinkExpired ? (
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
              <Button 
                onClick={() => handleApproval(true)} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprovar
              </Button>
              <Button 
                onClick={() => handleApproval(false)} 
                variant="outline" // Alterado para outline
                // Corrigindo a cor do botão de edição para ser mais neutra/escura
                className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-950 text-white px-6 w-full sm:w-auto" 
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Pedir Edição
              </Button>
            </div>
          ) : (
            <div className={cn(
              "text-center p-4 rounded-lg font-semibold",
              isLinkExpired ? "bg-red-100 text-red-700" : post.status === 'Aprovado' || post.status === 'Publicado' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {isLinkExpired ? "Ação indisponível: O prazo de aprovação expirou." : `Este post já foi ${post.status.toLowerCase()}. Nenhuma ação adicional é necessária.`}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lightbox */}
      {post.imageUrl && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          imageUrl={post.imageUrl}
          title={post.title}
        />
      )}
    </div>
  );
};

export default PostApprovalPage;