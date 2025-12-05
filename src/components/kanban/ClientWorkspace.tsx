import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useClientStore } from '@/hooks/use-client-store';
import { Client, Post, KanbanColumn, KanbanColumnId } from '@/types/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Phone, Mail, MessageSquare, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostForm } from '@/components/PostForm';
import { PostEditDialog } from '@/components/PostEditDialog';
import { PostApprovalLinkDialog } from '@/components/kanban/PostApprovalLinkDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanScrollControls } from './KanbanScrollControls';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from '../ClientAvatar';
import { Droppable } from 'react-beautiful-dnd';
import { PostCard } from './PostCard';
import { Badge } from '@/components/ui/badge';
import { generateMonthOptions } from '@/utils/date'; // Importando a função utilitária
import { useIsMobile } from '@/hooks/use-mobile'; // Importando useIsMobile

interface ClientWorkspaceProps {
  clientId: string;
}

interface KanbanColumnProps {
  column: KanbanColumn;
  posts: Post[];
  onEditPost: (post: Post) => void;
  onAddPost?: () => void; 
  onApprove: (post: Post) => void; // Nova prop
  onReject: (post: Post) => void;  // Nova prop
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({ column, posts, onEditPost, onAddPost, onApprove, onReject }) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "flex flex-col flex-shrink-0 mx-2 h-full",
      isMobile ? "w-full mb-6" : "w-72" // Ocupa 100% da largura no mobile
    )}>
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
              "p-2 rounded-b-lg flex-grow min-h-[100px] transition-colors duration-200 overflow-y-auto", // Adicionado overflow-y-auto de volta para a lista de posts DENTRO da coluna
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

// Função auxiliar para formatar o mês/ano
const formatMonthYear = (monthYear: string) => {
    if (monthYear === '2099-12') return 'Backlog (Sem Data)';
    try {
        return format(parseISO(monthYear + '-01'), 'MMMM/yyyy', { locale: ptBR });
    } catch {
        return monthYear;
    }
};

const ClientWorkspace: React.FC<ClientWorkspaceProps> = ({ clientId }) => {
  const { getClientById, getKanbanData, handleDragEnd, updatePost, addPost, deletePost } = useClientStore();
  const client = getClientById(clientId);
  const isMobile = useIsMobile();
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  
  const { columns, columnOrder, postsMap } = getKanbanData(clientId, selectedMonthYear);

  const [isDialogOpen, setIsDialogOpen] = useState(false); // Adicionar Post
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Editar Post
  const [isApprovalLinkDialogOpen, setIsApprovalLinkDialogOpen] = useState(false); // Link de Aprovação
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); // CORRIGIDO: Inicializado como null
  
  // Referência para o elemento DOM que contém a rolagem horizontal (apenas para desktop)
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // Gera opções de mês dinamicamente, incluindo o mês de backlog se necessário
  const monthOptions = useMemo(() => {
    // 1. Coleta todos os monthYear únicos dos posts
    const uniqueMonthYears = new Set<string>();
    client?.posts.forEach(p => {
        if (p.monthYear) {
            uniqueMonthYears.add(p.monthYear);
        }
    });
    
    // 2. Garante que o mês atual esteja incluído
    uniqueMonthYears.add(currentMonthYear);
    
    // 3. Converte para array e ordena (mais recente primeiro)
    const sortedMonths = Array.from(uniqueMonthYears)
        .sort()
        .reverse();
        
    return sortedMonths.map(monthYear => ({
        value: monthYear,
        label: formatMonthYear(monthYear),
    }));
  }, [client?.posts, currentMonthYear]);
  
  // Garante que o mês selecionado seja válido ou volte para o atual
  useEffect(() => {
    if (!monthOptions.some(opt => opt.value === selectedMonthYear)) {
        setSelectedMonthYear(currentMonthYear);
    }
  }, [monthOptions, selectedMonthYear, currentMonthYear]);


  // Funções de navegação de mês
  const handlePrevMonth = () => {
    const currentIndex = monthOptions.findIndex(opt => opt.value === selectedMonthYear);
    if (currentIndex < monthOptions.length - 1) {
        setSelectedMonthYear(monthOptions[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = monthOptions.findIndex(opt => opt.value === selectedMonthYear);
    if (currentIndex > 0) {
        setSelectedMonthYear(monthOptions[currentIndex - 1].value);
    }
  };

  if (!client) {
    return <div className="text-center p-8 text-red-500">Cliente não encontrado.</div>;
  }

  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result, clientId);
  };

  const handleCreatePost = (newPost: Omit<Post, 'id' | 'approvalLink'>) => {
    addPost({ clientId, newPost: { ...newPost, subtasks: newPost.subtasks || [] } });
    setIsDialogOpen(false);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (post: Post) => {
    updatePost({ clientId, updatedPost: post });
    setIsEditDialogOpen(false);
  };

  const handleDeletePost = (post: Post) => {
    deletePost({ clientId, postId: post.id });
    setIsEditDialogOpen(false);
  };

  const handleQuickApprove = (post: Post) => {
    const updatedPost: Post = { ...post, status: 'Aprovado' as KanbanColumnId };
    updatePost({ clientId, updatedPost });
    showSuccess(`Post "${post.title}" aprovado rapidamente!`);
  };

  const handleQuickReject = (post: Post) => {
    const updatedPost: Post = { ...post, status: 'Edição' as KanbanColumnId };
    updatePost({ clientId, updatedPost });
    showSuccess(`Solicitação de edição para "${post.title}" enviada.`);
  };

  // Função para abrir o modal de link de aprovação (agora simplificada)
  const handleOpenApprovalLink = () => {
    setIsApprovalLinkDialogOpen(true);
  };
  
  const currentIndex = monthOptions.findIndex(opt => opt.value === selectedMonthYear);
  const isFirstMonth = currentIndex === 0;
  const isLastMonth = currentIndex === monthOptions.length - 1;

  return (
    <div className="h-full flex flex-col">
      {/* Controles Kanban: Flex-col no mobile, flex-row no md */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 px-4 md:px-0"> {/* Adicionado padding horizontal aqui */}
        
        {/* Navegação de Mês (Substituindo o Select) */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrevMonth}
                className="h-8 w-8"
                disabled={isLastMonth}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg w-40 text-center flex-shrink-0">
                {formatMonthYear(selectedMonthYear)}
            </span>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextMonth}
                className="h-8 w-8"
                disabled={isFirstMonth}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          {/* Botão Link de Aprovação (Neutro) */}
          <Button 
            onClick={handleOpenApprovalLink} 
            variant="outline"
            className="border-input text-foreground hover:bg-muted/80 flex-1"
          >
            <LinkIcon className="h-4 w-4 mr-2" /> Link de Aprovação
          </Button>
          {/* Botão Adicionar Post (Dyad Pink mantido para ação principal) */}
          <Button onClick={() => setIsDialogOpen(true)} className="bg-dyad-500 hover:bg-dyad-600 flex-1">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Post
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Contêiner de Rolagem Horizontal (Desktop) ou Vertical (Mobile) */}
        <div className="relative flex-grow">
          <div 
            className={cn(
              "w-full h-full rounded-lg border bg-muted/20 p-2",
              isMobile ? "overflow-y-auto" : "overflow-x-auto" // Rolagem vertical no mobile
            )}
            ref={scrollContentRef}
          >
            <div className={cn(
              "pb-4 h-full",
              isMobile ? "flex flex-col space-y-4" : "flex space-x-4 whitespace-nowrap" // Colunas empilhadas no mobile
            )}>
              {columnOrder.map((columnId) => {
                const column = columns[columnId];
                const posts = column.postIds.map(postId => postsMap[postId]).filter(p => p !== undefined);

                return (
                  <KanbanColumnComponent
                    key={columnId}
                    column={column}
                    posts={posts}
                    onEditPost={handleEditPost}
                    onApprove={handleQuickApprove}
                    onReject={handleQuickReject}
                    onAddPost={columnId === 'Produção' ? () => setIsDialogOpen(true) : undefined}
                  />
                );
              })}
            </div>
          </div>
          {/* Controles de Scroll (Apenas no Desktop) */}
          {!isMobile && <KanbanScrollControls scrollAreaRef={scrollContentRef} />}
        </div>
      </DragDropContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Post ({formatMonthYear(selectedMonthYear)})</DialogTitle>
          </DialogHeader>
          <PostForm onCancel={() => setIsDialogOpen(false)} onSubmit={handleCreatePost} clientId={clientId} />
        </DialogContent>
      </Dialog>

      {selectedPost && (
        <PostEditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          post={selectedPost}
          onSave={handleSavePost}
          onDelete={handleDeletePost}
        />
      )}
      
      {/* O PostApprovalLinkDialog agora só precisa do clientId */}
      <PostApprovalLinkDialog
        isOpen={isApprovalLinkDialogOpen}
        onOpenChange={setIsApprovalLinkDialogOpen}
        clientId={clientId}
      />
    </div>
  );
};

export default ClientWorkspace;