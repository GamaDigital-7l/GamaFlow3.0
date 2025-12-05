import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Loader2, Plus, CheckCircle, AlertTriangle, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isPast, isSameDay, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { SubscriptionForm } from '@/components/finance/SubscriptionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Subscription } from '@/types/finance';
import { showSuccess } from '@/utils/toast';

const RecurrencesTab: React.FC = () => {
  const { subscriptions, isLoading, deleteSubscription, renewSubscription, updateSubscription, isMutating } = useFinanceStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>(undefined);

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubscription(undefined);
  };
  
  const handleRenew = (sub: Subscription) => {
    renewSubscription(sub);
    showSuccess(`Recorrência '${sub.name}' renovada para a próxima data.`);
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const alerts = useMemo(() => {
    return subscriptions.filter(sub => 
        sub.isActive && 
        !isPast(sub.nextDueDate) && 
        differenceInDays(sub.nextDueDate, new Date()) <= 7
    );
  }, [subscriptions]);

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Recorrências (Entradas e Saídas Fixas)</h2>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} className="bg-dyad-500 hover:bg-dyad-600">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Recorrência
        </Button>
      </div>
      <p className="text-muted-foreground">Controle de pagamentos e recebimentos fixos da agência.</p>
      
      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="p-4 border-l-4 border-yellow-500/50 bg-yellow-50/20 dark:bg-yellow-950/20">
            <h3 className="font-semibold text-yellow-600 flex items-center space-x-2"><AlertTriangle className="h-4 w-4" /> Alertas de Vencimento</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                {alerts.map(sub => (
                    <li key={sub.id}>
                        O pagamento de **{sub.name}** ({formatCurrency(sub.amount)}) vence em {differenceInDays(sub.nextDueDate, new Date())} dias ({format(sub.nextDueDate, 'dd/MM/yyyy')}).
                    </li>
                ))}
            </ul>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Recorrência</TableHead>
                  <TableHead>Próxima Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma recorrência cadastrada.</TableCell></TableRow>
                ) : (
                  subscriptions.map(sub => {
                    const isPastDue = isPast(sub.nextDueDate) && !isSameDay(sub.nextDueDate, new Date());
                    
                    return (
                      <TableRow key={sub.id} className={cn(
                          isPastDue && 'bg-red-50/50 dark:bg-red-950/50',
                          !sub.isActive && 'opacity-50'
                      )}>
                        <TableCell className="font-medium">{sub.name}</TableCell>
                        <TableCell>
                          <span className={cn("font-semibold", sub.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                              {sub.amount >= 0 ? 'Entrada' : 'Saída'}
                          </span>
                        </TableCell>
                        <TableCell className={cn("font-medium", sub.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {formatCurrency(Math.abs(sub.amount))}
                        </TableCell>
                        <TableCell>{sub.frequency}</TableCell>
                        <TableCell className={cn(isPastDue && 'text-red-600 font-semibold')}>
                          {format(sub.nextDueDate, 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-right flex justify-end space-x-2">
                          {isPastDue && (
                              <Button size="sm" onClick={() => handleRenew(sub)} disabled={isMutating} className="bg-green-600 hover:bg-green-700">
                                  <RefreshCw className="h-4 w-4 mr-1" /> Marcar Pago/Recebido
                              </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEditSubscription(sub)} disabled={isMutating}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSubscription(sub.id)} disabled={isMutating}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubscription ? 'Editar Recorrência' : 'Adicionar Nova Recorrência'}</DialogTitle>
          </DialogHeader>
          <SubscriptionForm 
            initialData={editingSubscription}
            onSubmit={updateSubscription}
            onCancel={handleCloseDialog}
            isSubmitting={isMutating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurrencesTab;