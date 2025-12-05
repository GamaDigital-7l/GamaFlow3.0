import React from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, XCircle, Edit, ZoomIn } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PostCardProps {
  post: Post;
  index: number;
  onEdit: () => void;
  onApprove?: (post: Post) => void;
  onReject?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, index, onEdit, onApprove, onReject }) => {
  if (!post || !post.id) {
    return (
      <Card className="mb-3 shadow-md transition-shadow duration-200 cursor-pointer border border-border p-3">
        <CardContent className="text-center text-muted-foreground">
          Post inválido.
        </CardContent>
      </Card>
    );
  }

  const isApproval = post.status === 'Aprovação';
  const isEditing = post.status === 'Edição';
  const hasImage = post.imageUrl && post.imageUrl !== '/placeholder.svg';

  const statusColor = (() => {
    switch (post.status) {
      case 'Produção': return 'bg-blue-500';
      case 'Aprovação': return 'bg-yellow-500';
      case 'Edição': return 'bg-red-500';
      case 'Aprovado': return 'bg-green-600';
      case 'Publicado': return 'bg-purple-500';
      case 'Material Off': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  })();

  return (
    <Draggable draggableId={post.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 shadow-md transition-shadow duration-200 cursor-pointer border border-border",
            snapshot.isDragging ? "shadow-xl border-dyad-500 border-2" : "hover:shadow-lg",
            isEditing && "border-red-500/50 bg-red-50/10 dark:bg-red-950/10"
          )}
          onClick={onEdit}
        >
          
          {/* Miniatura da Imagem (Aspecto 4/5) */}
          {hasImage && (
            <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                <ZoomIn className="h-6 w-6 text-white" />
              </div>
            </div>
          )}

          <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between">
            <CardTitle className="text-base font-semibold line-clamp-2 pr-2">
              {post.title}
            </CardTitle>
            <Badge className={cn("text-white text-xs flex-shrink-0", statusColor)}>
              {post.status}
            </Badge>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-2">
            
            {/* Data de Vencimento */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  Vencimento: {formatDate(post.dueDate)}
                </span>
              </div>
            </div>
            
            {/* Ações Rápidas para Aprovação */}
            {isApproval && onApprove && onReject && (
                <div className="flex space-x-2 pt-2 border-t mt-2">
                    <Button 
                        size="sm" 
                        className="flex-1 h-7 bg-green-600 hover:bg-green-700"
                        onClick={(e) => { e.stopPropagation(); onApprove(post); }}
                    >
                        <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        // Corrigindo a cor do botão de edição para ser mais neutra/escura
                        className="flex-1 h-7 bg-gray-800 hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-950 text-white"
                        onClick={(e) => { e.stopPropagation(); onReject(post); }}
                    >
                        <XCircle className="h-3 w-3 mr-1" /> Edição
                    </Button>
                </div>
            )}
            
            {/* Botão de Edição (Neutro) */}
            {!isApproval && (
                <div className="flex justify-end pt-2 border-t mt-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        // Estilo neutro: usa a cor de foreground padrão (preto/branco)
                        className="h-6 w-6 text-foreground hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};