import React, { useMemo, useState } from 'react';
import { Post } from '@/types/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Send, MessageSquare } from 'lucide-react';
import { showSuccess } from '@/utils/toast';
import { useClientStore } from '@/hooks/use-client-store';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PostApprovalLinkDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Agora recebemos o clientId diretamente
  clientId: string; 
}

export const PostApprovalLinkDialog: React.FC<PostApprovalLinkDialogProps> = ({ isOpen, onOpenChange, clientId }) => {
  const { getClientById } = useClientStore();
  const client = getClientById(clientId);
  const [includeFeedback, setIncludeFeedback] = useState(false); // Novo estado para o switch
  
  const approvalListLink = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://default-app-url.com';
    let link = `${origin}/approval/client/${clientId}`;
    
    if (includeFeedback) {
        link += '?feedback=true';
    }
    return link;
  }, [clientId, includeFeedback]);
  
  const clientName = client?.name || 'Cliente';

  // Mensagem pronta conforme solicitado
  const approvalMessage = `Olá ${clientName}! Seus posts estão prontos para aprovação. Acesse o link abaixo para revisar e aprovar 👇\n\n${approvalListLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(approvalListLink);
    showSuccess('Link de aprovação copiado!');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(approvalMessage);
    showSuccess('Mensagem copiada!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link de Aprovação em Massa</DialogTitle>
          <DialogDescription>
            Gere e compartilhe o link para que o cliente possa aprovar todos os posts pendentes de {clientName}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* Opção de Feedback */}
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-md bg-muted/50">
            <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-dyad-500" />
                <Label htmlFor="include-feedback" className="text-sm font-medium">Incluir Pesquisa de Feedback?</Label>
            </div>
            <Switch
              id="include-feedback"
              checked={includeFeedback}
              onCheckedChange={setIncludeFeedback}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Link Público (Todos os Posts Pendentes)</label>
            <Input value={approvalListLink} readOnly />
            <Button onClick={handleCopyLink} className="w-full" variant="outline">
              <Copy className="h-4 w-4 mr-2" /> Copiar Apenas o Link
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem Pronta</label>
            <Textarea value={approvalMessage} readOnly rows={4} />
            <Button onClick={handleCopyMessage} className="w-full bg-dyad-500 hover:bg-dyad-600">
              <Send className="h-4 w-4 mr-2" /> Copiar Mensagem para WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};