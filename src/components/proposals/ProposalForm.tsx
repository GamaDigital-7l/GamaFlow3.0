import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2, Edit, Brain, DollarSign, Target, Clock, MessageSquare, X, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesProposal, ProposalStatus, ProposalSection, ProposalSectionType, ProposalBranding, BudgetItem, GoalItem } from '@/types/proposal';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/use-app-settings';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProposalBrandingForm } from './ProposalBrandingForm';
import { ProposalSectionEditor } from './ProposalSectionEditor';
import { v4 as uuidv4 } from 'uuid';

interface ProposalFormProps {
  initialData?: SalesProposal;
  onSubmit: (proposal: Omit<SalesProposal, 'user_id' | 'created_at' | 'public_link_id'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DEFAULT_SECTIONS: ProposalSection[] = [
    { id: uuidv4(), type: 'executive_summary', title: 'Resumo Executivo', content: 'Apresentação da agência e proposta de valor.' },
    { id: uuidv4(), type: 'problem_diagnosis', title: 'Diagnóstico e Necessidades', content: 'Identificação dos desafios do cliente.' },
    { id: uuidv4(), type: 'solution_detail', title: 'Solução Personalizada', content: 'Detalhes dos serviços e entregas.' },
    { id: uuidv4(), type: 'goals', title: 'Metas e Indicadores de Sucesso', content: 'Definição de KPIs e objetivos.', details: [{ id: uuidv4(), metric: 'Aumento de Engajamento', target: '20%', indicator: 'Taxa de Engajamento' }] },
    { id: uuidv4(), type: 'timeline', title: 'Cronograma de Entregas', content: 'Etapas e prazos do projeto.', details: { steps: [{ id: uuidv4(), title: 'Kickoff', description: 'Reunião inicial' }] } },
    { id: uuidv4(), type: 'budget', title: 'Orçamento Detalhado', content: 'Investimento necessário.', details: [{ id: uuidv4(), service: 'Gestão de Social Media', description: 'Pacote mensal', price: 1500, recurrence: 'monthly' }] },
    { id: uuidv4(), type: 'portfolio', title: 'Portfólio e Casos de Sucesso', content: 'Apresentação de trabalhos anteriores.', details: { links: ['https://behance.net/gama'] } },
    { id: uuidv4(), type: 'cta', title: 'Próximos Passos', content: 'Clique para aceitar a proposta.' },
];

const SECTION_OPTIONS: { value: ProposalSectionType, label: string, icon: React.ElementType }[] = [
    { value: 'executive_summary', label: 'Resumo Executivo', icon: Briefcase },
    { value: 'problem_diagnosis', label: 'Diagnóstico', icon: MessageSquare },
    { value: 'solution_detail', label: 'Solução Detalhada', icon: FileText },
    { value: 'goals', label: 'Metas e KPIs', icon: Target },
    { value: 'timeline', label: 'Cronograma', icon: Clock },
    { value: 'budget', label: 'Orçamento', icon: DollarSign },
    { value: 'portfolio', label: 'Portfólio', icon: Edit },
    { value: 'cta', label: 'Chamada para Ação (CTA)', icon: CheckCircle },
];


export const ProposalForm: React.FC<ProposalFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { settings } = useAppSettings();
  
  const [title, setTitle] = useState(initialData?.title || 'Proposta Comercial - Novo Cliente');
  const [clientName, setClientName] = useState(initialData?.client_name || '');
  const [status, setStatus] = useState<ProposalStatus>(initialData?.status || 'Draft');
  const [sections, setSections] = useState<ProposalSection[]>(initialData?.sections || DEFAULT_SECTIONS);
  const [branding, setBranding] = useState<ProposalBranding>(initialData?.branding_config || {
    primaryColor: settings.logoLightUrl,
    secondaryColor: '#ccc',
    logoUrl: settings.logoLightUrl,
  });
  
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState(initialData?.ai_summary || '');
  
  // --- Funções de Edição de Seção ---
  
  const handleSectionChange = (id: string, key: keyof ProposalSection, value: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s));
  };
  
  const handleAddSection = (type: ProposalSectionType) => {
    const newSection: ProposalSection = {
        id: uuidv4(),
        type,
        title: SECTION_OPTIONS.find(o => o.value === type)?.label || 'Nova Seção',
        content: 'Descreva o conteúdo desta seção.',
        details: type === 'budget' ? [{ id: uuidv4(), service: 'Novo Serviço', description: 'Detalhes', price: 0, recurrence: 'monthly' }] : 
                 type === 'goals' ? [{ id: uuidv4(), metric: 'Nova Métrica', target: '0%', indicator: 'KPI' }] :
                 type === 'timeline' ? { steps: [{ id: uuidv4(), title: 'Nova Etapa', description: 'Descrição' }] } :
                 type === 'portfolio' ? { links: ['https://link-do-portfolio.com'] } : undefined,
    };
    setSections(prev => [...prev, newSection]);
  };
  
  const handleRemoveSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };
  
  // --- Funções de Edição de Detalhes (Orçamento/Metas) ---
  
  const handleDetailChange = (sectionId: string, detailId: string, key: string, value: any) => {
    setSections(prev => prev.map(s => {
        if (s.id !== sectionId || !s.details) return s;
        
        if (s.type === 'budget' || s.type === 'goals') {
            const updatedDetails = (s.details as (BudgetItem | GoalItem)[]).map(detail => {
                if (detail.id === detailId) {
                    return { ...detail, [key]: value };
                }
                return detail;
            });
            return { ...s, details: updatedDetails };
        }
        
        if (s.type === 'timeline') {
            const updatedSteps = (s.details.steps as any[]).map((step: any) => {
                if (step.id === detailId) {
                    return { ...step, [key]: value };
                }
                return step;
            });
            return { ...s, details: { ...s.details, steps: updatedSteps } };
        }
        
        if (s.type === 'portfolio' && key === 'links') {
            // Tratamento especial para links (que é um array)
            return { ...s, details: { links: value } };
        }
        
        return s;
    }));
  };
  
  const handleAddDetail = (sectionId: string) => {
    setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        
        if (s.type === 'budget') {
            const newBudget: BudgetItem = { id: uuidv4(), service: 'Novo Serviço', description: 'Detalhes', price: 0, recurrence: 'monthly' };
            return { ...s, details: [...(s.details as BudgetItem[] || []), newBudget] };
        }
        if (s.type === 'goals') {
            const newGoal: GoalItem = { id: uuidv4(), metric: 'Nova Métrica', target: '0%', indicator: 'KPI' };
            return { ...s, details: [...(s.details as GoalItem[] || []), newGoal] };
        }
        if (s.type === 'timeline') {
            const newStep = { id: uuidv4(), title: 'Nova Etapa', description: 'Descrição' };
            return { ...s, details: { steps: [...(s.details?.steps || []), newStep] } };
        }
        return s;
    }));
  };
  
  const handleRemoveDetail = (sectionId: string, detailId: string) => {
    setSections(prev => prev.map(s => {
        if (s.id !== sectionId || !s.details) return s;
        
        if (s.type === 'budget' || s.type === 'goals') {
            const updatedDetails = (s.details as (BudgetItem | GoalItem)[]).filter(detail => detail.id !== detailId);
            return { ...s, details: updatedDetails };
        }
        if (s.type === 'timeline') {
            const updatedSteps = (s.details.steps as any[]).filter((step: any) => step.id !== detailId);
            return { ...s, details: { ...s.details, steps: updatedSteps } };
        }
        return s;
    }));
  };
  
  // --- Lógica de IA ---
  
  const handleGenerateAiSummary = async () => {
    if (!settings.aiSummaryConfig.isEnabled || !settings.aiSummaryConfig.apiKey) {
        showError("Ative o Resumo Diário por IA e forneça a chave de API nas Configurações do App.");
        return;
    }
    
    if (!clientName.trim()) {
        showError("Preencha o nome do cliente antes de gerar o resumo.");
        return;
    }
    
    setIsGeneratingAi(true);
    const toastId = showLoading("Gerando resumo executivo por IA...");
    
    try {
        const prompt = `Gere um resumo executivo persuasivo e profissional para a proposta comercial "${title}" para o cliente "${clientName}". O resumo deve ter no máximo 3 parágrafos curtos e focar no valor, nos problemas que a Gama Creative resolve e na chamada para ação.
        
        --- Estrutura da Proposta ---
        ${sections.map(s => `${s.title}: ${s.content.substring(0, 100)}...`).join('\n')}
        
        Gere apenas o texto do resumo.`;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Usuário não autenticado.");

        const response = await fetch('https://lgxexrjpemietutfalbp.supabase.co/functions/v1/ai-summary-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                provider: settings.aiSummaryConfig.provider,
                apiKey: settings.aiSummaryConfig.apiKey,
                prompt: prompt,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falha ao gerar resumo via IA.');
        }
        
        setAiSummary(result.summary);
        
        // Atualiza a seção de resumo executivo com o texto gerado
        setSections(prev => prev.map(s => 
            s.type === 'executive_summary' ? { ...s, content: result.summary } : s
        ));
        
        showSuccess('Resumo executivo gerado e inserido na proposta!');
        
    } catch (err) {
        showError(`Falha na geração de IA: ${err.message}`);
    } finally {
        dismissToast(toastId);
        setIsGeneratingAi(false);
    }
  };
  
  // --- Submissão ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !clientName.trim()) {
      showError('Título e Nome do Cliente são obrigatórios.');
      return;
    }
    
    const proposalData: Omit<SalesProposal, 'user_id' | 'created_at' | 'public_link_id'> & { id?: string } = {
      id: initialData?.id,
      title: title.trim(),
      client_name: clientName.trim(),
      status,
      sections,
      branding_config: branding,
      ai_summary: aiSummary || undefined,
    };

    onSubmit(proposalData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      
      {/* Configurações Básicas e Branding (Componente Modular) */}
      <ProposalBrandingForm
        title={title}
        clientName={clientName}
        status={status}
        branding={branding}
        isSubmitting={isSubmitting}
        onTitleChange={setTitle}
        onClientNameChange={setClientName}
        onStatusChange={setStatus}
        onBrandingChange={setBranding}
      />
      
      {/* Editor de Seções */}
      <h3 className="text-xl font-bold mt-4 border-b pb-2">Conteúdo da Proposta</h3>
      
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/50">
        <span className="text-sm font-medium self-center mr-2">Adicionar Seção:</span>
        {SECTION_OPTIONS.map(opt => (
            <Button 
                key={opt.value}
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => handleAddSection(opt.value)}
                disabled={isSubmitting}
            >
                <opt.icon className="h-4 w-4 mr-1" /> {opt.label}
            </Button>
        ))}
      </div>

      {sections.map((section) => (
        <ProposalSectionEditor
            key={section.id}
            section={section}
            brandingColor={branding.primaryColor}
            isSubmitting={isSubmitting}
            onSectionChange={handleSectionChange}
            onRemoveSection={handleRemoveSection}
            onGenerateAiSummary={handleGenerateAiSummary}
            onDetailChange={handleDetailChange}
            onAddDetail={handleAddDetail}
            onRemoveDetail={handleRemoveDetail}
            isGeneratingAi={isGeneratingAi}
        />
      ))}

      <div className="flex justify-end pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600 ml-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar Proposta
        </Button>
      </div>
    </form>
  );
};