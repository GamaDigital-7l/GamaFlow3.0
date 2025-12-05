export interface PlaybookContent {
  id: string; // ID do registro na tabela playbook_content
  client_id: string;
  section: string;
  content: any; // General content structure
  briefing_responses?: any[]; // General responses structure
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