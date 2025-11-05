import React, { useState, useEffect } from 'react';
import { OnboardingBlock, OnboardingBlockType, BriefingQuestion, PlaybookFile, BriefingResponseEntry } from '@/types/playbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, Send, CheckCircle, FileText } from 'lucide-react';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload';
import { showSuccess, showError } from '@/utils/toast';
import { BriefingQuestionRenderer } from './BriefingQuestionRenderer'; // Importando o novo componente
import { cn } from '@/lib/utils';

interface OnboardingBlockRendererProps {
  blocks: OnboardingBlock[];
  clientId: string;
  // Prop para arquivos já enviados (para exibir no modo de visualização)
  existingUploadedFiles?: PlaybookFile[]; 
  // Prop para respostas de briefing já enviadas
  existingBriefingResponses?: BriefingResponseEntry[];
  // Callback para quando um upload é concluído pelo cliente
  onUploadComplete?: (blockId: string, fileUrl: string, fileName: string, fileType: string) => void;
  // Callback para quando um formulário de briefing é submetido pelo cliente
  onBriefingSubmit?: (blockId: string, responses: { questionId: string; answer: string | string[]; }[]) => void;
}

export const OnboardingBlockRenderer: React.FC<OnboardingBlockRendererProps> = ({
  blocks,
  clientId,
  existingUploadedFiles = [],
  existingBriefingResponses = [],
  onUploadComplete,
  onBriefingSubmit,
}) => {
  const { uploadFile, isUploading } = usePlaybookUpload(clientId);
  
  // Estado para armazenar as respostas de cada formulário de briefing
  const [briefingResponses, setBriefingResponses] = useState<Record<string, any>>({});
  // Estado para controlar se um formulário de briefing já foi enviado
  const [formSubmittedStatus, setFormSubmittedStatus] = useState<Record<string, boolean>>({});

  // Sincroniza o estado local com as respostas existentes
  useEffect(() => {
    const initialResponses: Record<string, any> = {};
    const initialSubmittedStatus: Record<string, boolean> = {};

    existingBriefingResponses.forEach(entry => {
      initialSubmittedStatus[entry.blockId] = true; // Marca como já submetido
      entry.responses.forEach(res => {
        initialResponses[entry.blockId] = {
          ...(initialResponses[entry.blockId] || {}),
          [res.questionId]: res.answer,
        };
      });
    });
    setBriefingResponses(initialResponses);
    setFormSubmittedStatus(initialSubmittedStatus);
  }, [existingBriefingResponses]);


  const handleFileUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadResult = await uploadFile(file);
      if (uploadResult && onUploadComplete) {
        onUploadComplete(blockId, uploadResult.url, file.name, uploadResult.type);
      }
    }
  };

  const handleBriefingQuestionChange = (blockId: string, questionId: string, value: any) => {
    setBriefingResponses(prev => ({
      ...prev,
      [blockId]: {
        ...(prev[blockId] || {}),
        [questionId]: value,
      },
    }));
  };

  const handleBriefingFormSubmit = async (blockId: string, questions: BriefingQuestion[]) => {
    // Validação
    const currentResponses = briefingResponses[blockId] || {};
    const invalidQuestions = questions.filter(q => q.required && (!currentResponses[q.id] || (Array.isArray(currentResponses[q.id]) && currentResponses[q.id].length === 0)));

    if (invalidQuestions.length > 0) {
      showError(`Por favor, preencha todos os campos obrigatórios (${invalidQuestions.length} pendentes).`);
      return;
    }

    const formattedResponses = questions.map(q => ({
      questionId: q.id,
      answer: currentResponses[q.id] || null,
    }));

    if (onBriefingSubmit) {
      await onBriefingSubmit(blockId, formattedResponses);
      setFormSubmittedStatus(prev => ({ ...prev, [blockId]: true }));
      showSuccess("Respostas do briefing enviadas com sucesso!");
    }
  };

  return (
    <div className="space-y-8">
      {blocks.map((block) => (
        <Card key={block.id} className="p-6 shadow-sm">
          {block.type === OnboardingBlockType.Title && (
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{block.data.title}</CardTitle>
            </CardHeader>
          )}

          {block.type === OnboardingBlockType.Text && (
            <CardContent>
              <p className="text-muted-foreground">{block.data.content}</p>
            </CardContent>
          )}

          {block.type === OnboardingBlockType.FileUpload && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">{block.data.title}</h3>
              <p className="text-muted-foreground">{block.data.description}</p>
              <Input
                type="file"
                multiple={block.data.maxFiles && block.data.maxFiles > 1}
                accept={block.data.allowedFileTypes?.join(',')}
                onChange={(e) => handleFileUpload(block.id, e)}
                disabled={isUploading}
                className="file:text-dyad-500 file:font-medium"
              />
              {isUploading && <Loader2 className="h-5 w-5 animate-spin text-dyad-500" />}
              
              {/* Exibir arquivos já enviados para este bloco */}
              {existingUploadedFiles.filter(f => f.blockId === block.id).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Arquivos Enviados:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {existingUploadedFiles.filter(f => f.blockId === block.id).map((file, index) => (
                      <li key={index}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {file.name}
                        </a> ({file.uploadedBy === 'client' ? 'Cliente' : 'Admin'})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}

          {block.type === OnboardingBlockType.BriefingForm && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="h-5 w-5 text-dyad-500" />
                <span>{block.data.formTitle}</span>
              </h3>
              <p className="text-muted-foreground">{block.data.formDescription}</p>
              
              {formSubmittedStatus[block.id] ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Formulário enviado!</p>
                  <p className="text-muted-foreground">Agradecemos suas respostas.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleBriefingFormSubmit(block.id, block.data.questions || []); }} className="space-y-6">
                  {(block.data.questions || []).map((question) => (
                    <BriefingQuestionRenderer
                      key={question.id}
                      question={question}
                      value={briefingResponses[block.id]?.[question.id]}
                      onChange={(value) => handleBriefingQuestionChange(block.id, question.id, value)}
                      readOnly={isUploading} // Desabilita enquanto o upload está em andamento
                    />
                  ))}
                  <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUploading}>
                    <Send className="h-4 w-4 mr-2" /> Enviar Respostas
                  </Button>
                </form>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};