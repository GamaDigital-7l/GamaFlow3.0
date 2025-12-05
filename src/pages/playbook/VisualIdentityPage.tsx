import React, { useState, useEffect } from 'react';
import { usePlaybookContent } from '@/hooks/use-playbook-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { PlaybookContentSkeleton } from "@/components/playbook/PlaybookContentSkeleton";
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from "@/components/SessionContextProvider";

interface VisualIdentityPageProps {
  clientId: string;
}

const VisualIdentityPage: React.FC<VisualIdentityPageProps> = ({ clientId }) => {
  const SECTION_NAME = 'visual_identity';
  const { content, isLoading, isSaving } = usePlaybookContent(clientId, SECTION_NAME);

  if (isLoading) {
    return <PlaybookContentSkeleton />;
  }

  const hasContent = content && content.content && Array.isArray(content.content.files) && content.content.files.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center space-x-2">
        <FileText className="h-6 w-6 text-dyad-500" />
        <span>Identidade Visual</span>
      </h2>
      <p className="text-muted-foreground">
        Acesse os arquivos e diretrizes da identidade visual do cliente.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos de Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent>
          {hasContent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.content.files.map((file: any, index: number) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tamanho: {(file.size / 1024).toFixed(2)} KB
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Nenhum arquivo de identidade visual foi adicionado ainda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualIdentityPage;