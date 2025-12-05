import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ClipboardList, Edit, Trash2, Copy, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBriefingTemplates } from '@/hooks/use-briefing-templates';
import { BriefingTemplate, BriefingField } from '@/types/briefing';
import { BriefingFormEditor } from '@/components/briefings/BriefingFormEditor';
import { withRole } from '@/components/withRole';
import { Separator } from '@/components/ui/separator';
import { useClientStore } from '@/hooks/use-client-store';
import { showSuccess } from '@/utils/toast';
import BriefingFieldRenderer from '@/components/briefings/BriefingFieldRenderer';
import { v4 as uuidv4 } from 'uuid'; // Importando uuidv4

const BriefingTemplatesPage: React.FC = () => {
  const { templates, isLoading, upsertTemplate, deleteTemplate, isMutating } = useBriefingTemplates();
  const { clients } = useClientStore(); // Necessário para o BriefingFormEditor
  
  const [isEditorDialogOpen, setIsEditorDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BriefingTemplate | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditingTemplate(undefined);
    setIsEditorDialogOpen(true);
  };

  const handleOpenEdit = (template: BriefingTemplate) => {
    setEditingTemplate(template);
    setIsEditorDialogOpen(true);
  };
  
  const handleCloseEditorDialog = () => {
    setIsEditorDialogOpen(false);
    setEditingTemplate(undefined);
  };

  const handleTemplateSubmit = (data: any) => {
    // O BriefingFormEditor retorna um BriefingForm, precisamos mapear para BriefingTemplate
    const templateData: Omit<BriefingTemplate, 'id'> & { id?: string } = {
        id: data.id,
        name: data.title,
        description: data.description || '',
        blocks: data.fields,
    };
    upsertTemplate(templateData);
    handleCloseEditorDialog();
  };
  
  const handleDuplicate = (template: BriefingTemplate) => {
    const newTemplate: Omit<BriefingTemplate, 'id'> = {
        name: `${template.name} (Cópia)`,
        description: template.description,
        // Garante que todos os IDs de campo sejam novos para evitar conflitos
        blocks: template.blocks.map(block => ({ ...block, id: uuidv4() })), 
    };
    upsertTemplate(newTemplate);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
        deleteTemplate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <ClipboardList className="h-7 w-7 text-dyad-500" />
          <span>Templates de Briefing</span>
        </h1>
        <Button 
          onClick={handleOpenCreate} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isMutating}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>
      
      <p className="text-muted-foreground">Crie modelos reutilizáveis para gerar novos formulários de briefing rapidamente.</p>

      {/* Ajuste do grid para 1 coluna no mobile, 2 no md, 3 no lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <p className="col-span-full text-center p-8 text-muted-foreground border rounded-lg">
            Nenhum template de briefing criado ainda.
          </p>
        ) : (
          templates.map(template => (
            <Card key={template.id} className="flex flex-col justify-between h-full">
              <CardHeader>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{template.description || 'Sem descrição.'}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                    Campos: <span className="font-medium text-foreground">{template.blocks.length}</span>
                </div>
                
                <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)} disabled={isMutating} className="text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de Criação/Edição (Reutiliza BriefingFormEditor) */}
      <Dialog open={isEditorDialogOpen} onOpenChange={handleCloseEditorDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? `Editar Template: ${editingTemplate.name}` : 'Criar Novo Template de Briefing'}</DialogTitle>
          </DialogHeader>
          <BriefingFormEditor 
            // Mapeia BriefingTemplate para BriefingForm para o editor
            initialData={editingTemplate ? {
                id: editingTemplate.id,
                user_id: 'template-user', // Mock
                title: editingTemplate.name,
                description: editingTemplate.description,
                clientId: undefined,
                displayMode: 'page', // Padrão para templates
                fields: editingTemplate.blocks,
                isPublic: true, // Mock
                createdAt: new Date().toISOString(), // Mock
            } : undefined}
            clients={clients}
            onSubmit={handleTemplateSubmit}
            onCancel={handleCloseEditorDialog}
            isSubmitting={isMutating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withRole(BriefingTemplatesPage, 'admin');