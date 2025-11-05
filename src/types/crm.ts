import { KanbanColumnId } from './client';

export type LeadStatus = 'Prospectando' | 'Contato Feito' | 'Reunião Agendada' | 'Proposta Enviada' | 'Fechado (Ganho)' | 'Fechado (Perdido)';
export type LeadOrigin = 'Indicação' | 'Tráfego Pago' | 'Orgânico' | 'Outro';

export interface LeadContactInfo {
  phone?: string;
  email?: string;
  instagram?: string;
}

export interface LeadNote {
  date: string; // ISO string
  text: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  contactInfo: LeadContactInfo;
  status: LeadStatus;
  potentialValue?: number;
  origin: LeadOrigin;
  notes: LeadNote[];
  firstContactDate: Date;
  nextActionDate?: Date;
  createdAt: string;
}

export interface CrmColumn {
  id: LeadStatus;
  title: string;
  leadIds: string[];
}