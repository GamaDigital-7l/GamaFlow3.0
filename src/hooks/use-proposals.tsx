import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesProposal, ProposalStatus, ProposalSection, ProposalBranding } from '@/types/proposal';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';

const PROPOSALS_QUERY_KEY = 'salesProposals';

// --- Mapeamento e Conversão ---

const mapSupabaseProposalToProposal = (data: any): SalesProposal => ({
  id: data.id,
  user_id: data.user_id,
  title: data.title,
  client_name: data.client_name,
  status: data.status as ProposalStatus,
  sections: data.sections as ProposalSection[],
  branding_config: data.branding_config as ProposalBranding,
  ai_summary: data.ai_summary || undefined,
  public_link_id: data.public_link_id,
  created_at: data.created_at,
});

// --- Funções CRUD ---

const fetchProposals = async (): Promise<SalesProposal[]> => {
  // RLS garante que apenas admins vejam todas as propostas
  const { data, error } = await supabase
    .from('sales_proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseProposalToProposal);
};

const upsertProposalToDB = async (proposal: Omit<SalesProposal, 'user_id' | 'created_at' | 'public_link_id'> & { id?: string }): Promise<SalesProposal> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    id: proposal.id || uuidv4(),
    user_id: user.id,
    title: proposal.title,
    client_name: proposal.client_name,
    status: proposal.status,
    sections: proposal.sections,
    branding_config: proposal.branding_config,
    ai_summary: proposal.ai_summary || null,
    // public_link_id é gerado por default no DB se for novo
  };

  const { data, error } = await supabase
    .from('sales_proposals')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseProposalToProposal(data);
};

const deleteProposalFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('sales_proposals').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const useProposals = () => {
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<SalesProposal[], Error>({
    queryKey: [PROPOSALS_QUERY_KEY],
    queryFn: fetchProposals,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertProposalToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] });
      showSuccess('Proposta salva com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao salvar proposta: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProposalFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] });
      showSuccess('Proposta excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir proposta: ${err.message}`);
    },
  });
  
  const getProposalByPublicId = (publicId: string) => {
      return proposals.find(p => p.public_link_id === publicId);
  };

  return {
    proposals,
    isLoading,
    upsertProposal: upsertMutation.mutate,
    deleteProposal: deleteMutation.mutate,
    isMutating: upsertMutation.isPending || deleteMutation.isPending,
    getProposalByPublicId,
  };
};