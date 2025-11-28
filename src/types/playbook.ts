export enum OnboardingBlockType {
  Title = 'title',
  Text = 'text',
  FileUpload = 'fileUpload',
  BriefingForm = 'briefingForm', // Novo tipo de bloco para formulários de briefing
  MediaLink = 'mediaLink', // Novo tipo de bloco para links de mídia
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
    // MediaLink specific
    linkTitle?: string;
    linkUrl?: string;
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
  id: string;
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