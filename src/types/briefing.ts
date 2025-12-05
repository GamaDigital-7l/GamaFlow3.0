import { Client } from './client';

// Adicionando 'email', 'login', 'checkbox' (select_multiple já existe), 'radio' (select_single já existe)
export type FieldType = 'text_short' | 'text_long' | 'number' | 'email' | 'login' | 'select_single' | 'select_multiple' | 'dropdown' | 'upload' | 'link' | 'date' | 'section' | 'description';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface ConditionalLogic {
  fieldId: string;
  expectedValue: string | string[];
}

export interface BriefingField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  isRequired: boolean;
  options?: FieldOption[]; // Para select, checkbox, dropdown
  conditionalLogic?: ConditionalLogic;
  // Para campos de seção/descrição, o 'label' é o conteúdo principal
}

export type DisplayMode = 'page' | 'typeform';

export interface BriefingForm {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  clientId?: string; // Cliente associado (opcional)
  displayMode: DisplayMode;
  fields: BriefingField[];
  isPublic: boolean;
  createdAt: string;
}

// Novo tipo para Templates de Briefing
export interface BriefingTemplate {
  id: string;
  name: string;
  description: string;
  blocks: BriefingField[]; // Usamos fields como blocos
}

// Exportando BriefingResponse (NEW)
export interface BriefingResponse {
    id: string;
    form_id: string;
    client_id?: string;
    response_data: Record<string, any>;
    submitted_at: string;
}