import React, { useState, useEffect } from 'react';
import { Lead, LeadNote, LeadContactInfo, LeadStatus } from '@/types/crm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatDate } from '@/utils/date';
import { Loader2, MessageSquare, Phone, Mail, Instagram, DollarSign, Target, Clock, Trash2, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useCrmStore } from '@/hooks/use-crm-store';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/utils/toast';

interface LeadDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const getStatusColor = (status: LeadStatus) => {
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

export const LeadDetailsDialog: React.FC<LeadDetailsDialogProps> = ({ isOpen, onOpenChange, lead }) => {
  const { updateLead, deleteLead, convertLead, addNoteToLead, isUpdating, isDeleting } = useCrmStore();
  const navigate = useNavigate();
  
  const [newNote, setNewNote] = useState('');
  const [nextActionDate, setNextActionDate] = useState(lead.nextActionDate ? formatDate(lead.nextActionDate) : '');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (lead) {
        setNextActionDate(lead.nextActionDate ? formatDate(lead.nextActionDate) : '');
    }
  }, [lead]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteToLead(lead.id, newNote.trim());
    setNewNote('');
  };
  
  const handleUpdateNextAction = () => {
    if (!nextActionDate) return;
    
    const newDate = new Date(nextActionDate);
    
    updateLead({
        ...lead,
        nextActionDate: newDate,
    });
    showSuccess('Próxima ação atualizada!');
  };
  
  const handleConvertLead = async (status: 'Fechado (Ganho)' | 'Fechado (Perdido)') => {
    if (isConverting) return;
    
    if (status === 'Fechado (Perdido)') {
        if (!window.confirm(`Tem certeza que deseja marcar ${lead.name} como PERDIDO e arquivar?`)) return;
        updateLead({ ...lead, status: status });
        onOpenChange(false);
        return;
    }
    
    // Fechado (Ganho) - Conversão
    if (!window.confirm(`Tem certeza que deseja converter ${lead.name} para Cliente Ativo? Isso irá deletar o lead e criar um novo cliente.`)) return;
    
    setIsConverting(true);
    try {
        // A mutação convertLead lida com a criação do cliente e a exclusão do lead via Edge Function
        const newClientId = await convertLead(lead);
        
        showSuccess(`Lead ${lead.name} convertido para Cliente! Redirecionando...`);
        onOpenChange(false);
        navigate(`/clients/${newClientId}`);
        
    } catch (error) {
        showError(`Falha na conversão: ${error.message}`);
    } finally {
        setIsConverting(false);
    }
  };
  
  const handleDeleteLead = () => {
    if (window.confirm(`Tem certeza que deseja excluir o lead ${lead.name}?`)) {
        deleteLead(lead.id);
        onOpenChange(false);
    }
  };

  const isClosed = lead.status === 'Fechado (Ganho)' || lead.status === 'Fechado (Perdido)';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{lead.name}</DialogTitle>
          <div className="flex items-center space-x-2 text-sm">
            <span className={cn("px-2 py-0.5 rounded-full text-white", getStatusColor(lead.status))}>
                {lead.status}
            </span>
            <span className="text-muted-foreground">Origem: {lead.origin}</span>
          </div>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* Detalhes Principais */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Valor Potencial</Label>
                <p className="font-semibold flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    {lead.potentialValue ? `R$ ${lead.potentialValue.toFixed(2).replace('.', ',')}` : 'N/A'}
                </p>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Primeiro Contato</Label>
                <p className="font-semibold">{formatDate(lead.firstContactDate)}</p>
            </div>
          </div>
          
          {/* Contatos */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b pb-1">Contatos</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
                {lead.contactInfo.phone && (
                    <a href={`tel:${lead.contactInfo.phone}`} className="flex items-center text-blue-500 hover:underline">
                        <Phone className="h-4 w-4 mr-1" /> {lead.contactInfo.phone}
                    </a>
                )}
                {lead.contactInfo.email && (
                    <a href={`mailto:${lead.contactInfo.email}`} className="flex items-center text-blue-500 hover:underline">
                        <Mail className="h-4 w-4 mr-1" /> {lead.contactInfo.email}
                    </a>
                )}
                {lead.contactInfo.instagram && (
                    <a href={`https://instagram.com/${lead.contactInfo.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
                        <Instagram className="h-4 w-4 mr-1" /> {lead.contactInfo.instagram}
                    </a>
                )}
            </div>
          </div>
          
          {/* Próxima Ação */}
          {!isClosed && (
            <div className="space-y-2">
                <h3 className="text-lg font-semibold border-b pb-1">Próxima Ação</h3>
                <div className="flex items-center space-x-2">
                    <Input 
                        type="date" 
                        value={nextActionDate} 
                        onChange={(e) => setNextActionDate(e.target.value)} 
                        disabled={isUpdating}
                        className="w-40"
                    />
                    <Button 
                        onClick={handleUpdateNextAction} 
                        disabled={isUpdating || !nextActionDate}
                        className="bg-dyad-500 hover:bg-dyad-600"
                    >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                        Salvar Data
                    </Button>
                </div>
            </div>
          )}

          {/* Histórico de Interações / Notas */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold border-b pb-1">Histórico de Interações ({lead.notes.length})</h3>
            <div className="max-h-40 overflow-y-auto space-y-3 pr-2">
                {lead.notes.slice().reverse().map((note, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-1">{formatDateTime(note.date)}</p>
                        <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    </div>
                ))}
            </div>
            
            {/* Adicionar Nota Rápida */}
            {!isClosed && (
                <div className="pt-4">
                    <Label htmlFor="newNote">Adicionar Nota Rápida</Label>
                    <div className="flex space-x-2 mt-1">
                        <Textarea 
                            id="newNote"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Nova nota sobre a interação..."
                            rows={2}
                            disabled={isUpdating}
                        />
                        <Button 
                            onClick={handleAddNote} 
                            size="icon" 
                            className="h-10 w-10 bg-dyad-500 hover:bg-dyad-600 flex-shrink-0 self-start"
                            disabled={isUpdating || !newNote.trim()}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleDeleteLead} disabled={isDeleting || isConverting}>
                <Trash2 className="h-4 w-4 mr-2 text-red-500" /> Excluir Lead
            </Button>
            
            {!isClosed && (
                <div className="flex space-x-2">
                    <Button 
                        onClick={() => handleConvertLead('Fechado (Perdido)')} 
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        disabled={isUpdating || isConverting}
                    >
                        <XCircle className="h-4 w-4 mr-2" /> Fechado (Perdido)
                    </Button>
                    <Button 
                        onClick={() => handleConvertLead('Fechado (Ganho)')} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isUpdating || isConverting}
                    >
                        {isConverting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Fechado (Ganho)
                    </Button>
                </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};