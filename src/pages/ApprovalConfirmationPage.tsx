import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ApprovalConfirmationPage: React.FC = () => {
  const location = useLocation();
  const { action, title } = location.state as { action: 'aprovado' | 'edição solicitada', title: string } || {};

  const isApproved = action === 'aprovado';
  const isMassApproval = title.includes('Posts'); // Heurística simples para detectar aprovação em massa

  const getMessage = () => {
    if (isMassApproval) {
      return `Os **${title}** foram marcados como **aprovado**. A equipe Gama Creative já foi notificada.`;
    }
    
    if (isApproved) {
      return `O post **${title}** foi marcado como **aprovado**. A equipe Gama Creative já foi notificada.`;
    }
    
    return `A solicitação de edição para o post **${title}** foi registrada. A equipe Gama Creative irá revisar e retornar em breve.`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          {isApproved ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle className="text-2xl">
            {isApproved ? 'Aprovação Registrada!' : 'Solicitação de Edição Registrada!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {getMessage()}
          </p>
          <Button onClick={() => window.close()} className="bg-dyad-500 hover:bg-dyad-600">
            Fechar Janela
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalConfirmationPage;