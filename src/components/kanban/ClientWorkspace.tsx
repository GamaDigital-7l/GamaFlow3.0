import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useClientStore } from '@/hooks/use-client-store';
import { Client, Post, KanbanColumn, KanbanColumnId } from '@/types/client';
import { KanbanColumnComponent } from './KanbanColumn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Phone, Mail, MessageCircle, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostForm } from "@/components/PostForm";
import { PostEditDialog } from '@/components/PostEditDialog';
import { PostApprovalLinkDialog } from '@/components/kanban/PostApprovalLinkDialog';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanScrollControls } from './KanbanScrollControls';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from '../ClientAvatar';

interface ClientWorkspaceProps {
  clientId: string;
}

// Gera uma lista de meses (ex: 6 meses passados, 6 meses futuros)
const generateMonthOptions = (currentMonthYear: string) => {
  const options: { value: string; label: string }[] = [];
  const today = new Date();
  
  for (let i = -6; i <= 6; i++) {
    const monthDate = subMonths(today, i);
    options.push({
      value: format(monthDate, 'yyyy-MM'),
      label: format(monthDate, 'MMMM/yyyy', { locale: ptBR }),
    });
  }
  
  // Remove duplicatas e garante que o mês atual esteja presente
  const uniqueOptions = Array.from(new Map(options.map(item => [item.value, item])).values());
  return uniqueOptions.sort((a, b) => a.value.localeCompare(b.value));
};

const ClientWorkspace: React.FC<ClientWorkspaceProps> = ({ clientId }) => {
  const { getClientById, getKanbanData, handleDragEnd, updatePost, addPost, deletePost } = useClientStore();
  const client = getClientById(clientId);
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  
  const { columns, columnOrder, postsMap } = getKanbanData(clientId, selectedMonthYear);

  const [isDialogOpen, setIsDialogOpen] = useState(false); // Adicionar Post
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Editar Post
  const [isApprovalLinkDialogOpen, setIsApprovalLinkDialogOpen] = useState(false); // Link de Aprovação
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const monthOptions = useMemo(() => generateMonthOptions(currentMonthYear), [currentMonthYear]);

  if (!client) {
    return <div className="text-center p-8 text-red-500">Cliente não encontrado.</div>;
  }

  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result, clientId);
  };

  // Função para obter a classe da Badge de Status (NEUTRA)
  const getStatusBadgeClass = (status: Client['status']) => {
    // Todos os status agora usam o mesmo esquema neutro (bg-muted/text-foreground)
    return 'bg-muted text-foreground/80 border border-border';
  };
  
  // Função para obter a classe da Badge de Tipo (NEUTRA)
  const getTypeBadgeClass = (type: Client['type']) => {
    return 'bg-muted text-foreground/80 border border-border';
  };


  const handleCreatePost = (newPost: Omit<Post, 'id' | 'approvalLink'>) => {
    addPost(clientId, { ...newPost, monthYear: selectedMonthYear, subtasks: newPost.subtasks || [] });
    setIsDialogOpen(false);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (post: Post) => {
    updatePost(clientId, post);
    setIsEditDialogOpen(false);
  };

  const handleDeletePost = (post: Post) => {
    deletePost(clientId, post.id);
    setIsEditDialogOpen(false);
  };

  const handleQuickApprove = (post: Post) => {
    const updatedPost: Post = { ...post, status: 'Aprovado' as KanbanColumnId };
    updatePost(clientId, updatedPost);
    showSuccess(`Post "${post.title}" aprovado rapidamente!`);
  };

  const handleQuickReject = (post: Post) => {
    const updatedPost: Post = { ...post, status: 'Edição' as KanbanColumnId };
    updatePost(clientId, updatedPost);
    showSuccess(`Solicitação de edição para "${post.title}" enviada.`);
  };

  // Contagem de posts pendentes de aprovação
  const pendingApprovalCount = useMemo(() => {
    return client.posts.filter(p => p.status === 'Aprovação').length;
  }, [client.posts]);
  
  // Função para abrir o modal de link de aprovação (agora simplificada)
  const handleOpenApprovalLink = () => {
    setIsApprovalLinkDialogOpen(true);
  };


  return (
    <div className="h-full space-y-6">
      {/* Header do Cliente: Flex-col no mobile, flex-row no md */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-2">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <ClientAvatar 
            name={client.name} 
            logoUrl={client.logoUrl} 
            className="w-10 h-10 flex-shrink-0" 
          />
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {/* Badge de Status (Neutro) */}
              <Badge className={cn("text-white text-xs", getStatusBadgeClass(client.status))}>
                {client.status}
              </Badge>
              {/* Badge de Tipo (Neutro) */}
              <Badge variant="secondary" className="text-xs">
                {client.type}
              </Badge>
              {/* Badge de Aprovações Pendentes (Neutro, mas com destaque sutil) */}
              {pendingApprovalCount > 0 && (
                <Badge className="bg-muted text-dyad-500 border border-dyad-500/50 text-xs">
                  {pendingApprovalCount} Aprovações Pendentes
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Detalhes de Contato: Quebra de linha no mobile */}
        <div className="flex flex-wrap items-center space-x-4 text-sm text-muted-foreground">
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center hover:text-dyad-500 transition-colors">
              <Phone className="h-4 w-4 mr-1" /> {client.phone}
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center hover:text-dyad-500 transition-colors">
              <Mail className="h-4 w-4 mr-1" /> {client.email}
            </a>
          )}
          {client.whatsappNumber && (
            <span className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" /> Grupo ID: {client.whatsappNumber}
            </span>
          )}
        </div>
      </div>
      
      {/* Controles Kanban: Flex-col no mobile, flex-row no md */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
        <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Selecione o Mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {/* Scroll lateral estilo Trello */}
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg border bg-muted/20 p-4" ref={scrollAreaRef}>
            <div className="flex space-x-4 pb-4">
              {columnOrder.map((columnId) => {
                const column = columns[columnId];
                const posts = column.postIds.map(postId => postsMap[postId]).filter(p => p !== undefined);

                // Permite adicionar posts nas colunas 'Produção' e 'Material Off'
                const shouldAllowAdd = columnId === 'Produção' || columnId === 'Material Off';

                return (
                  <KanbanColumnComponent
                    key={columnId}
                    column={column}
                    posts={posts}
                    onEditPost={handleEditPost}
                    onAddPost={shouldAllowAdd ? () => setIsDialogOpen(true) : undefined}
                    onApprove={handleQuickApprove}
                    onReject={handleQuickReject}
                  />
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <KanbanScrollControls scrollAreaRef={scrollAreaRef} />
        </div>
      </DragDropContext>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Post ({format(parseISO(selectedMonthYear), 'MMMM/yyyy', { locale: ptBR })})</DialogTitle>
          </DialogHeader>
          <PostForm onCancel={() => setIsDialogOpen(false)} onSubmit={handleCreatePost} clientId={clientId} />
        </DialogContent>
      </Dialog>

      {selectedPost && (
        <PostEditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedPost}
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