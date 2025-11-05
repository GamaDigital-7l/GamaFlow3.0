import React from 'react';
import { KanbanColumn, Post } from '@/types/client';
import { Droppable } from 'react-beautiful-dnd';
import { PostCard } from './PostCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumn;
  posts: Post[];
  onEditPost: (post: Post) => void;
  onAddPost?: () => void; 
  onApprove: (post: Post) => void; // Nova prop
  onReject: (post: Post) => void;  // Nova prop
}

export const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({ column, posts, onEditPost, onAddPost, onApprove, onReject }) => {
  return (
    <div className="flex flex-col w-72 flex-shrink-0 mx-2 h-full">
      <h3 className="text-lg font-semibold mb-3 p-2 rounded-t-lg bg-secondary/50 border-b border-border flex justify-between items-center">
        {column.title} ({posts.length})
        {/* Botão de Adicionar Card (visível apenas em Produção/Backlog, mas aqui simplificamos para todas) */}
        {onAddPost && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-dyad-500 hover:bg-dyad-100" onClick={onAddPost}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "p-2 rounded-b-lg flex-grow min-h-[100px] transition-colors duration-200",
              snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
            )}
          >
            {posts.map((post, index) => (
              <PostCard 
                key={post.id} 
                post={post} 
                index={index} 
                onEdit={() => onEditPost(post)} 
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
            {provided.placeholder}
            {posts.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-sm text-muted-foreground text-center p-4">
                Arraste posts para cá.
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};