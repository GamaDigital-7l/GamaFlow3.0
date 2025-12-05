import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2, Edit, Brain, DollarSign, Target, Clock, MessageSquare, X, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProposalSection, ProposalSectionType, ProposalBranding, BudgetItem, GoalItem } from '@/types/proposal';
import { Separator } from '@/components/ui/separator';
import ProposalDetailEditor from './ProposalDetailEditor';
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando o novo componente

interface ProposalSectionEditorProps {
  section: ProposalSection;
  brandingColor: string;
  isSubmitting: boolean;
  onSectionChange: (id: string, key: keyof ProposalSection, value: any) => void;
  onRemoveSection: (id: string) => void;
  onGenerateAiSummary: () => void;
  onDetailChange: (sectionId: string, detailId: string, key: string, value: any) => void;
  onAddDetail: (sectionId: string) => void;
  onRemoveDetail: (sectionId: string, detailId: string) => void;
  isGeneratingAi: boolean;
}

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

export const ProposalSectionEditor: React.FC<ProposalSectionEditorProps> = ({
  section,
  brandingColor,
  isSubmitting,
  onSectionChange,
  onRemoveSection,
  onGenerateAiSummary,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
  isGeneratingAi,
}) => {
  
  const isDetailSection = ['budget', 'goals', 'timeline', 'portfolio'].includes(section.type);

  return (
    <Card className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: brandingColor }}>
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-3 w-full">
          {/* HorizontalRadioSelect para Tipo de Seção */}
          <HorizontalRadioSelect
              label="Tipo de Seção"
              options={SECTION_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
              value={section.type}
              onValueChange={(value) => onSectionChange(section.id, 'type', value as ProposalSectionType)}
              disabled={isSubmitting}
          />
          
          <Input
            value={section.title}
            onChange={(e) => onSectionChange(section.id, 'title', e.target.value)}
            placeholder="Título da Seção"
            className="font-semibold"
            disabled={isSubmitting}
          />
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveSection(section.id)} disabled={isSubmitting} className="flex-shrink-0">
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
          onChange={(e) => onSectionChange(section.id, 'content', e.target.value)}
          rows={section.type === 'executive_summary' ? 4 : 6}
          placeholder="Descreva o conteúdo desta seção. Use **negrito** e *itálico*."
          disabled={isSubmitting}
        />
      </div>

      {/* Botão de IA para Resumo Executivo */}
      {section.type === 'executive_summary' && (
        <Button
          type="button"
          onClick={onGenerateAiSummary}
          variant="outline"
          className="w-full border-dyad-500 text-dyad-500 hover:bg-dyad-50"
          disabled={isSubmitting || isGeneratingAi}
        >
          {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
          Gerar Resumo Executivo por IA
        </Button>
      )}

      {/* Detalhes Específicos (Orçamento, Metas, Cronograma) */}
      {isDetailSection && (
        <ProposalDetailEditor
          section={section}
          onDetailChange={onDetailChange}
          onAddDetail={onAddDetail}
          onRemoveDetail={onRemoveDetail}
          isSubmitting={isSubmitting}
        />
      )}
    </Card>
  );
};