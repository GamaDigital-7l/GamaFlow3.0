import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, FileText, Edit, Trash2, Link as LinkIcon, Copy, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProposals } from '@/hooks/use-proposals';
import { SalesProposal, ProposalStatus } from '@/types/proposal';
import { withRole } from '@/components/withRole';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import { ProposalForm } from '@/components/proposals/ProposalForm'; // Componente a ser criado
import { showSuccess } from '@/utils/toast';

const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
        case 'Draft': return <Badge variant="secondary">Rascunho</Badge>;
        case 'Sent': return <Badge className="bg-blue-500 hover:bg-blue-600">Enviada</Badge>;
        case 'Accepted': return <Badge className="bg-green-600 hover:bg-green-700">Aceita</Badge>;
        case 'Rejected': return <Badge className="bg-red-600 hover:bg-red-700">Rejeitada</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

const ProposalsPage: React.FC = () => {
  const { proposals, isLoading, upsertProposal, deleteProposal, isMutating } = useProposals();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<SalesProposal | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditingProposal(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (proposal: SalesProposal) => {
    setEditingProposal(proposal);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProposal(undefined);
  };
  
  const handleCopyLink = (publicId: string) => {
    const origin = window.location.origin;
    const link = `${origin}/proposal/public/${publicId}`;
    navigator.clipboard.writeText(link);
    showSuccess('Link público da proposta copiado!');
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando propostas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <FileText className="h-7 w-7 text-dyad-500" />
          <span>Propostas Comerciais</span>
        </h1>
        <Button 
          onClick={handleOpenCreate} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isMutating}
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Proposta
        </Button>
      </div>
      
      <p className="text-muted-foreground">Crie e gerencie propostas de vendas dinâmicas para seus clientes.</p>

      {/* Ajuste do grid para 1 coluna no mobile, 2 no md, 3 no lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.length === 0 ? (
          <p className="col-span-full text-center p-8 text-muted-foreground border rounded-lg">
            Nenhuma proposta criada ainda.
          </p>
        ) : (
          proposals.map(proposal => (
            <Card key={proposal.id} className="flex flex-col justify-between h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl pr-4">{proposal.title}</CardTitle>
                    {getStatusBadge(proposal.status)}
                </div>
                <p className="text-sm text-muted-foreground">Cliente: {proposal.client_name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                    Criado em: {formatDateTime(proposal.created_at)}
                </div>
                
                <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(proposal)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCopyLink(proposal.public_link_id)}>
                        <LinkIcon className="h-4 w-4 mr-2" /> Link Público
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteProposal(proposal.id)} disabled={isMutating} className="text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProposal ? 'Editar Proposta' : 'Criar Nova Proposta Comercial'}</DialogTitle>
          </DialogHeader>
          <ProposalForm 
            initialData={editingProposal}
            onSubmit={upsertProposal}
            onCancel={handleCloseDialog}
            isSubmitting={isMutating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withRole(ProposalsPage, 'admin');