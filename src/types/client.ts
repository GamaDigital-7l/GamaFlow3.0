export type ClientStatus = 'Ativo' | 'Pausado' | 'Finalizado';
export type ClientType = 'Fixo' | 'Freela' | 'Avulso'; // Novo tipo
export type KanbanColumnId = 'Produção' | 'Aprovação' | 'Edição' | 'Aprovado' | 'Publicado' | 'Material Off'; // Colunas simplificadas

export interface Post {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  imageUrl: string; // URL da imagem de capa (1080x1350)
  subtasks: string[];
  status: KanbanColumnId;
  approvalLink: string;
  monthYear: string; // Novo: 'YYYY-MM' para agrupar por mês
  completedAt?: Date; // NEW
}

export interface Client {
  id: string;
  name: string;
  logoUrl: string;
  status: ClientStatus;
  type: ClientType; // Novo
  color: string; // Novo (ex: #ED1857)
  posts: Post[];
  // Novos campos de contato e detalhes
  phone?: string;
  whatsappNumber?: string; // NOVO: Número individual ou ID do grupo
  email?: string;
  cnpj?: string;
  monthlyPostGoal: number; // Novo: Meta de posts mensais
}

export interface KanbanColumn {
  id: KanbanColumnId;
  title: string;
  postIds: string[];
}