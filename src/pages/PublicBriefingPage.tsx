import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBriefings } from '@/hooks/use-briefings';
import { BriefingForm, BriefingResponse } from '@/types/briefing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { BriefingFormRenderer } from '@/components/briefings/BriefingFormRenderer';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from '@/components/ui/button'; // Importando Button

const PublicBriefingPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { forms, isLoading, addResponse, isMutating } = useBriefings();
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const [form, setForm] = useState<BriefingForm | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Novo estado para controle de submissão

  useEffect(() => {
    if (!isLoading && formId) {
      const foundForm = forms.find(f => f.id === formId);
      if (foundForm) {
        setForm(foundForm);
      }
    }
  }, [isLoading, formId, forms]);
  
  const handleSubmitResponse = (response: Omit<BriefingResponse, 'id' | 'submitted_at' | 'client_id'>) => {
    setIsSubmitting(true);
    
    // Simulação de notificação (em um app real, isso seria feito no backend)
    setTimeout(() => {
        addResponse(response, {
            onSuccess: () => {
                setIsSubmitting(false);
                setIsSubmitted(true); // Marca como submetido
                // O toast de sucesso é disparado no hook, mas o componente precisa do estado local
            },
            onError: (err) => {
                setIsSubmitting(false);
                showError(`Falha ao enviar: ${err.message}`);
            }
        });
    }, 500); // Pequeno delay para simular o envio
  };

  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Formulário Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">O ID do formulário é inválido ou ele foi desativado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isSubmitted) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <CardTitle className="text-2xl">Formulário Enviado!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">A equipe Gama Creative agradece suas respostas e entrará em contato em breve.</p>
                    <Button onClick={() => window.close()} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
                        Fechar Janela
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
              <img 
                src={finalLogoUrl} 
                alt="Gama Creative Logo" 
                className="h-10 object-contain mx-auto" 
              />
            ) : (
              <h1 className="text-2xl font-bold text-dyad-500">Gama Creative</h1>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-dyad-500 mb-2">
            {form.title}
          </h1>
          {form.description && (
            <p className="text-lg text-muted-foreground">
              {form.description}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-8">
          <BriefingFormRenderer 
            form={form}
            onSubmitResponse={handleSubmitResponse}
            isSubmitting={isSubmitting || isMutating}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicBriefingPage;