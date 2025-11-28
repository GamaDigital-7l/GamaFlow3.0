import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useCrmStore } from '@/hooks/use-crm-store';
import { Lead, LeadStatus } from '@/types/crm';
import { CrmColumnComponent } from '@/components/crm/CrmColumn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Loader2, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LeadForm } from "@/components/crm/LeadForm";
import { LeadDetailsDialog } from '@/components/crm/LeadDetailsDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { KanbanScrollControls } from '@/components/kanban/KanbanScrollControls';
import { withRole } from '@/components/withRole';

const CrmPage: React.FC = () => {
  const { columns, columnOrder, leadsMap, handleDragEnd, addLead, updateLead, isLoading } = useCrmStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [originFilter, setOriginFilter] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const onDragEnd = (result: DropResult) => {
    handleDragEnd(result);
  };

  const handleCreateLead = (leadData: any) => {
    addLead(leadData, {
        onSuccess: () => setIsCreateDialogOpen(false)
    });
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsDialogOpen(true);
  };
  
  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedLead(null);
  };
  
  const filteredLeads = useMemo(() => {
    let filtered = Object.values(leadsMap);

    // 1. Busca por Nome
    if (searchTerm.trim()) {
      const lowerCaseSearch = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // 2. Filtro por Origem
    if (originFilter !== 'Todas') {
        filtered = filtered.filter(l => l.origin === originFilter);
    }
    
    return filtered;
  }, [leadsMap, searchTerm, originFilter]);
  
  // Reorganiza os leads filtrados de volta para o formato Kanban
  const filteredColumns = useMemo(() => {
    const filteredLeadsMap = filteredLeads.reduce((acc, lead) => {
        acc[lead.id] = lead;
        return acc;
    }, {} as Record<string, Lead>);
    
    const newColumns = { ...columns };
    
    columnOrder.forEach(status => {
        newColumns[status] = {
            ...newColumns[status],
            // Filtra os IDs de lead que estão no mapa de leads filtrados
            leadIds: columns[status].leadIds.filter(id => filteredLeadsMap[id]),
        };
    });
    
    return newColumns;
  }, [columns, columnOrder, filteredLeads]);


  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando CRM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header: Ajuste para mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Target className="h-7 w-7 text-dyad-500" />
          <span>CRM de Prospecção</span>
        </h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Lead
        </Button>
      </div>
      
      <p className="text-muted-foreground">Gerencie o funil de vendas e o relacionamento com leads e clientes em potencial.</p>

      {/* Filtros e Busca: Ajuste para mobile (w-full) */}
      <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg bg-muted/30">
        <div className="grid gap-2 w-full sm:w-auto flex-grow">
          <Label htmlFor="search">Buscar por Nome</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="search"
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="grid gap-2 w-full sm:w-40">
          <Label htmlFor="originFilter">Origem</Label>
          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger id="originFilter">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Origens</SelectItem>
              <SelectItem value="Indicação">Indicação</SelectItem>
              <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
              <SelectItem value="Orgânico">Orgânico</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap rounded-lg border bg-muted/20 p-4" ref={scrollAreaRef}>
            <div className="flex space-x-4 pb-4">
              {columnOrder.map((columnId) => {
                const column = filteredColumns[columnId];
                // Usamos leadsMap para obter os dados do lead, garantindo que o lead exista
                const leads = column.leadIds.map(leadId => leadsMap[leadId]).filter(l => l !== undefined);

                return (
                  <CrmColumnComponent
                    key={columnId}
                    column={column}
                    leads={leads}
                    onEditLead={handleEditLead}
                    onAddLead={() => setIsCreateDialogOpen(true)}
                  />
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <KanbanScrollControls scrollAreaRef={scrollAreaRef} />
        </div>
      </DragDropContext>

      {/* Diálogo de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lead</DialogTitle>
          </DialogHeader>
          <LeadForm onCancel={() => setIsCreateDialogOpen(false)} onSubmit={handleCreateLead} isSubmitting={false} />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Detalhes/Edição */}
      {selectedLead && (
        <LeadDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={handleCloseDetails}
          lead={selectedLead}
        />
      )}
    </div>
  );
};

export default withRole(CrmPage, 'admin');