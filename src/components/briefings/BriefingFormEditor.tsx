import React, { useState, useEffect } from 'react';
import { BriefingForm, BriefingField, FieldType } from '@/types/briefing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import FieldEditor from './FieldEditor';
import { Client } from '@/types/client';
import { showError } from '@/utils/toast';

interface BriefingFormEditorProps {
  initialData?: BriefingForm;
  clients: Client[];
  onSubmit: (briefing: Omit<BriefingForm, 'user_id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const initialField: BriefingField = {
  id: Date.now().toString(),
  label: 'Nova Pergunta',
  type: 'text_short',
  isRequired: false,
};

export const BriefingFormEditor: React.FC<BriefingFormEditorProps> = ({ initialData, clients, onSubmit, onCancel, isSubmitting }) => {
  // Usamos 'none' como valor interno para representar a ausência de cliente
  const getInitialClientId = (id?: string) => id || 'none';
  
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [clientId, setClientId] = useState(getInitialClientId(initialData?.clientId));
  const [displayMode, setDisplayMode] = useState(initialData?.displayMode || 'page');
  const [fields, setFields] = useState<BriefingField[]>(initialData?.fields || [initialField]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setClientId(getInitialClientId(initialData.clientId));
      setDisplayMode(initialData.displayMode);
      setFields(initialData.fields);
    }
  }, [initialData]);

  const handleFieldChange = (index: number, updatedField: BriefingField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const handleFieldDelete = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldDuplicate = (index: number) => {
    const fieldToDuplicate = fields[index];
    const newField: BriefingField = {
      ...fieldToDuplicate,
      id: Date.now().toString(), // Novo ID único
      label: `${fieldToDuplicate.label} (Cópia)`,
    };
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    setFields(newFields);
  };

  const handleAddSection = () => {
    const newField: BriefingField = {
      id: Date.now().toString(),
      label: 'Nova Seção',
      type: 'section',
      isRequired: false,
    };
    setFields([...fields, newField]);
  };

  const handleAddQuestion = () => {
    const newField: BriefingField = {
        ...initialField,
        id: Date.now().toString(),
    };
    setFields([...fields, newField]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFields(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || fields.length === 0) {
      showError('Título e pelo menos um campo são obrigatórios.');
      return;
    }

    // Converte 'none' de volta para undefined/string vazia para o objeto final
    const finalClientId = clientId === 'none' ? undefined : clientId;

    const briefingData: Omit<BriefingForm, 'user_id' | 'createdAt'> & { id?: string } = {
      id: initialData?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      clientId: finalClientId,
      displayMode,
      fields,
      isPublic: true, // Sempre público
    };

    onSubmit(briefingData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Título do Briefing</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="clientId">Cliente Associado (Opcional)</Label>
          <Select value={clientId} onValueChange={setClientId} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {/* Item com valor 'none' para "Nenhum Cliente" */}
              <SelectItem value="none">Nenhum Cliente</SelectItem> 
              {clients.map(client => {
                // VERIFICAÇÃO DE SEGURANÇA: Garante que o ID não seja uma string vazia
                if (!client.id || client.id === '') return null; 
                return (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="displayMode">Modo de Exibição</Label>
          <Select value={displayMode} onValueChange={(value) => setDisplayMode(value as 'page' | 'typeform')} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">Página Única (Formulário Clássico)</SelectItem>
              <SelectItem value="typeform">Typeform (Uma Pergunta por Vez)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-4 border-b pb-2">Campos do Briefing</h3>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="briefing-fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-4"
                    >
                      <FieldEditor
                        field={field}
                        onChange={(updatedField) => handleFieldChange(index, updatedField)}
                        onDelete={() => handleFieldDelete(index)}
                        onDuplicate={() => handleFieldDuplicate(index)}
                        allFields={fields}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={handleAddQuestion} disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Pergunta
        </Button>
        <Button type="button" variant="outline" onClick={handleAddSection} disabled={isSubmitting}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Seção
        </Button>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600 ml-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Salvar Briefing
        </Button>
      </div>
    </form>
  );
};