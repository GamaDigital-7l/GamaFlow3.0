import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, FileText } from 'lucide-react';
import { NewDemandForm } from '@/components/playbook/NewDemandForm';
import { useClientStore } from '@/hooks/use-client-store';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';

interface RequestDemandPageProps {
  clientId: string;
}

const RequestDemandPage: React.FC<RequestDemandPageProps> = ({ clientId }) => {
  const { getClientById, addPost } = useClientStore();
  const client = getClientById(clientId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!client) {
    return <div className="text-center p-8 text-red-500">Cliente não encontrado.</div>;
  }

  const handleNewDemandSubmit = async (data: { title: string, description: string, attachments: File[] }) => {
    setIsSubmitting(true);
    
    // Simulação de upload de anexos (em um app real, faríamos upload para o Supabase Storage aqui)
    const attachmentUrls = data.attachments.map(f => `[Anexo: ${f.name}]`).join('\n');
    
    // Cria o post no Kanban do cliente, na coluna 'Produção'
    const newPostData = {
      title: `[DEMANDA] ${data.title}`,
      description: `${data.description}\n\n--- Anexos ---\n${attachmentUrls}`,
      dueDate: new Date(new Date().getTime() + 86400000 * 7), // Vencimento em 7 dias (padrão)
      imageUrl: '/placeholder.svg', // Placeholder
      subtasks: ['Revisar Demanda', 'Definir Prazo'],
      status: 'Produção' as const,
      monthYear: format(new Date(), 'yyyy-MM'),
    };

    try {
      // Adiciona o post (que é a demanda)
      addPost(clientId, newPostData);
      
      showSuccess('Sua solicitação foi enviada com sucesso! A equipe Gama Creative irá revisar.');
      setIsDialogOpen(false);
      
    } catch (error) {
      showError('Erro ao enviar a solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Solicitar Nova Demanda</h2>
        <Button 
          size="lg" 
          className="bg-dyad-500 hover:bg-dyad-600"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" /> Nova Solicitação
        </Button>
      </div>
      <p className="text-muted-foreground">Use este formulário para enviar novas demandas de trabalho à equipe Gama Creative.</p>
      
      <div className="p-6 border rounded-lg bg-muted/30 text-center space-y-2">
        <FileText className="h-8 w-8 text-dyad-500 mx-auto" />
        <p className="font-semibold">Histórico de Solicitações</p>
        <p className="text-sm text-muted-foreground">
          Todas as suas solicitações enviadas se transformam em posts no Kanban.
          Você pode acompanhar o status na seção "Materiais Aprovados".
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Demanda para {client.name}</DialogTitle>
          </DialogHeader>
          <NewDemandForm 
            clientId={clientId}
            clientName={client.name}
            onSubmit={handleNewDemandSubmit}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestDemandPage;