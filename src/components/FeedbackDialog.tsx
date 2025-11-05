import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramNotifications } from '@/hooks/use-telegram-notifications'; // Importando o hook
import { useClientStore } from '@/hooks/use-client-store'; // Para obter o nome do cliente

interface FeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onFeedbackSent: () => void;
}

// Função para enviar feedback para a tabela client_feedback E client_interactions
const sendFeedback = async (clientId: string, feedback: string, type: 'praise' | 'improvement') => {
    const { error: feedbackError } = await supabase
        .from('client_feedback')
        .insert({ 
            client_id: clientId, 
            feedback: feedback, 
            type: type 
        });
    
    if (feedbackError) {
        throw new Error(feedbackError.message);
    }
    
    // Registrar interação na tabela client_interactions
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { error: interactionError } = await supabase
            .from('client_interactions')
            .insert({
                client_id: clientId,
                user_id: user.id,
                interaction_type: 'feedback',
                content: `Feedback do cliente (${type}): ${feedback}`,
            });
        
        if (interactionError) {
            console.error("Failed to register client interaction for feedback:", interactionError);
        }
    }
};

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ isOpen, onOpenChange, clientId, onFeedbackSent }) => {
  const { notifyClientAction } = useTelegramNotifications();
  const { getClientById } = useClientStore();
  const client = getClientById(clientId);
  
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'praise' | 'improvement' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !feedbackType) {
      showError('Selecione um tipo de feedback e preencha o texto.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFeedback(clientId, feedbackText, feedbackType);
      
      // Notificação Telegram
      const clientName = client?.name || 'Cliente Desconhecido';
      const action = `NOVO FEEDBACK (${feedbackType === 'praise' ? 'Elogio' : 'Melhoria'})`;
      notifyClientAction(clientName, action, 'Geral', feedbackText.substring(0, 100) + '...');
      
      setIsSubmitted(true);
      onFeedbackSent(); // Notifica a página pai
    } catch (error) {
      showError('Erro ao enviar feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    if (!isSubmitting) {
        onOpenChange(false);
        // Resetar estado após fechar
        setTimeout(() => {
            setFeedbackText('');
            setFeedbackType(null);
            setIsSubmitted(false);
        }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-6 w-6 text-dyad-500" />
            <span>Sua Opinião é Importante!</span>
          </DialogTitle>
        </DialogHeader>
        
        {isSubmitted ? (
            <div className="text-center py-8">
                <ThumbsUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Obrigado por nos ajudar a melhorar a cada dia!</h3>
                <p className="text-muted-foreground mt-2">Seu feedback foi registrado com sucesso.</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                Gostaríamos de saber sua opinião sobre o processo de aprovação.
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                    type="button" 
                    variant={feedbackType === 'praise' ? 'default' : 'outline'}
                    className={feedbackType === 'praise' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    onClick={() => setFeedbackType('praise')}
                    disabled={isSubmitting}
                >
                    <ThumbsUp className="h-4 w-4 mr-2" /> Elogio
                </Button>
                <Button 
                    type="button" 
                    variant={feedbackType === 'improvement' ? 'default' : 'outline'}
                    className={feedbackType === 'improvement' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    onClick={() => setFeedbackType('improvement')}
                    disabled={isSubmitting}
                >
                    <ThumbsDown className="h-4 w-4 mr-2" /> Melhoria
                </Button>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="feedback">Seu Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="O que você gostaria de elogiar ou sugerir?"
                  rows={4}
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !feedbackText.trim() || !feedbackType} className="bg-dyad-500 hover:bg-dyad-600">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Enviar Feedback'}
                </Button>
              </DialogFooter>
            </form>
        )}
        
        {isSubmitted && (
            <DialogFooter>
                <Button onClick={handleClose} variant="outline">
                    Fechar
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};