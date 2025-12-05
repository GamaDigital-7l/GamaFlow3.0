import React, { useState, useMemo, useRef } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useCrmStore } from '@/hooks/use-crm-store';
import { Lead, LeadStatus, LeadOrigin } from '@/types/crm';
import { CrmColumnComponent } from '@/components/crm/CrmColumn';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { useIsMobile } from '@/hooks/use-mobile'; // Importando useIsMobile
import { cn } from '@/lib/utils';
import { HorizontalRadioSelect } from '@/components/HorizontalRadioSelect'; // Importando HorizontalRadioSelect

const ORIGIN_OPTIONS: { value: LeadOrigin | 'Todas', label: string }[] = [
    { value: 'Todas', label: 'Todas' },
    { value: 'Indicação', label: 'Indicação' },
    { value: 'Tráfego Pago', label: 'Tráfego Pago' },
    { value: 'Orgânico', label: 'Orgânico' },
    { value: 'Outro', label: 'Outro' },
];

const CrmPage: React.FC = () => {
  const { columns, columnOrder, leadsMap, handleDragEnd, addLead, updateLead, isLoading } = useCrmStore();
  const isMobile = useIsMobile();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
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
    <div className="space-y-6">
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
        
        <div className="grid gap-2 w-full sm:w-auto">
          {/* Filtro de Origem (HorizontalRadioSelect) */}
          <HorizontalRadioSelect
            label="Origem"
            options={ORIGIN_OPTIONS}
            value={originFilter}
            onValueChange={setOriginFilter}
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="relative">
          <div 
            className={cn(
              "w-full h-full rounded-lg border bg-muted/20 p-4",
              isMobile ? "overflow-y-auto" : "overflow-x-auto" // Rolagem vertical no mobile
            )}
            ref={scrollAreaRef}
          >
            <div className={cn(
              "pb-4 h-full",
              isMobile ? "flex flex-col space-y-4" : "flex space-x-4 whitespace-nowrap" // Colunas empilhadas no mobile
            )}>
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
          </div>
          {/* Controles de Scroll (Apenas no Desktop) */}
          {!isMobile && <KanbanScrollControls scrollAreaRef={scrollAreaRef} />}
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