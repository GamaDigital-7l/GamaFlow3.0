export type ProposalStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
export type ProposalSectionType = 'executive_summary' | 'problem_diagnosis' | 'solution_detail' | 'goals' | 'timeline' | 'budget' | 'portfolio' | 'cta' | 'ai_text';

export interface ProposalSection {
  id: string;
  type: ProposalSectionType;
  title: string;
  content: string; // Texto principal, HTML ou Markdown
  details?: any; // Estruturas complexas (ex: itens de orçamento, metas)
}

export interface ProposalBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

export interface SalesProposal {
  id: string;
  user_id: string;
  title: string;
  client_name: string;
  status: ProposalStatus;
  sections: ProposalSection[];
  branding_config: ProposalBranding;
  ai_summary?: string;
  public_link_id: string;
  created_at: string;
}

// Tipos para Orçamento
export interface BudgetItem {
    id: string;
    service: string;
    description: string;
    price: number;
    recurrence: 'one-time' | 'monthly';
}

// Tipos para Metas
export interface GoalItem {
    id: string;
    metric: string;
    target: string;
    indicator: string; // Ex: KPI
}