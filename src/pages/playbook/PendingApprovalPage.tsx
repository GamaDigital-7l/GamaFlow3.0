import React, { useState, useMemo } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, FileText, ZoomIn, AlertTriangle, Edit } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ImageLightbox';
import { differenceInDays } from 'date-fns';
import { RequestEditDialog } from '@/components/playbook/RequestEditDialog';
import { useClientStore } from '@/hooks/use-client-store';

interface PendingApprovalPageProps {
  clientId: string;
}

const MAX_DAYS_VALIDITY = 7; // Validade do link: 7 dias após o vencimento

// Helper function to ensure date is a Date object
const ensureDate = (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date);
};

const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({ clientId }) => {
  const { getClientById, updatePost, isMutating } = useClientStore(); 
  const client = getClientById(clientId);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

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
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [client]);
  
  const activePendingPosts = pendingPosts.filter(p => !p.isExpired);
  const expiredPosts = pendingPosts.filter(p => p.isExpired);

  // Função para lidar com a aprovação
  const handleApprove = async (post: Post) => {
    if (isMutating) return;

    try {
      const updatedPost: Post = {
        ...post,
        status: 'Aprovado' as KanbanColumnId,
      };
      
      await updatePost({ clientId, updatedPost }); 
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
        
        await updatePost({ clientId, updatedPost });
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

  if (!client) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center space-x-2">
        <AlertTriangle className="h-6 w-6 text-dyad-500" />
        <span>Material para Aprovação ({activePendingPosts.length})</span>
      </h2>
      <p className="text-muted-foreground">
        Revise os posts que estão aguardando sua aprovação.
      </p>
      
      {/* Lista de Posts Pendentes */}
      {activePendingPosts.length === 0 && expiredPosts.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border rounded-lg">
          <FileText className="h-10 w-10 mx-auto mb-4 text-dyad-500" />
          <p className="text-xl font-semibold">Nenhum post pendente de aprovação no momento.</p>
        </div>
      ) : (
        activePendingPosts.map((post, index) => (
          <React.Fragment key={post.id}>
            <Card className="p-6 shadow-lg space-y-4 bg-card">
              
              {/* Imagem (Topo) */}
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
                
                <Separator className="max-w-sm mx-auto" />
                
                {/* Ações Individuais */}
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                  <Button 
                    onClick={() => handleApprove(post)} 
                    className="bg-green-600 hover:bg-green-700 text-white px-6 w-full sm:w-auto h-10"
                    disabled={isMutating}
                  >
                    {isMutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />} Aprovar
                  </Button>
                  <Button 
                    onClick={() => handleRequestEdit(post)} 
                    variant="outline"
                    className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-950 text-white px-6 w-full sm:w-auto h-10"
                    disabled={isMutating}
                  >
                    {isMutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />} Solicitar Edição
                  </Button>
                </div>
              </div>
            </Card>
            {index < activePendingPosts.length - 1 && <Separator className="my-6 bg-border/50" />}
          </React.Fragment>
        ))
      )}
      
      {/* Posts Expirados */}
      {expiredPosts.length > 0 && (
        <div className="p-4 rounded-lg bg-red-100 text-red-700 font-semibold space-y-2 dark:bg-red-950 dark:text-red-300 border border-red-500/50">
          <h3 className="text-lg font-bold">Links Expirados ({expiredPosts.length})</h3>
          <p className="text-sm">Os posts abaixo venceram há mais de {MAX_DAYS_VALIDITY} dias e não podem mais ser aprovados. Entre em contato com a equipe Gama Creative.</p>
        </div>
      )}
      
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
        isSubmitting={isMutating}
      />
    </div>
  );
};

export default PendingApprovalPage;