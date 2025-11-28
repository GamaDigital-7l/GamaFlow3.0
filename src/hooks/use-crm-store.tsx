import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStatus, CrmColumn, LeadContactInfo, LeadNote, LeadOrigin } from '@/types/crm';
import { showSuccess, showError } from '@/utils/toast';
import { DropResult } from 'react-beautiful-dnd';
import { useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useClientStore } from './use-client-store'; // Para integração
import { differenceInDays } from 'date-fns';
import { useTelegramNotifications } from './use-telegram-notifications'; // Importando o hook de notificação
import { useWhatsappNotifications } from './use-whatsapp-notifications'; // NOVO

const LEADS_QUERY_KEY = 'crmLeads';
const CONVERT_LEAD_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/convert-lead-to-client';

const CRM_COLUMN_ORDER: LeadStatus[] = [
  'Prospectando',
  'Contato Feito',
  'Reunião Agendada',
  'Proposta Enviada',
  'Fechado (Ganho)',
  'Fechado (Perdido)',
];

// Mapeamento de snake_case para camelCase
const mapSupabaseLeadToLead = (data: any): Lead => ({
  id: data.id,
  user_id: data.user_id,
  name: data.name,
  contactInfo: data.contact_info || {},
  status: data.status as LeadStatus,
  potentialValue: data.potential_value ? parseFloat(data.potential_value) : undefined,
  origin: data.origin as LeadOrigin,
  notes: data.notes || [],
  firstContactDate: data.first_contact_date ? new Date(data.first_contact_date) : new Date(),
  nextActionDate: data.next_action_date ? new Date(data.next_action_date) : undefined,
  createdAt: data.created_at,
});

// --- Funções de Interação com o Supabase ---

const fetchLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data.map(mapSupabaseLeadToLead);
};

const addLeadToDB = async (newLead: Omit<Lead, 'id' | 'user_id' | 'createdAt' | 'firstContactDate' | 'notes'> & { notes: LeadNote[] }): Promise<Lead> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('leads')
    .insert({
      user_id: user.id,
      name: newLead.name,
      contact_info: newLead.contactInfo,
      status: newLead.status,
      potential_value: newLead.potentialValue,
      origin: newLead.origin,
      notes: newLead.notes,
      next_action_date: newLead.nextActionDate?.toISOString(),
      first_contact_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseLeadToLead(data);
};

const updateLeadInDB = async (updatedLead: Lead): Promise<Lead> => {
  const { id, name, contactInfo, status, potentialValue, origin, notes, nextActionDate } = updatedLead;

  const { data, error } = await supabase
    .from('leads')
    .update({
      name,
      contact_info: contactInfo,
      status,
      potential_value: potentialValue,
      origin,
      notes,
      next_action_date: nextActionDate?.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseLeadToLead(data);
};

const deleteLeadFromDB = async (leadId: string): Promise<void> => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    throw new Error(error.message);
  }
};

// Edge Function call to delete lead after conversion
const deleteLeadViaEdgeFunction = async (leadId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de admin necessária.");

    const response = await fetch(CONVERT_LEAD_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ leadId }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to delete lead via Edge Function.');
    }
};


// --- Hook Principal ---

