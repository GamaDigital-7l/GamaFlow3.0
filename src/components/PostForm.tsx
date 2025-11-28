import React, { useState } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload'; // Importando o hook de upload

interface PostFormProps {
  post?: Post;
  onSubmit: (post: Omit<Post, 'id' | 'approvalLink'>) => void;
  onCancel: () => void;
  clientId: string; // Adding clientId prop
}

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const PostForm: React.FC<PostFormProps> = ({ post, onSubmit, onCancel, clientId }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(post?.dueDate || undefined);
  const [dueTime, setDueTime] = useState(getInitialTime(post?.dueDate));
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Novo estado para o arquivo selecionado
  const [status, setStatus] = useState<KanbanColumnId>(post?.status || 'Produção');
  const { uploadFile, isUploading } = usePlaybookUpload(clientId); // Usando o hook de upload

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file)); // Cria um URL local para a imagem
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Usa a hora atual do estado dueTime para definir a hora na nova data
      const [hours, minutes] = dueTime.split(':').map(Number);
      
      const newDate = new Date(date);
      // Se dueTime for vazio ou inválido, usa o final do dia (23:59)
      if (isNaN(hours) || isNaN(minutes)) {
        newDate.setHours(23, 59, 59, 999);
      } else {
        newDate.setHours(hours, minutes, 0, 0);
      }
      
      setDueDate(newDate);
    } else {
      setDueDate(undefined);
      setDueTime(''); // Limpa a hora se não houver data
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setDueTime(newTime);
    
    if (dueDate && newTime) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(dueDate);
        newDate.setHours(hours, minutes, 0, 0);
        setDueDate(newDate);
    } else if (dueDate && !newTime) {
        // Se o usuário apagar a hora, define para o final do dia
        const newDate = new Date(dueDate);
        newDate.setHours(23, 59, 59, 999);
        setDueDate(newDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('O título do post não pode estar vazio.');
      return;
    }
    
    let finalImageUrl = imageUrl;
    
    if (selectedFile) {
        // Se um arquivo foi selecionado, faça o upload
        const uploadResult = await uploadFile(selectedFile);
        if (uploadResult) {
            finalImageUrl = uploadResult.url;
        } else {
            showError('Falha ao fazer upload da imagem.');
            return;
        }
    }

    // Data de vencimento agora é opcional. Se não houver data, usamos uma data futura padrão (ex: 1 ano)
    let finalDueDate = dueDate;
    if (!finalDueDate) {
        // Se não houver data, define uma data muito futura para fins de ordenação e evitar erros de tipo Date
        finalDueDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    } else if (dueTime) {
        const [hours, minutes] = newTime.split(':').map(Number);
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(hours, minutes, 0, 0);
    } else {
        // Se a hora não for definida, define para o final do dia
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(23, 59, 59, 999);
    }

    const newPost = {
      title: title.trim(),
      description: description.trim(),
      dueDate: finalDueDate,
      imageUrl: finalImageUrl,
      status: status,
      subtasks: [],
    };

    onSubmit(newPost as Omit<Post, 'id' | 'approvalLink'>);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'title') {
      setTitle(value);
    } else if (id === 'description') {
      setDescription(value);
    } else if (id === 'imageUrl') {
      setImageUrl(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={handleChange}
          placeholder="Título do post"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (Legenda)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleChange}
          placeholder="Descrição/Legenda do post"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Seleção de Data */}
        <div className="grid gap-2 col-span-2">
          <Label>Data de Vencimento (Opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Seleção de Hora */}
        <div className="grid gap-2">
          <Label htmlFor="dueTime">Horário (Opcional)</Label>
          <Input
            id="dueTime"
            type="time"
            value={dueDate ? dueTime : ''} // Limpa a hora se não houver data
            onChange={handleTimeChange}
            placeholder="HH:mm"
            disabled={!dueDate}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">URL da Imagem (Capa 1080x1350)</Label>
        <div className="flex space-x-2">
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={handleChange}
            placeholder="URL da imagem do post"
            className="flex-grow"
            disabled={isUploading}
          />
          <Input
            id="fileUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => document.getElementById('fileUpload')?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status Inicial</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as KanbanColumnId)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Produção">Produção</SelectItem>
            <SelectItem value="Aprovação">Aprovação</SelectItem>
            <SelectItem value="Edição">Edição</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};
</dyad-file>

<dyad-file path="src/hooks/use-playbook-content.tsx">
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlaybookContent, PlaybookFile, BriefingResponseEntry } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';

const CONTENT_QUERY_KEY = 'playbookContent';

// Função para buscar o conteúdo de uma seção específica para um cliente
const fetchPlaybookContent = async (clientId: string, section: string): Promise<PlaybookContent | null> => {
  // Adiciona validação para clientId: só busca se for um UUID válido (não vazio)
  if (!clientId || clientId.trim() === '') {
    console.warn("clientId é inválido ou vazio. Pulando busca de playbook_content.");
    return null;
  }
  
  console.log(`[DEBUG] fetchPlaybookContent - clientId: ${clientId}, section: ${section}`);

  const { data, error } = await supabase
    .from('playbook_content')
    .select('*')
    .eq('client_id', clientId)
    .eq('section', section)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
    throw new Error(error.message);
  }
  
  // Garante que 'content' e 'briefing_responses' sejam inicializados corretamente
  return data ? {
    ...data,
    content: data.content || { blocks: [], uploadedFiles: [] }, // Garante estrutura para blocks e uploadedFiles
    briefing_responses: data.briefing_responses || [], // Mapeia do DB
  } as PlaybookContent : null;
};

// Função para salvar ou atualizar o conteúdo
const upsertPlaybookContent = async (contentData: { clientId: string, section: string, content: { blocks: any[], uploadedFiles?: PlaybookFile[] }, briefingResponses?: BriefingResponseEntry[] }): Promise<PlaybookContent> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const upsertData = {
    client_id: contentData.clientId,
    section: contentData.section,
    content: contentData.content, // Agora inclui blocks e uploadedFiles
    briefing_responses: contentData.briefingResponses || [], // Mapeia para o DB
  };

  const { data, error } = await supabase
    .from('playbook_content')
    .upsert(upsertData, { onConflict: 'client_id, section' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  // Retorna o objeto PlaybookContent completo, incluindo as respostas do briefing
  return {
    ...data,
    content: data.content || { blocks: [], uploadedFiles: [] },
    briefing_responses: data.briefing_responses || [],
  } as PlaybookContent;
};

export const usePlaybookContent = (clientId: string, section: string) => {
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery<PlaybookContent | null, Error>({
    queryKey: [CONTENT_QUERY_KEY, clientId, section],
    queryFn: () => fetchPlaybookContent(clientId, section),
    staleTime: 300000, // 5 minutos de cache
    enabled: !!clientId && clientId.trim() !== '', // Habilita a query apenas se clientId for válido
  });

  const upsertMutation = useMutation({
    mutationFn: upsertPlaybookContent,
    onSuccess: () => {
      // Invalida a query para forçar a re-leitura após salvar
      queryClient.invalidateQueries({ queryKey: [CONTENT_QUERY_KEY, clientId, section] });
      showSuccess('Conteúdo atualizado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao salvar conteúdo: ${err.message}`);
    },
  });

  // Função para salvar o conteúdo e as respostas do briefing
  const saveContent = (section: string, content: { blocks: any[], uploadedFiles?: PlaybookFile[] }, briefingResponses?: BriefingResponseEntry[]) => {
    upsertMutation.mutate({ clientId, section, content, briefingResponses });
  };

  return {
    content: content,
    isLoading,
    error,
    saveContent,
    isSaving: upsertMutation.isPending,
  };
};
</dyad-file>

<dyad-file path="src/hooks/use-client-logins.tsx">
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientLogin } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';

const LOGINS_QUERY_KEY = 'clientLogins';

// Função para buscar todos os logins para um cliente específico
const fetchClientLogins = async (clientId: string): Promise<ClientLogin[]> => {
  const { data, error } = await supabase
    .from('client_logins')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientLogin[];
};

// Função para adicionar um novo login
const addClientLogin = async (login: Omit<ClientLogin, 'id' | 'created_at' | 'user_id'>): Promise<ClientLogin> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const loginWithUser = {
    ...login,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('client_logins')
    .insert(loginWithUser)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientLogin;
};

// Função para deletar um login
const deleteClientLogin = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('client_logins')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useClientLogins = (clientId: string) => {
  const queryClient = useQueryClient();

  const { data: logins, isLoading, error } = useQuery<ClientLogin[], Error>({
    queryKey: [LOGINS_QUERY_KEY, clientId],
    queryFn: () => fetchClientLogins(clientId),
  });

  const addMutation = useMutation({
    mutationFn: addClientLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOGINS_QUERY_KEY, clientId] });
      showSuccess('Login adicionado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar login: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientLogin,
    onSuccess: () => {
      // A invalidação usa o clientId do hook, garantindo que a lista correta seja atualizada.
      queryClient.invalidateQueries({ queryKey: [LOGINS_QUERY_KEY, clientId] });
      showSuccess('Login excluído com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao excluir login: ${err.message}`);
    },
  });

  return {
    logins: logins || [],
    isLoading,
    error,
    addLogin: addMutation.mutate,
    deleteLogin: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
</dyad-file>

<dyad-file path="src/hooks/use-client-interactions.tsx">
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface ClientInteraction {
  id: string;
  client_id: string;
  user_id: string;
  interaction_type: 'feedback' | 'edit_request';
  content: string;
  created_at: string;
}

const INTERACTIONS_QUERY_KEY = 'clientInteractions';

const fetchClientInteractions = async (clientId: string): Promise<ClientInteraction[]> => {
  if (!clientId) return [];
  
  // RLS permite que usuários autenticados leiam todas as interações (para admin)
  const { data, error } = await supabase
    .from('client_interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientInteraction[];
};

export const useClientInteractions = (clientId: string) => {
  const { data: interactions = [], isLoading, error } = useQuery<ClientInteraction[], Error>({
    queryKey: [INTERACTIONS_QUERY_KEY, clientId],
    queryFn: () => fetchClientInteractions(clientId),
    enabled: !!clientId,
  });

  if (error) {
    showError(`Erro ao carregar interações: ${error.message}`);
  }

  return {
    interactions,
    isLoading,
    error,
  };
};
</dyad-file>

<dyad-file path="src/lib/utils.ts">
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

</dyad-file>

<dyad-file path="src/components/AppShell.tsx">
"use client";

import React, { useState, useEffect } from "react";
import { Menu, LogOut, User, Settings, Notebook } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "./SessionContextProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Link, Outlet } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTheme } from "next-themes";

export const AppShell: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, userRole, clientId } = useSession(); // Get clientId from session
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  const isMobile = useIsMobile(); // Usando o hook para detectar mobile

  // Efeito para prevenir a rolagem do corpo quando a sidebar está aberta no mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = ''; // Limpa o estilo ao desmontar
    };
  }, [isSidebarOpen, isMobile]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Erro ao fazer logout.');
    } else {
      // The SessionContextProvider handles redirection after SIGNED_OUT
    }
  };

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário';
  const userLastName = user?.user_metadata?.last_name || '';
  const userInitials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  
  const isAdmin = userRole === 'admin';
  const isClient = userRole === 'client';
  
  // Determine the correct link for the logo
  const homeLink = isClient && clientId ? `/playbook/${clientId}` : "/";
  
  // Determine which logo to use
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (Always modal/overlay) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow transition-all duration-300 ease-in-out w-full">
        
        {/* Header/Top Bar (Unified) */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
          
          <div className="flex items-center space-x-4">
            {/* Menu Button (Visível para Admin OU em mobile) */}
            {(isAdmin || isMobile) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Logo do App (Link para Dashboard ou Playbook) */}
            <Link to={homeLink} className={cn(
              "h-8 flex items-center transition-opacity hover:opacity-80",
              // Removido o ml-4 condicional, o flexbox já lida com o espaçamento
            )}>
              {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
                <img 
                  src={finalLogoUrl} 
                  alt="Gama Creative Logo" 
                  className="h-full object-contain" 
                />
              ) : (
                <h1 className="text-xl font-bold text-dyad-500">Gama Creative</h1>
              )}
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* Ícone de Anotações Pessoais (Notebook) */}
            <Link to="/notes">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Notebook className="h-5 w-5 text-muted-foreground hover:text-dyad-500" />
                </Button>
            </Link>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userFirstName} />}
                    <AvatarFallback className="bg-dyad-500 text-white text-sm">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userFirstName} {userLastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {userRole && (
                      <p className="text-xs leading-none text-dyad-500 mt-1">
                        Role: {userRole.toUpperCase()}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Wrapper (Ajustando para a regra dos 98% e centralizando) */}
        <main className="flex-grow p-2 md:p-4">
          <div className="w-full max-w-[98vw] mx-auto h-full"> {/* Re-adicionado container mx-auto para largura limitada */}
            <Outlet /> {/* Renders the child route content here */}
          </div>
        </main>
      </div>
    </div>
  );
};
</dyad-file>

