export interface Note {
  id: string;
  userId: string;
  clientId?: string | null;
  title: string;
  content: string; // Agora armazena conteúdo formatado (HTML/JSON)
  isPinned: boolean; // Para fixar no topo
  tags: string[]; // Tags para organização
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  isSmart: boolean;
  filterConfig?: any;
}