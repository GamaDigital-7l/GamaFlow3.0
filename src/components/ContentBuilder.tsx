"use client";

import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Block, BlockType } from '@/types/builder';
import { v4 as uuidv4 } from 'uuid';
import TextBlock from './builder/TextBlock';
import TitleBlock from './builder/TitleBlock';
import SubtitleBlock from './builder/SubtitleBlock';
import ButtonBlock from './builder/ButtonBlock';
import CheckboxBlock from './builder/CheckboxBlock';
import MultipleChoiceBlock from './builder/MultipleChoiceBlock';
import VideoBlock from './builder/VideoBlock';
import ImageBlock from './builder/ImageBlock';
import LoginBlock from './builder/LoginBlock';
import LinksBlock from './builder/LinksBlock';
import NumberBlock from './builder/NumberBlock';
import ClientLoginBlock from './builder/ClientLoginBlock';
import UploadBlock from './builder/UploadBlock';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface ContentBuilderProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
}

const ContentBuilder: React.FC<ContentBuilderProps> = ({ initialBlocks = [], onChange }) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  const handleBlockChange = (id: string, data: any) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block => (block.id === id ? { ...block, data } : block))
    );
    onChange(blocks);
  };

  const handleAddBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: uuidv4(),
      type: type,
      data: {}
    };
    setBlocks(prevBlocks => [...prevBlocks, newBlock]);
    onChange(blocks);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    onChange(blocks);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
    onChange(blocks);
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'text':
        return <TextBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'title':
        return <TitleBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'subtitle':
        return <SubtitleBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'button':
        return <ButtonBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'checkbox':
        return <CheckboxBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'multipleChoice':
        return <MultipleChoiceBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'video':
        return <VideoBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'image':
        return <ImageBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'login':
        return <LoginBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
       case 'links':
        return <LinksBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'number':
        return <NumberBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'clientLogin':
        return <ClientLoginBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      case 'upload':
        return <UploadBlock id={block.id} data={block.data} onChange={handleBlockChange} />;
      default:
        return <p>Unknown block type: {block.type}</p>;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {blocks.map((block, index) => (
              <Draggable key={block.id} draggableId={block.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                  >
                    <Card className="mb-4">
                      <CardContent className="p-4">
                        {renderBlock(block)}
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveBlock(block.id)}>
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={() => handleAddBlock('text')}>
          <Plus className="h-4 w-4 mr-2" /> Add Text
        </Button>{' '}
        <Button variant="outline" size="sm" onClick={() => handleAddBlock('title')}>
          <Plus className="h-4 w-4 mr-2" /> Add Title
        </Button>
      </div>
    </DragDropContext>
  );
};

export default ContentBuilder;