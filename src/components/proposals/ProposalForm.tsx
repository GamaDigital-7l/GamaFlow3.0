import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2, Edit, Brain, DollarSign, Target, Clock, MessageSquare, X, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesProposal, ProposalStatus, ProposalSection, ProposalSectionType, ProposalBranding, BudgetItem, GoalItem } from '@/types/proposal';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/use-app-settings';
import { supabase } from '@/integrations/supabase/client';

interface ProposalFormProps {
  initialData?: SalesProposal;
  onSubmit: (proposal: Omit<SalesProposal, 'user_id' | 'created_at' | 'public_link_id'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DEFAULT_SECTIONS: ProposalSection[] = [
    { id: 's1', type: 'executive_summary', title: 'Resumo Executivo', content: 'Apresentação da agência e proposta de valor.' },
    { id: 's2', type: 'problem_diagnosis', title: 'Diagnóstico e Necessidades', content: 'Identificação dos desafios do cliente.' },
    { id: 's3', type: 'solution_detail', title: 'Solução Personalizada', content: 'Detalhes dos serviços e entregas.' },
    { id: 's4', type: 'goals', title: 'Metas e Indicadores de Sucesso', content: 'Definição de KPIs e objetivos.', details: [{ id: 'g1', metric: 'Aumento de Engajamento', target: '20%', indicator: 'Taxa de Engajamento' }] },
    { id: 's5', type: 'timeline', title: 'Cronograma de Entregas', content: 'Etapas e prazos do projeto.', details: { steps: [{ id: 't1', title: 'Kickoff', description: 'Reunião inicial' }] } },
    { id: 's6', type: 'budget', title: 'Orçamento Detalhado', content: 'Investimento necessário.', details: [{ id: 'b1', service: 'Gestão de Social Media', description: 'Pacote mensal', price: 1500, recurrence: 'monthly' }] },
    { id: 's7', type: 'portfolio', title: 'Portfólio e Casos de Sucesso', content: 'Apresentação de trabalhos anteriores.', details: { links: ['https://behance.net/gama'] } },
    { id: 's8', type: 'cta', title: 'Próximos Passos', content: 'Clique para aceitar a proposta.' },
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
        id: Date.now().toString(),
        type,
        title: SECTION_OPTIONS.find(o => o.value === type)?.label || 'Nova Seção',
        content: 'Descreva o conteúdo desta seção.',
        details: type === 'budget' ? [{ id: 'b1', service: 'Gestão de Social Media', description: 'Pacote mensal', price: 1500, recurrence: 'monthly' }] : 
                 type === 'goals' ? [{ id: 'g1', metric: 'Aumento de Engajamento', target: '20%', indicator: 'Taxa de Engajamento' }] :
                 type === 'timeline' ? { steps: [{ id: 't1', title: 'Kickoff', description: 'Reunião inicial' }] } :
                 type === 'portfolio' ? { links: [''] } : undefined,
    };
    setSections(prev => [...prev, newSection]);
  };
  
