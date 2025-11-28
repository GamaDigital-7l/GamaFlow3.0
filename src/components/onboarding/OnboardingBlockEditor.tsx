"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { OnboardingBlock, OnboardingBlockType } from '@/types/playbook';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent } from "@/components/ui/card";
import { FieldEditor } from './FieldEditor';

interface OnboardingBlockEditorProps {
  initialBlocks: OnboardingBlock[];
  onSubmit: (blocks: OnboardingBlock[]) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const OnboardingBlockEditor: React.FC<OnboardingBlockEditorProps> = ({ initialBlocks, onSubmit, onCancel, isSaving }) => {
  const [blocks, setBlocks] = useState<OnboardingBlock[]>(initialBlocks);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const handleBlockChange = (index: number, updatedBlock: OnboardingBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
  };

  const handleBlockDelete = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleBlockDuplicate = (index: number) => {
    const blockToDuplicate = blocks[index];
    const newBlock: OnboardingBlock = {
      ...blockToDuplicate,
      id: Date.now().toString(), // Novo ID único
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const handleAddBlock = (type: OnboardingBlockType) => {
    const newBlock: OnboardingBlock = {
      id: Date.now().toString(),
      type: type,
      data: {
        title: 'Novo Bloco',
        content: 'Conteúdo do bloco...',
      },
    };
    setBlocks([...blocks, newBlock]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(blocks);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="onboarding-blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="mb-4"
                    >
                      <FieldEditor
                        field={block.data}
                        onChange={(updatedField) => handleBlockChange(index, updatedField)}
                        onDelete={() => handleBlockDelete(index)}
                        onDuplicate={() => handleBlockDuplicate(index)}
                        allFields={blocks}
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

      <div className="flex space-x-2">
        <Button type="button" variant="outline" onClick={() => handleAddBlock(OnboardingBlockType.Title)} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Título
        </Button>
        <Button type="button" variant="outline" onClick={() => handleAddBlock(OnboardingBlockType.Text)} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Texto
        </Button>
        <Button type="button" variant="outline" onClick={() => handleAddBlock(OnboardingBlockType.MediaLink)} disabled={isSaving}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar Link de Mídia
        </Button>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};