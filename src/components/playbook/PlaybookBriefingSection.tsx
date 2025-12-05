import React, { useState, useEffect } from 'react';
import { usePlaybookContent } from "@/hooks/use-playbook-content";
import { useSession } from "@/components/SessionContextProvider";
import { PlaybookContentSkeleton } from "@/components/playbook/PlaybookContentSkeleton";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Loader2, Save, AlertTriangle } from "lucide-react";
import { BriefingFormRenderer } from '../briefings/BriefingFormRenderer'; // Reutilizando o renderer de briefing
import { BriefingForm, BriefingResponse } from '@/types/briefing';
import { Button } from '@/components/ui/button';

interface PlaybookBriefingSectionProps {
    clientId: string;
}

/**
 * Valida e sanitiza os campos de um template de briefing.
 * A principal causa do erro `Select.Item` é uma opção com `value` vazio.
 * Esta função garante que isso não aconteça antes de renderizar.
 */
const sanitizeBriefingFields = (fields: BriefingForm['fields']): BriefingForm['fields'] => {
  return fields.map(field => {
    if (field.options && (field.type === 'dropdown' || field.type === 'select_single' || field.type === 'select_multiple')) {
      const sanitizedOptions = field.options.map(opt => {
        // Se o valor da opção for nulo, indefinido ou uma string vazia,
        // usamos o ID único da opção como um fallback seguro.
        if (opt.value === null || opt.value === undefined || opt.value.trim() === '') {
          return { ...opt, value: opt.id };
        }
        return opt;
      });
      return { ...field, options: sanitizedOptions };
    }
    return field;
  });
};


export const PlaybookBriefingSection: React.FC<PlaybookBriefingSectionProps> = ({ clientId }) => {
    const SECTION_NAME = 'briefing';
    const { content, updateContent, isLoading, isSaving } = usePlaybookContent(clientId, SECTION_NAME);
    const { userRole } = useSession();
    const isAdmin = userRole === 'admin';

    const [briefingForm, setBriefingForm] = useState<BriefingForm | null>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    useEffect(() => {
      if (content) {
        try {
          // O conteúdo da seção 'briefing' deve ser um BriefingForm completo
          const formContent = content.content as BriefingForm;
          if (!formContent || !formContent.fields) {
            throw new Error("O formulário de briefing associado a este cliente está vazio ou corrompido.");
          }
          
          // **ETAPA CRÍTICA DE VALIDAÇÃO**
          const sanitizedFields = sanitizeBriefingFields(formContent.fields);
          const sanitizedForm = { ...formContent, fields: sanitizedFields };
          
          setBriefingForm(sanitizedForm);
          
          // Carrega as respostas salvas, se houver (do campo briefing_responses do playbook_content)
          // Pega a última resposta se houver múltiplas
          const lastResponseEntry = content.briefing_responses?.[content.briefing_responses.length - 1];
          if (lastResponseEntry) {
            const formattedResponses: Record<string, any> = {};
            lastResponseEntry.responses.forEach(res => {
              formattedResponses[res.questionId] = res.answer;
            });
            setResponses(formattedResponses);
          } else {
            setResponses({});
          }
          setError(null);

        } catch (e) {
          console.error("Erro ao processar o formulário de briefing:", e);
          setError("Falha ao carregar o formulário de briefing. O formato dos dados parece estar incorreto.");
          setBriefingForm(null);
        }
      }
    }, [content]);

    const handleFieldChange = (fieldId: string, value: any) => {
      setResponses(prev => ({
        ...prev,
        [fieldId]: value,
      }));
    };

    const handleSaveResponses = async (submittedResponses: Omit<BriefingResponse, 'id' | 'submitted_at' | 'client_id'>) => {
      if (!content || !briefingForm) {
        showError("Não há conteúdo para salvar.");
        return;
      }
      setIsSubmittingResponse(true);

      try {
        const newBriefingResponseEntry = {
          blockId: briefingForm.id, // Usamos o ID do formulário como blockId
          responses: Object.entries(submittedResponses.response_data).map(([questionId, answer]) => ({ questionId, answer })),
          submittedAt: new Date().toISOString(),
        };

        const updatedBriefingResponses = [...(content.briefing_responses || []), newBriefingResponseEntry];

        // Salva o conteúdo do formulário e as respostas no playbook_content
        await saveContent(SECTION_NAME, content.content, updatedBriefingResponses);
        showSuccess("Respostas do briefing salvas com sucesso!");
      } catch (e) {
        showError(`Erro ao salvar respostas: ${e.message}`);
      } finally {
        setIsSubmittingResponse(false);
      }
    };

    if (isLoading) {
        return <PlaybookContentSkeleton />;
    }

    if (error) {
        return (
            <Card className="m-4 border-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center text-red-500">
                        <AlertTriangle className="h-5 w-5 mr-2" /> Erro no Briefing
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Por favor, verifique a configuração do formulário de briefing associado a este cliente no painel de administração.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!briefingForm) {
        return (
            <Card className="m-4">
                <CardHeader>
                    <CardTitle>Briefing do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Nenhum formulário de briefing foi associado a este cliente ainda.</p>
                    {isAdmin && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Você pode configurar um formulário na seção "Briefings" do painel de administração e associá-lo a este cliente.
                      </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{briefingForm.title}</h2>
                    <p className="text-muted-foreground">{briefingForm.description}</p>
                </div>
                {/* O botão de salvar agora está dentro do BriefingFormRenderer */}
            </div>

            <div className="space-y-8">
                <BriefingFormRenderer
                    form={briefingForm}
                    onSubmitResponse={handleSaveResponses}
                    isSubmitting={isSubmittingResponse || isSaving}
                    initialResponses={responses} // Passa as respostas existentes
                />
            </div>
        </div>
    );
};