import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanScrollControlsProps {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const KanbanScrollControls: React.FC<KanbanScrollControlsProps> = ({ scrollAreaRef }) => {
  const scrollAmount = 300; // Quantidade de pixels para rolar

  const scroll = (direction: 'left' | 'right') => {
    if (scrollAreaRef.current) {
      // O elemento referenciado é o div com overflow-x-auto
      const currentScroll = scrollAreaRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollAreaRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-30 hidden md:flex"> {/* Adicionado hidden md:flex */}
      {/* Botão Esquerdo */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "z-40 h-10 w-10 rounded-full bg-card/80 hover:bg-card pointer-events-auto shadow-lg ml-2",
          "opacity-70 hover:opacity-100 transition-opacity"
        )}
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-6 w-6 text-dyad-500" />
      </Button>

      {/* Botão Direito */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "z-40 h-10 w-10 rounded-full bg-card/80 hover:bg-card pointer-events-auto shadow-lg mr-2",
          "opacity-70 hover:opacity-100 transition-opacity"
        )}
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-6 w-6 text-dyad-500" />
      </Button>
    </div>
  );
};