<dyad-file path="src/types/playbook.ts">
export enum OnboardingBlockType {
  Title = 'title',
  Text = 'text',
  FileUpload = 'fileUpload',
  BriefingForm = 'briefingForm', // Novo tipo de bloco para formulários de briefing
  // Adicione outros tipos conforme necessário (ex: LoginVault, MediaGallery)
}

export interface OnboardingBlock {
  id: string;
  type: OnboardingBlockType;
  data: {
    // Common properties
    title?: string;
    content?: string; // For text blocks
    description?: string; // For file upload or form descriptions
    // FileUpload specific
    allowedFileTypes?: string[];
    maxFiles?: number;
    // BriefingForm specific
    formTitle?: string;
    formDescription?: string;
    questions?: BriefingQuestion[]; // Define as perguntas do briefing
    // ... outros dados específicos de blocos
  };
}

export interface BriefingQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date' | 'link'; // Tipos de input para as perguntas
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para select, checkbox, radio
}

// Definindo o tipo para os arquivos simulados (deve ser o mesmo usado em VisualIdentityPage)
export interface PlaybookFile {
  id: string; // Usar string para consistência com UUID
  name: string;
  type: string; // Ex: 'image/jpeg', 'application/pdf'
  url: string;
  blockId: string; // Para saber qual bloco de upload gerou o arquivo
  uploadedBy: 'client' | 'admin'; // Quem fez o upload
  uploadedAt: string; // ISO string
}