export function useCrmStore() {
  const queryClient = useQueryClient();
  const { addClient } = useClientStore(); // Hook para adicionar cliente
  const { notifyTaskAction } = useTelegramNotifications(); // Hook de notificação

  const { data: leads = [], isLoading, error } = useQuery<Lead[], Error>({
    queryKey: [LEADS_QUERY_KEY],
    queryFn: fetchLeads,
    staleTime: 300000, // 5 minutos de cache
  });

  const addMutation = useMutation({
    mutationFn: addLeadToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
      showSuccess('Novo lead adicionado!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar lead: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateLeadInDB,
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
      // Adicionando um toast sutil para confirmar o movimento
      showSuccess(`Lead "${updatedLead.name}" movido para ${updatedLead.status}.`);
    },
    onError: (err) => {
      showError(`Erro ao atualizar lead: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeadFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
      showSuccess('Lead excluído.');
    },
    onError: (err) => {
      showError(`Erro ao excluir lead: ${err.message}`);
    },
  });
  
  const convertMutation = useMutation({
    mutationFn: async (lead: Lead) => {
        // 1. Adicionar como Cliente no useClientStore (simulação de DB)
        const newClientData = {
            name: lead.name,
            logoUrl: '/placeholder.svg',
            status: 'Ativo' as const,
            type: 'Fixo' as const,
            color: '#3b82f6', // Cor padrão
            phone: lead.contactInfo.phone,
            email: lead.contactInfo.email,
            monthlyPostGoal: 8, // Meta padrão
        };
        
        // addClient retorna o ID do novo cliente
        const newClientId = await addClient(newClientData); 
        
        // 2. Deletar o lead do Supabase via Edge Function
        await deleteLeadViaEdgeFunction(lead.id);
        
        return newClientId;
    },
    onSuccess: (newClientId, lead) => {
        queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: ['allClients'] }); // Invalida a lista de clientes
        showSuccess(`Lead "${lead.name}" convertido para Cliente Ativo!`);
        return newClientId;
    },
    onError: (err) => {
        showError(`Falha na conversão: ${err.message}`);
    }
  });
  
  // --- Lógica de Notificação de Inatividade (Stale Leads) ---
  useEffect(() => {
    if (isLoading) return;
    
    const checkStaleLeads = () => {
        const STALE_DAYS = 14;
        const now = new Date();
        
        leads.filter(l => 
            l.status !== 'Fechado (Ganho)' && 
            l.status !== 'Fechado (Perdido)'
        ).forEach(lead => {
            const lastNote = lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;
            const lastContactDate = lastNote ? new Date(lastNote.date) : lead.firstContactDate;
            
            const daysSinceLastContact = differenceInDays(now, lastContactDate);
            
            if (daysSinceLastContact >= STALE_DAYS) {
                const notificationKey = `stale-lead-${lead.id}`;
                
                // Notifica apenas uma vez por lead inativo (até que ele seja movido ou atualizado)
                if (!localStorage.getItem(notificationKey)) {
                    notifyTaskAction(
                        lead.name, 
                        'LEAD ESTAGNADO', 
                        'CRM', 
                        `Último contato há ${daysSinceLastContact} dias. Status: ${lead.status}`
                    );
                    localStorage.setItem(notificationKey, 'true'); // Marca como notificado
                }
            } else {
                // Se o lead foi reativado, remove a chave de notificação
                localStorage.removeItem(`stale-lead-${lead.id}`);
            }
        });
    };
    
    // Executa a verificação a cada 12 horas (simulação de cron job)
    const intervalId = setInterval(checkStaleLeads, 12 * 60 * 60 * 1000);
    checkStaleLeads(); // Executa imediatamente na montagem

    return () => clearInterval(intervalId);
  }, [leads, isLoading, notifyTaskAction]);


  // --- Kanban Logic ---

  const getKanbanData = useMemo(() => {
    const leadsMap = leads.reduce((acc, lead) => {
      acc[lead.id] = lead;
      return acc;
    }, {} as Record<string, Lead>);

    const columns: Record<LeadStatus, CrmColumn> = CRM_COLUMN_ORDER.reduce((acc, status) => {
      acc[status] = {
        id: status,
        title: status,
        leadIds: leads
          .filter(lead => lead.status === status)
          .sort((a, b) => a.firstContactDate.getTime() - b.firstContactDate.getTime())
          .map(lead => lead.id),
      };
      return acc;
    }, {} as Record<LeadStatus, CrmColumn>);

    return { columns, columnOrder: CRM_COLUMN_ORDER, leadsMap };
  }, [leads]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const leadToMove = leads.find(l => l.id === draggableId);
    if (!leadToMove) return;

    const newStatus = destination.droppableId as LeadStatus;

    // Se o status mudou, atualiza o lead
    if (leadToMove.status !== newStatus) {
      updateMutation.mutate({
        ...leadToMove,
        status: newStatus,
      });
    }
  }, [leads, updateMutation]);
  
  const getLeadById = useCallback((leadId: string) => {
    return leads.find(l => l.id === leadId);
  }, [leads]);
  
  const addNoteToLead = useCallback((leadId: string, noteText: string) => {
    const lead = getLeadById(leadId);
    if (!lead) return;
    
    const newNote: LeadNote = {
        date: new Date().toISOString(),
        text: noteText,
    };
    
    const updatedLead: Lead = {
        ...lead,
        notes: [...lead.notes, newNote],
    };
    
    updateMutation.mutate(updatedLead);
  }, [getLeadById, updateMutation]);


  return {
    ...getKanbanData,
    handleDragEnd,
    leads,
    isLoading,
    addLead: addMutation.mutate,
    updateLead: updateMutation.mutate,
    deleteLead: deleteMutation.mutate,
    convertLead: convertMutation.mutateAsync,
    addNoteToLead,
    getLeadById,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending || convertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}