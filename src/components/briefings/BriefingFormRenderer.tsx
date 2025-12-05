import React, { useState, useMemo, useEffect } from 'react';
import { BriefingForm, BriefingField, BriefingResponse } from '@/types/briefing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import BriefingFieldRenderer from './BriefingFieldRenderer';
import { showSuccess, showError } from '@/utils/toast';

interface BriefingFormRendererProps {
  form: BriefingForm;
  // Simulação de submissão de resposta
  onSubmitResponse: (response: Omit<BriefingResponse, 'id' | 'submitted_at' | 'client_id'>) => void;
  isSubmitting: boolean;
  initialResponses?: Record<string, any>; // Novo: para carregar respostas existentes
}

export const BriefingFormRenderer: React.FC<BriefingFormRendererProps> = ({ form, onSubmitResponse, isSubmitting, initialResponses = {} }) => {
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sincroniza as respostas iniciais quando o formulário ou as respostas mudam
  useEffect(() => {
    setResponses(initialResponses);
    setIsSubmitted(false); // Resetar status de submissão ao carregar novas respostas/formulário
  }, [form, initialResponses]);


  // Filtra campos que não são apenas informativos (section/description)
  const interactiveFields = useMemo(() => {
    return form.fields.filter(f => f.type !== 'section' && f.type !== 'description');
  }, [form.fields]);
  
  // Campos visíveis (após aplicar lógica condicional)
  const visibleFields = useMemo(() => {
    return form.fields.filter(field => {
        const logic = field.conditionalLogic;
        if (!logic) return true;
        
        const targetValue = responses[logic.fieldId];
        if (targetValue === undefined) return false;
        
        const expected = Array.isArray(logic.expectedValue) ? logic.expectedValue : [logic.expectedValue];
        
        if (Array.isArray(targetValue)) {
            return targetValue.some(v => expected.includes(v));
        }
        return expected.includes(targetValue);
    });
  }, [form.fields, responses]);

  // Campos que precisam ser validados (visíveis e obrigatórios)
  const fieldsToValidate = useMemo(() => {
    return visibleFields.filter(f => f.isRequired);
  }, [visibleFields]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };
  
  // Validação de um único campo (usado no modo Typeform)
  const validateField = (field: BriefingField, value: any): boolean => {
    if (!field.isRequired) return true;
    
    if (field.type === 'select_multiple') {
        return Array.isArray(value) && value.length > 0;
    }
    
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        return false;
    }
    return true;
  };

  const handleNextPage = () => {
    if (form.displayMode === 'typeform') {
        // No modo Typeform, validamos apenas o campo atual (se for interativo)
        const currentField = visibleFields[currentPage];
        if (currentField && currentField.type !== 'section' && currentField.type !== 'description') {
            if (!validateField(currentField, responses[currentField.id])) {
                showError(`Por favor, preencha o campo obrigatório: ${currentField.label}`);
                return;
            }
        }
    }
    
    // A navegação deve parar no último índice (visibleFields.length - 1)
    if (currentPage < visibleFields.length - 1) { 
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação final (apenas campos visíveis e obrigatórios)
    const invalidFields = fieldsToValidate.filter(f => !validateField(f, responses[f.id]));
    
    if (invalidFields.length > 0) {
        showError(`Por favor, preencha todos os campos obrigatórios (${invalidFields.length} pendentes).`);
        // No modo Typeform, move para o primeiro campo inválido
        if (form.displayMode === 'typeform') {
            const firstInvalidIndex = visibleFields.findIndex(f => f.id === invalidFields[0].id);
            if (firstInvalidIndex !== -1) {
                setCurrentPage(firstInvalidIndex);
            }
        }
        return;
    }
    
    // Filtra apenas as respostas dos campos interativos
    const responseData = interactiveFields.reduce((acc, field) => {
        if (responses[field.id] !== undefined) {
            acc[field.id] = responses[field.id];
        }
        return acc;
    }, {} as Record<string, any>);

    await onSubmitResponse({
      form_id: form.id,
      response_data: responseData,
    });
    
    // Marca como submetido após o sucesso da submissão
    setIsSubmitted(true);
  };
  
  if (isSubmitted) {
    return (
        <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Formulário Enviado com Sucesso!</h3>
            <p className="text-muted-foreground mt-2">A equipe Gama Creative agradece suas respostas.</p>
            <Button onClick={() => window.close()} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
                Fechar
            </Button>
        </div>
    );
  }

  const progressPercentage = form.displayMode === 'typeform' 
    ? Math.round(((currentPage + 1) / visibleFields.length) * 100)
    : 0;
    
  const currentField = visibleFields[currentPage];
  const isLastPage = currentPage === visibleFields.length - 1;
  
  // Renderização do Modo Página Única
  if (form.displayMode === 'page') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-xl font-semibold border-b pb-2">Preenchimento Rápido</h3>
        
        {visibleFields.map((field) => (
          <BriefingFieldRenderer
            key={field.id}
            field={field}
            value={responses[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            allResponses={responses}
          />
        ))}
        
        <Separator />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar Respostas
          </Button>
        </div>
      </form>
    );
  }
  
  // Renderização do Modo Typeform
  return (
    <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
      
      {/* Barra de Progresso */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Pergunta {currentPage + 1} de {visibleFields.length}</p>
        <Progress value={progressPercentage} className="h-2" indicatorClassName="bg-dyad-500" />
      </div>
      
      {/* Campo Atual (Typeform) - Centralizado e Focado */}
      <Card className="flex-grow p-6 md:p-12 shadow-xl flex items-center justify-center min-h-[300px]">
        <CardContent className="p-0 w-full max-w-lg">
          {currentField ? (
            <BriefingFieldRenderer
              field={currentField}
              value={responses[currentField.id]}
              onChange={(value) => handleFieldChange(currentField.id, value)}
              allResponses={responses}
            />
          ) : (
            <p className="text-center text-muted-foreground">Nenhum campo para exibir.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Controles de Navegação */}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handlePrevPage} 
          disabled={currentPage === 0 || isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
        </Button>
        
        {isLastPage ? (
          <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar Respostas
          </Button>
        ) : (
          <Button type="button" onClick={handleNextPage} className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
            Próximo <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </form>
  );
};