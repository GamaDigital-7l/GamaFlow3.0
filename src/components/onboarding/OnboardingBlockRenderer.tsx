import React, { useState, useEffect } from 'react';
import { OnboardingBlock, OnboardingBlockType, BriefingQuestion, PlaybookFile, BriefingResponseEntry } from '@/types/playbook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Link as LinkIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { BriefingQuestionRenderer } from './BriefingQuestionRenderer'; // Importando o novo componente
import { Card, CardContent } from '@/components/ui/card';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="space-y-6">
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
                disabled={isSubmitting}
                className="file:text-dyad-500 file:font-medium"
              />
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin text-dyad-500" />}
              
              {/* Exibir arquivos já enviados para este bloco */}
              {existingUploadedFiles.filter(f => f.blockId === block.id).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Arquivos Enviados:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {existingUploadedFiles.filter(f => f.blockId === block.id).map((file, index) => (
                      <li key={index}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          )}
          
          {/* Renderização do novo bloco de link de mídia */}
          {block.type === OnboardingBlockType.MediaLink && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">{block.data.linkTitle}</h3>
              <p className="text-muted-foreground">
                <a href={block.data.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {block.data.linkUrl}
                </a>
              </p>
            </CardContent>
          )}

          {block.type === OnboardingBlockType.BriefingForm && (
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">{block.data.formTitle}</h3>
              <p className="text-muted-foreground">{block.data.formDescription}</p>
              {(block.data.questions || []).map((question) => (
                <BriefingQuestionRenderer key={question.id} question={question} />
              ))}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default OnboardingBlockRenderer;