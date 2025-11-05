import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2, Edit, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTaskTemplates } from '@/hooks/use-task-templates';
import { TaskTemplate, TaskPriority, TargetBoard, DayOfWeek, TaskCategory, TaskType } from '@/types/task';
import { TemplateForm } from '@/components/tasks/TemplateForm';
import { withRole } from '@/components/withRole';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mapeamento de TargetBoard para Título
const TARGET_BOARD_TITLES: Record<TargetBoard, string> = {
  todayHigh: 'Hoje — Prioridade Alta',
  todayMedium: 'Hoje — Prioridade Média',
  thisWeekLow: 'Esta Semana — Baixa',
  woeTasks: 'WOE Comunicação',
  clientTasks: 'Tarefas de Cliente',
  agencyTasks: 'Gama Creative (Agência)',
};

// Mapeamento de dias para exibição
const DAY_LABEL_MAP: Record<DayOfWeek, string> = {
    Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb', Sun: 'Dom'
};

// --- Componente de Listagem de Templates ---

interface TemplateListProps {
  templates: TaskTemplate[];
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onEdit, onDelete, isDeleting }) => (
  <div className="space-y-3">
    {templates.length === 0 ? (
      <p className="text-muted-foreground text-center p-4 border rounded-lg">Nenhum template de tarefa padrão cadastrado.</p>
    ) : (
      templates.map(template => (
        <Card key={template.id} className="p-4 flex justify-between items-center transition-shadow">
          <div className="space-y-1 min-w-0 flex-grow pr-4">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold truncate">{template.title}</h4>
              {/* Badge de status removida */}
            </div>
            <p className="text-sm text-muted-foreground truncate">{template.description}</p>
            <div className="flex flex-wrap items-center text-xs space-x-2 pt-1">
              <Badge variant="secondary" className="text-dyad-500">{TARGET_BOARD_TITLES[template.targetBoard]}</Badge>
              <Badge className={cn("text-white", template.priority === 'Alta' ? 'bg-red-500' : template.priority === 'Média' ? 'bg-yellow-500' : 'bg-green-500')}>
                {template.priority}
              </Badge>
              {template.clientName && <Badge variant="outline">{template.clientName}</Badge>}
              <Badge variant="outline">{template.category}</Badge> {/* Exibe a categoria */}
              <Badge variant="outline">{template.taskType}</Badge> {/* Exibe o tipo de tarefa */}
              <span className="text-xs text-gray-500">
                {(template.daysOfWeek || []).join(', ')}
                {template.timeOfDay && ` às ${template.timeOfDay.substring(0, 5)}`}
              </span>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(template.id)} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </Card>
      ))
    )}
  </div>
);

const TasksConfigPage: React.FC = () => {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate, isAdding, isUpdating, isDeleting } = useTaskTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | undefined>(undefined);

  const handleOpenEdit = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Configuração de Tarefas</h1>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>
      
      <p className="text-muted-foreground">Gerencie templates de tarefas automáticas e recorrentes.</p>

      <Card>
        <CardContent>
          <TemplateList 
            templates={templates} 
            onEdit={handleOpenEdit} 
            onDelete={deleteTemplate}
            isDeleting={isDeleting}
          />
        </CardContent>
      </Card>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <TemplateForm 
            initialData={editingTemplate}
            onSubmit={editingTemplate ? updateTemplate : addTemplate}
            onCancel={handleCloseDialog}
            isSubmitting={isAdding || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksConfigPage;