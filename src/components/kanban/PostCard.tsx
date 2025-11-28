import React, { useState } from 'react';
import { Post } from '@/types/client';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Edit, CheckCircle, XCircle, Repeat } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from '@/components/ImageLightbox';

interface PostCardProps {
  post: Post;
  index: number;
  onEdit: () => void;
  // Adicionando handlers para ações rápidas (simuladas)
  onApprove?: (post: Post) => void;
  onReject?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, index, onEdit, onApprove, onReject }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Verifica se há uma URL de imagem válida
  const hasImage = post.imageUrl && post.imageUrl.trim() !== '' && post.imageUrl.trim() !== '/placeholder.svg';

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique abra o modal de edição
    if (hasImage) {
        setIsLightboxOpen(true);
    }
  };

  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) onApprove(post);
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) onReject(post);
  };

  const isApprovalPending = post.status === 'Aprovação';

  return (
    <>
      <Draggable draggableId={post.id} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "mb-3 shadow-md transition-shadow duration-200 cursor-pointer border border-border",
              snapshot.isDragging ? "shadow-xl border-dyad-500 border-2" : "hover:shadow-lg"
            )}
            onClick={onEdit}
          >
            {/* Imagem de Capa (1080x1350 ajustada) - Usando aspect-[4/5] para manter a proporção */}
            <div 
              className={cn(
                "relative w-full aspect-[4/5] overflow-hidden rounded-t-lg bg-muted",
                hasImage ? "cursor-zoom-in shadow-md shadow-gray-400/50 dark:shadow-gray-900/50" : "flex items-center justify-center text-muted-foreground"
              )}
              onClick={handleImageClick}
            >
              {hasImage ? (
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback se a imagem falhar
                    e.currentTarget.src = '/placeholder.svg';
                    e.currentTarget.className = "w-1/3 h-1/3 object-contain opacity-50";
                  }}
                />
              ) : (
                <div className="text-center p-4">
                    <Edit className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Sem Imagem</span>
                </div>
              )}
              {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>}
            </div>

            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-base font-semibold line-clamp-2">
                {post.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(post.dueDate)}</span>
                </div>
                <div className="flex space-x-2">
                  {/* Ícone de status rápido */}
                  {post.status === 'Edição' && <Repeat className="h-3 w-3 text-red-500" />}
                  {post.status === 'Aprovado' && <CheckCircle className="h-3 w-3 text-green-500" />}
                  {post.status === 'Publicado' && <CheckCircle className="h-3 w-3 text-blue-500" />}
                  <Edit className="h-3 w-3 text-dyad-500" />
                </div>
              </div>
              
              {/* Botões de Ação Rápida (Aprovação) */}
              {isApprovalPending && (
                <div className="flex justify-between pt-2 border-t mt-2 space-x-2">
                  {/* Botão Aprovar: Fundo Claro, Texto Escuro */}
                  <Button 
                    size="sm" 
                    className="h-8 px-3 flex-1 bg-background text-foreground border border-input hover:bg-muted/80 text-xs shadow-sm"
                    onClick={handleApproveClick}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                  </Button>
                  {/* Botão Editar: Fundo Escuro, Texto Claro */}
                  <Button 
                    size="sm" 
                    className="h-8 px-3 flex-1 bg-foreground text-background hover:bg-foreground/90 text-xs shadow-sm"
                    onClick={handleRejectClick}
                  >
                    <XCircle className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>
      
      {hasImage && (
        <ImageLightbox
          isOpen={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          imageUrl={post.imageUrl}
          title={post.title}
        />
      )}
    </>
  );
};