import React, { useState, useMemo } from 'react';
import { BriefingResponse, BriefingForm } from '@/types/briefing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from '@/utils/date';
import { Eye, Trash2, Search, Loader2 } from 'lucide-react';
import { useClientStore } from '@/hooks/use-client-store';
import { Input } from '@/components/ui/input';
import { BriefingResponseDetails } from './BriefingResponseDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBriefings } from '@/hooks/use-briefings'; // Importando useBriefings

interface BriefingResponseListProps {
  form: BriefingForm;
  responses: BriefingResponse[];
  isLoading: boolean;
}

export const BriefingResponseList: React.FC<BriefingResponseListProps> = ({ form, responses, isLoading }) => {
  const { clients } = useClientStore();
  const { deleteResponse, isMutating } = useBriefings(); // Usando o hook para a mutação
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<BriefingResponse | null>(null);

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'Público';
    return clientMap.get(clientId) || 'Cliente Desconhecido';
  };
  
  const filteredResponses = useMemo(() => {
    if (!searchTerm.trim()) return responses;
    
    const lowerCaseSearch = searchTerm.trim().toLowerCase();
    
    return responses.filter(r => {
        // Busca no nome do cliente
        const clientName = getClientName(r.client_id);
        if (clientName.toLowerCase().includes(lowerCaseSearch)) return true;
        
        // Busca nas respostas (apenas valores string)
        return Object.values(r.response_data).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(lowerCaseSearch)
        );
    });
  }, [responses, searchTerm, getClientName]);
  
  const handleOpenDetails = (response: BriefingResponse) => {
    setSelectedResponse(response);
    setIsDetailsOpen(true);
  };
  
  const handleDeleteResponse = (responseId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta resposta?')) {
        deleteResponse(responseId);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Respostas para: {form.title}</h2>
      <p className="text-muted-foreground">Total de respostas recebidas: {responses.length}</p>
      
      <div className="flex items-center space-x-3 flex-wrap gap-2">
        <div className="relative flex-grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por cliente ou conteúdo da resposta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Botão de Exportar (Simulado) */}
        <Button variant="outline" onClick={() => showError('Exportação de dados simulada.')} className="flex-shrink-0">
            Exportar (CSV/PDF)
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente/Origem</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResponses.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma resposta encontrada.</TableCell></TableRow>
                    ) : (
                      filteredResponses.map(response => (
                        <TableRow key={response.id}>
                          <TableCell className="font-medium">{getClientName(response.client_id)}</TableCell>
                          <TableCell>{formatDateTime(response.submitted_at)}</TableCell>
                          <TableCell className="text-right flex justify-end space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(response)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteResponse(response.id)}
                                disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo de Detalhes da Resposta */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
          </DialogHeader>
          {selectedResponse && form && (
            <BriefingResponseDetails 
                response={selectedResponse} 
                form={form} 
                clientName={getClientName(selectedResponse.client_id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};