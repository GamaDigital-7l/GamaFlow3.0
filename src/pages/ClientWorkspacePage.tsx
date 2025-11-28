import React, { useEffect, useState } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import ClientWorkspace from '@/components/kanban/ClientWorkspace';
import { useClientStore } from '@/hooks/use-client-store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Loader2, Edit, ClipboardList, MessageSquare, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { ClientInteractionsHistory } from '@/components/ClientInteractionsHistory';
import ClientNotesSection from '@/components/ClientNotesSection';
import OnboardingConfigPage from './playbook/OnboardingConfigPage'; // Importando OnboardingConfigPage

interface ClientWorkspaceProps {
  clientId: string;
}

const navItems = [
  { path: '', title: 'Kanban', icon: LayoutDashboard, roles: ['admin'] },
  { path: 'interacoes', title: 'Interações', icon: MessageSquare, roles: ['admin'] },
  { path: 'notas', title: 'Notas', icon: Notebook, roles: ['admin'] },
  { path: 'onboarding-config', title: 'Onboarding', icon: ClipboardList, roles: ['admin'] }, // NOVO ITEM
];

const ClientWorkspacePage: React.FC<ClientWorkspaceProps> = ({ }) => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  // Usamos isLoading diretamente do store
  const { getClientById, isLoading: isLoadingClientStore } = useClientStore(); 
  const { userRole, clientId: sessionClientId, isLoading: isLoadingSession } = useSession();
  
  const client = getClientById(clientId || '');
  
  // Removemos isInitialLoadComplete, confiando nos hooks de carregamento

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  // Lógica de verificação de acesso e redirecionamento
  useEffect(() => {
    if (isLoadingSession || isLoadingClientStore) return;

    if (userRole !== 'admin') {
        // Se não for admin, redireciona para o dashboard
        navigate('/', { replace: true });
        return;
    }
    
    // Se o cliente não for encontrado APÓS o carregamento, redireciona
    if (!clientId || !client) {
        // Se o store terminou de carregar e o cliente ainda não está lá
        if (!isLoadingClientStore) {
            showError('Cliente não encontrado ou ID inválido.');
            navigate('/clients', { replace: true });
        }
        return;
    }
    
  }, [client, clientId, isLoadingSession, isLoadingClientStore, userRole, navigate]);


  if (isLoadingSession || isLoadingClientStore) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Buscando cliente...</p>
      </div>
    );
  }
  
  // Se o carregamento terminou e o cliente ainda é nulo, o useEffect já tentou redirecionar.
  // Se chegamos aqui, é porque o cliente foi encontrado.
  if (!client) return null; 

  const basePath = `/clients/${clientId}`;
  
  return (
    <div className="h-full space-y-6">
      
      {/* Header do Workspace com Ações */}
      <div className="flex justify-between items-center border-b pb-2">
        <nav className="flex space-x-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={cn(
                "flex items-center p-2 rounded-md text-sm font-medium transition-colors duration-200",
                location.pathname === `${basePath}/${item.path}` || 
                (location.pathname === basePath && item.path === '')
                  ? "bg-dyad-500 text-white hover:bg-dyad-600"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.title}
            </Link>
          ))}
        </nav>
        
        {/* Botão de Acesso ao Playbook (Para Admin) */}
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/playbook/${clientId}`, '_blank')}
            className="border-input text-foreground hover:bg-muted/80"
        >
            <FileText className="h-4 w-4 mr-2" /> Ver Portal do Cliente
        </Button>
      </div>

      {/* Conteúdo Aninhado */}
      <Routes>
        {/* Rota principal do workspace (Kanban) */}
        <Route index element={<ClientWorkspace clientId={clientId} />} />
        
        {/* Rota de Interações */}
        <Route path="interacoes" element={<ClientInteractionsHistory clientId={clientId} clientName={client.name} />} />
        
        {/* Rota de Notas do Cliente */}
        <Route path="notas" element={<ClientNotesSection clientId={clientId} clientName={client.name} />} />
        
        {/* Rota de Configuração de Onboarding */}
        <Route path="onboarding-config" element={<OnboardingConfigPage clientId={clientId} />} /> {/* NOVA ROTA */}
        
        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to={basePath} replace />} />
      </Routes>
      
    </div>
  );
};

export default ClientWorkspacePage;
</dyad-file>
```

```typescript
<dyad-write path="src/components/kanban/ClientWorkspace.tsx" description="Exporting ClientWorkspace as default.">
import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useClientStore } from '@/hooks/use-client-store';
import { Client, Post, KanbanColumn, KanbanColumnId } from '@/types/client';
import { cn } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { KanbanScrollControls } from './KanbanScrollControls';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from '../ClientAvatar';
import { Droppable } from 'react-beautiful-dnd';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PostCard } from './PostCard';

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
  return uniqueOptions.sort((a, b) => a.value.localeCompare(b.value)).reverse();
};

interface KanbanColumnProps {
  column: KanbanColumn;
  posts: Post[];
  onEditPost: (post: Post) => void;
  onAddPost?: () => void; 
  onApprove: (post: Post) => void; // Nova prop
  onReject: (post: Post) => void;  // Nova prop
}

const KanbanColumnComponent = ({ column, posts, onEditPost, onAddPost, onApprove, onReject }: KanbanColumnProps): React.JSX.Element => {
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
                onEdit={onEditPost} 
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
  
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const monthOptions = React.useMemo(() => generateMonthOptions(currentMonthYear), [currentMonthYear]);

  if (!client) {
    return <div className="text-center p-8 text-red-500">Cliente não encontrado.</div>;
  }

  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result, clientId);
  };

  // Função para obter a classe da Badge de Status (NEUTRA)
  const getStatusBadgeClass = (status: string) => {
    // Todos os status agora usam o mesmo esquema neutro (bg-muted/text-foreground)
    return 'bg-muted text-foreground/80 border border-border';
  };
  
  // Função para obter a classe da Badge de Tipo (NEUTRA)
  const getTypeBadgeClass = (type: string) => {
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
  const pendingApprovalCount = React.useMemo(() => {
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

export default ClientWorkspace;