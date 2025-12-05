import React from 'react';
import { Lead, CrmColumn } from '@/types/crm';
import { Droppable } from 'react-beautiful-dnd';
import { LeadCard } from './LeadCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile'; // Importando useIsMobile

interface CrmColumnProps {
  column: CrmColumn;
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onAddLead: () => void; 
}

export const CrmColumnComponent: React.FC<CrmColumnProps> = ({ column, leads, onEditLead, onAddLead }) => {
  const isMobile = useIsMobile();
  
  const isClosedColumn = column.id === 'Fechado (Ganho)' || column.id === 'Fechado (Perdido)';
  
  return (
    <div className={cn(
      "flex flex-col flex-shrink-0 mx-2 h-full",
      isMobile ? "w-full mb-6" : "w-72" // Ocupa 100% da largura no mobile
    )}>
      <h3 className="text-lg font-semibold mb-3 p-2 rounded-t-lg bg-secondary/50 border-b border-border flex justify-between items-center">
        {column.title} ({leads.length})
        {column.id === 'Prospectando' && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-dyad-500 hover:bg-dyad-100" onClick={onAddLead}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </h3>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "p-2 rounded-b-lg flex-grow min-h-[100px] transition-colors duration-200 overflow-y-auto", // Adicionado overflow-y-auto
              snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30",
              isClosedColumn && "bg-gray-200/50 dark:bg-gray-800/50"
            )}
          >
            {leads.map((lead, index) => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                index={index} 
                onEdit={onEditLead} 
              />
            ))}
            {provided.placeholder}
            {leads.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-sm text-muted-foreground text-center p-4">
                Arraste leads para cá.
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};