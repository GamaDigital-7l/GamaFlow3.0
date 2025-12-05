import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, MessageSquare, Edit, Trash2, Link as LinkIcon, Copy, LayoutDashboard, ClipboardList, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBriefings } from '@/hooks/use-briefings';
import { BriefingForm } from '@/types/briefing';
import { BriefingFormEditor } from '@/components/briefings/BriefingFormEditor';
import { withRole } from '@/components/withRole';
import { useClientStore } from '@/hooks/use-client-store';
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { BriefingResponseList } from '@/components/briefings/BriefingResponseList';

const BriefingsPage: React.FC = () => {
  const { forms, responses, isLoading, upsertForm, deleteForm, isMutating, getResponsesByFormId } = useBriefings();
  const { clients } = useClientStore(); // Obtendo a lista de clientes
  
  const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false);
  const [isResponsesDialogOpen, setIsResponsesDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<BriefingForm | undefined>(undefined);
  const [viewingForm, setViewingForm] = useState<BriefingForm | undefined>(undefined);

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);
  
  const responseCounts = useMemo(() => {
    return responses.reduce((acc, r) => {
        acc[r.form_id] = (acc[r.form_id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
  }, [responses]);

  const handleOpenCreate = () => {
    setEditingForm(undefined);
    setIsEditorDialogOpen(true);
  };

  const handleOpenEdit = (form: BriefingForm) => {
    setEditingForm(form);
    setIsEditorDialogOpen(true);
  };
  
  const handleOpenResponses = (form: BriefingForm) => {
    setViewingForm(form);
    setIsResponsesDialogOpen(true);
  };

  const handleCloseEditorDialog = () => {
    setIsEditorDialogOpen(false);
    setEditingForm(undefined);
  };
  
  const handleCloseResponsesDialog = () => {
    setIsResponsesDialogOpen(false);
    setViewingForm(undefined);
  };

  const handleCopyLink = (formId: string) => {
    const origin = window.location.origin;
    const link = `${origin}/briefing/public/${formId}`;
    navigator.clipboard.writeText(link);
    showSuccess('Link público do formulário copiado!');
  };
  
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'N/A';
    return clientMap.get(clientId) || 'Cliente Desconhecido';
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando formulários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <ClipboardList className="h-7 w-7 text-dyad-500" />
          <span>Formulários de Briefing</span>
        </h1>
        <Button 
          onClick={handleOpenCreate} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isMutating}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Formulário
        </Button>
      </div>
      
      <p className="text-muted-foreground">Crie formulários dinâmicos para coletar informações de clientes sem a necessidade de login.</p>

      {/* Ajuste do grid para 1 coluna no mobile, 2 no md, 3 no lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length === 0 ? (
          <p className="col-span-full text-center p-8 text-muted-foreground border rounded-lg">
            Nenhum formulário de briefing criado ainda.
          </p>
        ) : (
          forms.map(form => (
            <Card key={form.id} className="flex flex-col justify-between h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl pr-4">{form.title}</CardTitle>
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => handleOpenResponses(form)}
                        className="p-0 h-auto text-dyad-500 hover:text-dyad-600 flex-shrink-0"
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="font-bold text-foreground ml-1">{responseCounts[form.id] || 0}</span>
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{form.description || 'Sem descrição.'}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Cliente: <span className="font-medium text-foreground">{getClientName(form.clientId)}</span></span>
                    <span className="flex items-center space-x-1">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>{form.displayMode === 'page' ? 'Página Única' : 'Typeform'}</span>
                    </span>
                </div>
                
                <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(form)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopyLink(form.id)}>
                        <LinkIcon className="h-4 w-4 mr-2" /> Link Público
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteForm(form.id)} disabled={isMutating} className="text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={isEditorDialogOpen} onOpenChange={handleCloseEditorDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? 'Editar Formulário' : 'Criar Novo Formulário de Briefing'}</DialogTitle>
          </DialogHeader>
          <BriefingFormEditor 
            initialData={editingForm}
            clients={clients}
            onSubmit={upsertForm}
            onCancel={handleCloseEditorDialog}
            isSubmitting={isMutating}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Respostas */}
      <Dialog open={isResponsesDialogOpen} onOpenChange={handleCloseResponsesDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
          </DialogHeader>
          {viewingForm && (
            <BriefingResponseList 
                form={viewingForm}
                responses={getResponsesByFormId(viewingForm.id)}
                isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withRole(BriefingsPage, 'admin');