  const handleRemoveSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };
  
  // --- Funções de Edição de Detalhes (Orçamento/Metas) ---
  
  const handleDetailChange = (sectionId: string, detailId: string, key: keyof BudgetItem | keyof GoalItem | 'title' | 'description', value: any) => {
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
        
        return s;
    }));
  };
  
  const handleAddDetail = (sectionId: string) => {
    setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        
        if (s.type === 'budget') {
            const newBudget: BudgetItem = { id: Date.now().toString(), service: 'Novo Serviço', description: 'Detalhes', price: 0, recurrence: 'monthly' };
            return { ...s, details: [...(s.details as BudgetItem[] || []), newBudget] };
        }
        if (s.type === 'goals') {
            const newGoal: GoalItem = { id: Date.now().toString(), metric: 'Nova Métrica', target: '0%', indicator: 'KPI' };
            return { ...s, details: [...(s.details as GoalItem[] || []), newGoal] };
        }
        if (s.type === 'timeline') {
            const newStep = { id: Date.now().toString(), title: 'Nova Etapa', description: 'Descrição' };
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
    
    setIsGeneratingAi(true);
    const toastId = showLoading("Gerando resumo executivo por IA...");
    
    try {
        const prompt = `Gere um resumo executivo persuasivo e profissional para a proposta comercial "${title}" para o cliente "${clientName}". O resumo deve ter no máximo 3 parágrafos curtos e focar no valor, nos problemas que a Gama Creative resolve e na chamada para ação.
        
        --- Estrutura da Proposta ---
        ${sections.map(s => `${s.title}: ${s.content.substring(0, 100)}...`).join('\n')}
        
        Gere apenas o texto do resumo.`;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Usuário não autenticado.");

        const response = await fetch('https://cxntiszohzgntyhbagga.supabase.co/functions/v1/ai-summary-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                tasksCompleted: [], // Não relevante para este prompt
                tasksPending: [], // Não relevante para este prompt
                provider: settings.aiSummaryConfig.provider,
                apiKey: settings.aiSummaryConfig.apiKey,
                prompt: prompt, // Passando o prompt diretamente
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
  
  // --- Renderização de Detalhes de Seção ---
  
  const renderSectionDetails = (section: ProposalSection) => {
    const isDetailSubmitting = isSubmitting || isGeneratingAi;
    
    switch (section.type) {
        case 'budget':
            const budgetItems = section.details as BudgetItem[] || [];
            return (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Itens de Orçamento</h4>
                    {budgetItems.map((item, index) => (
                        <Card key={item.id} className="p-3 flex items-center space-x-2">
                            <Input 
                                value={item.service} 
                                onChange={(e) => handleDetailChange(section.id, item.id, 'service', e.target.value)}
                                placeholder="Serviço"
                                disabled={isDetailSubmitting}
                                className="w-1/3"
                            />
                            <Input 
                                value={item.price} 
                                type="number"
                                step="0.01"
                                onChange={(e) => handleDetailChange(section.id, item.id, 'price', parseFloat(e.target.value))}
                                placeholder="Preço"
                                disabled={isDetailSubmitting}
                                className="w-1/6"
                            />
                            <Select 
                                value={item.recurrence} 
                                onValueChange={(value) => handleDetailChange(section.id, item.id, 'recurrence', value)}
                                disabled={isDetailSubmitting}
                            >
                                <SelectTrigger><SelectValue placeholder="Recorrência" /></SelectTrigger> {/* Adicionado placeholder */}
                                <SelectContent>
                                    <SelectItem value="monthly">Mensal</SelectItem>
                                    <SelectItem value="one-time">Única</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input 
                                value={item.description} 
                                onChange={(e) => handleDetailChange(section.id, item.id, 'description', e.target.value)}
                                placeholder="Descrição"
                                disabled={isDetailSubmitting}
                                className="flex-grow"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetail(section.id, item.id)} disabled={isDetailSubmitting}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddDetail(section.id)} disabled={isDetailSubmitting}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                    </Button>
                </div>
            );
        case 'goals':
            const goals = section.details as GoalItem[] || [];
            return (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Metas e KPIs</h4>
                    {goals.map((item, index) => (
                        <Card key={item.id} className="p-3 flex items-center space-x-2">
                            <Input 
                                value={item.metric} 
                                onChange={(e) => handleDetailChange(section.id, item.id, 'metric', e.target.value)}
                                placeholder="Métrica (Ex: Engajamento)"
                                disabled={isDetailSubmitting}
                                className="w-1/3"
                            />
                            <Input 
                                value={item.target} 
                                onChange={(e) => handleDetailChange(section.id, item.id, 'target', e.target.value)}
                                placeholder="Alvo (Ex: 20%)"
                                disabled={isDetailSubmitting}
                                className="w-1/4"
                            />
                            <Input 
                                value={item.indicator} 
                                onChange={(e) => handleDetailChange(section.id, item.id, 'indicator', e.target.value)}
                                placeholder="Indicador (Ex: Taxa de Conversão)"
                                disabled={isDetailSubmitting}
                                className="flex-grow"
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetail(section.id, item.id)} disabled={isDetailSubmitting}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddDetail(section.id)} disabled={isDetailSubmitting}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Meta
                    </Button>
                </div>
            );
        case 'timeline':
            const steps = section.details?.steps || [];
            return (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Etapas do Cronograma</h4>
                    {steps.map((step: any, index: number) => (
                        <Card key={step.id} className="p-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Input 
                                    value={step.title} 
                                    onChange={(e) => handleDetailChange(section.id, step.id, 'title', e.target.value)}
                                    placeholder="Título da Etapa"
                                    disabled={isDetailSubmitting}
                                    className="flex-grow font-medium"
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDetail(section.id, step.id)} disabled={isDetailSubmitting}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                            <Textarea 
                                value={step.description} 
                                onChange={(e) => handleDetailChange(section.id, step.id, 'description', e.target.value)}
                                placeholder="Descrição da etapa"
                                rows={2}
                                disabled={isDetailSubmitting}
                            />
                        </Card>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAddDetail(section.id)} disabled={isDetailSubmitting}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar Etapa
                    </Button>
                </div>
            );
        case 'portfolio':
            const links = section.details?.links || [];
            const [newLink, setNewLink] = useState('');
            
            const handleAddLink = () => {
                if (newLink.trim()) {
                    setSections(prev => prev.map(s => {
                        if (s.id !== section.id) return s;
                        return { ...s, details: { links: [...(s.details?.links || []), newLink.trim()] } };
                    }));
                    setNewLink('');
                }
            };
            
            const handleRemoveLink = (linkToRemove: string) => {
                setSections(prev => prev.map(s => {
                    if (s.id !== section.id) return s;
                    return { ...s, details: { links: (s.details?.links || []).filter((link: string) => link !== linkToRemove) } };
                }));
            };
            
            return (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold">Links de Portfólio</h4>
                    {links.map((link: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                            <Input value={link} readOnly className="bg-muted/50" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(link)} disabled={isDetailSubmitting}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex space-x-2">
                        <Input 
                            value={newLink} 
                            onChange={(e) => setNewLink(e.target.value)} 
                            placeholder="Adicionar link (URL)"
                            disabled={isDetailSubmitting}
                        />
                        <Button type="button" onClick={handleAddLink} size="icon" disabled={isDetailSubmitting || !newLink.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            );
        default:
            return null;
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
      
      {/* Configurações Básicas */}
      <Card className="p-4 space-y-4">
        <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl">Informações Básicas</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Proposta</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} required disabled={isSubmitting} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ProposalStatus)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger> {/* Adicionado placeholder */}
                    <SelectContent>
                        <SelectItem value="Draft">Rascunho</SelectItem>
                        <SelectItem value="Sent">Enviada</SelectItem>
                        <SelectItem value="Accepted">Aceita</SelectItem>
                        <SelectItem value="Rejected">Rejeitada</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="primaryColor">Cor Primária (Branding)</Label>
                <Input 
                    id="primaryColor" 
                    type="color" 
                    value={branding.primaryColor} 
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    disabled={isSubmitting}
                />
            </div>
        </div>
      </Card>
      
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

      {sections.map((section, index) => (
        <Card key={section.id} className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: branding.primaryColor }}>
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Select 
                        value={section.type} 
                        onValueChange={(value) => handleSectionChange(section.id, 'type', value as ProposalSectionType)}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Tipo de Seção" /> {/* Adicionado placeholder */}
                        </SelectTrigger>
                        <SelectContent>
                            {SECTION_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input 
                        value={section.title} 
                        onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                        placeholder="Título da Seção"
                        className="font-semibold"
                        disabled={isSubmitting}
                    />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSection(section.id)} disabled={isSubmitting}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
            
            <Separator />
            
            {/* Conteúdo Principal */}
            <div className="grid gap-2">
                <Label htmlFor={`content-${section.id}`}>Conteúdo (Markdown Simples)</Label>
                <Textarea 
                    id={`content-${section.id}`}
                    value={section.content} 
                    onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
                    rows={section.type === 'executive_summary' ? 4 : 6}
                    placeholder="Descreva o conteúdo desta seção. Use **negrito** e *itálico*."
                    disabled={isSubmitting}
                />
            </div>
            
            {/* Botão de IA para Resumo Executivo */}
            {section.type === 'executive_summary' && (
                <Button 
                    type="button" 
                    onClick={handleGenerateAiSummary} 
                    variant="outline"
                    className="w-full border-dyad-500 text-dyad-500 hover:bg-dyad-50"
                    disabled={isSubmitting || isGeneratingAi || !clientName.trim()}
                >
                    {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
                    Gerar Resumo Executivo por IA
                </Button>
            )}
            
            {/* Detalhes Específicos (Orçamento, Metas, Cronograma) */}
            {renderSectionDetails(section)}
        </Card>
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