export interface BriefingResponseEntry {
  blockId: string;
  responses: { questionId: string; answer: string | string[]; }[];
  submittedAt: string; // ISO string
}

export interface PlaybookContent {
  id: string; // ID do registro na tabela playbook_content
  client_id: string;
  section: string;
  content: { // Este campo JSONB agora armazena os blocos e arquivos
    blocks: OnboardingBlock[];
    uploadedFiles?: PlaybookFile[]; // Arquivos enviados pelo cliente via FileUpload block
  };
  briefing_responses?: BriefingResponseEntry[]; // Para armazenar respostas do briefing
  created_at: string;
}

export interface UsefulLink {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface ClientLogin {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  login: string;
  password?: string;
  notes?: string;
  created_at: string;
}
</dyad-file>

<dyad-file path="src/components/QuickTaskAdd.tsx">
import React, { useState } from 'react';
import { Plus, ListPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/hooks/use-task-store';
import { TaskCategory, TaskPriority } from '@/types/task';
import { showSuccess, showError } from '@/utils/toast';

interface QuickTaskAddProps {
  // Props para definir onde a tarefa será categorizada
  defaultCategory: TaskCategory;
  defaultPriority: TaskPriority;
  // Função para abrir o formulário detalhado (Shift+Enter)
  onOpenDetailedForm: () => void;
}

export const QuickTaskAdd: React.FC<QuickTaskAddProps> = ({ defaultCategory, defaultPriority, onOpenDetailedForm }) => {
  const [title, setTitle] = useState('');
  const { addTask, isAdding } = useTaskStore();

  const handleAddTask = () => {
    if (!title.trim()) {
      showError('O título da tarefa não pode estar vazio.');
      return;
    }

    // A data de vencimento é definida com base na categoria/prioridade:
    // Se for 'Hoje', a data é hoje (fim do dia). Se for 'Esta Semana', a data é o fim da semana.
    let dueDate = new Date(new Date().setHours(23, 59, 59, 999));
    
    // Lógica simplificada para data de vencimento (mantendo o comportamento anterior)
    if (defaultCategory === 'Geral' && defaultPriority === 'Baixa') {
        // Se for "Esta Semana - Baixa", definimos para o final da semana (ex: Domingo)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        dueDate = new Date(today.getTime() + daysUntilSunday * 86400000);
        dueDate.setHours(23, 59, 59, 999);
    }


    const newTask = {
      title: title.trim(),
      description: 'Adicionada rapidamente.',
      dueDate: dueDate,
      priority: defaultPriority,
      category: defaultCategory,
      isRecurrent: false,
    };

    addTask(newTask, {
      onSuccess: () => {
        setTitle('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter abre o formulário detalhado
        onOpenDetailedForm();
      } else {
        // Enter adiciona a tarefa rápida
        handleAddTask();
      }
    }
  };

  return (
    <div className="flex space-x-2 mb-3">
      <Input
        placeholder="Adicionar tarefa rápida (Shift+Enter para detalhes)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow h-9 text-sm"
        disabled={isAdding}
      />
      <Button 
        size="icon" 
        onClick={handleAddTask}
        className="h-9 w-9 bg-dyad-500 hover:bg-dyad-600 flex-shrink-0"
        disabled={isAdding}
      >
        {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
};