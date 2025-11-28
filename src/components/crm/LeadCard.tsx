import React from 'react';
import { Lead } from '@/types/crm';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, MessageSquare, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';

interface LeadCardProps {
  lead: Lead;
  index: number;
  onEdit: (lead: Lead) => void;
}

const getStatusColor = (status: Lead['status']) => {
  switch (status) {
    case 'Prospectando': return 'bg-blue-500';
    case 'Contato Feito': return 'bg-yellow-500';
    case 'Reunião Agendada': return 'bg-purple-500';
    case 'Proposta Enviada': return 'bg-dyad-500';
    case 'Fechado (Ganho)': return 'bg-green-600';
    case 'Fechado (Perdido)': return 'bg-red-600';
    default: return 'bg-gray-500';
  }
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, index, onEdit }) => {
  const statusColor = getStatusColor(lead.status);
  const lastNote = lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;
  
  const daysSinceLastContact = lastNote ? differenceInDays(new Date(), new Date(lastNote.date)) : differenceInDays(new Date(), lead.firstContactDate);
  const isStale = daysSinceLastContact > 14 && lead.status !== 'Fechado (Ganho)' && lead.status !== 'Fechado (Perdido)';

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 shadow-md transition-shadow duration-200 cursor-pointer border border-border",
            snapshot.isDragging ? "shadow-xl border-dyad-500 border-2" : "hover:shadow-lg",
            isStale && "border-yellow-500/50 bg-yellow-50/10 dark:bg-yellow-950/10"
          )}
          onClick={() => onEdit(lead)}
        >
          <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold line-clamp-2 pr-2">
              {lead.name}
            </CardTitle>
            <Badge className={cn("text-white text-xs flex-shrink-0", statusColor)}>
              {lead.status.split(' ')[0]}
            </Badge>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-2">
            
            {/* Valor Potencial */}
            {lead.potentialValue !== undefined && (
              <div className="flex items-center text-sm text-foreground/80">
                <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                <span>R$ {lead.potentialValue.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            
            {/* Próxima Ação / Último Contato */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {lead.nextActionDate ? `Próxima: ${formatDate(lead.nextActionDate)}` : 'Sem próxima ação'}
                </span>
              </div>
              {isStale && (
                <Badge variant="destructive" className="text-xs h-4 px-1.5 bg-yellow-600 hover:bg-yellow-700">
                    Stale
                </Badge>
              )}
            </div>
            
            {/* Última Nota */}
            {lastNote && (
                <div className="flex items-center text-xs text-muted-foreground border-t pt-2 mt-2">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span className="truncate italic">
                        {lastNote.text}
                    </span>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};