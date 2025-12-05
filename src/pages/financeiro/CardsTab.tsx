import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Loader2, CreditCard, Zap, Calendar, Edit, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SubscriptionForm } from '@/components/finance/SubscriptionForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Subscription } from '@/types/finance';
import { Badge } from '@/components/ui/badge';

const CardsTab: React.FC = () => {
  const { cards, subscriptions, isLoading, deleteSubscription, renewSubscription, updateSubscription, isMutating } = useFinanceStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>(undefined);

  const totalMonthlySubscriptionCost = useMemo(() => {
    return subscriptions
      .filter(s => s.isActive && s.frequency === 'monthly')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [subscriptions]);
  
  const subscriptionChartData = useMemo(() => {
    const categoryMap = subscriptions
      .filter(s => s.isActive && s.frequency === 'monthly' && s.category)
      .reduce((acc, s) => {
        acc[s.category!] = (acc[s.category!] || 0) + s.amount;
        return acc;
      }, {} as Record<string, number>);
      
    return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        Custo: value,
    }));
  }, [subscriptions]);
  
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
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cartões e Assinaturas da Agência</h2>
      <p className="text-muted-foreground">Gerencie os gastos recorrentes e monitore o uso dos cartões.</p>

      {/* Cartões */}
      <Card>
        <CardHeader><CardTitle className="text-xl">Cartões de Crédito (Simulado)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(card => (
            <Card key={card.id} className="p-4 border-l-4 border-dyad-500/50 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center space-x-2"><CreditCard className="h-5 w-5 text-dyad-500" /> <span>{card.name}</span></h3>
                <Badge variant="secondary">Limite: {formatCurrency(card.limit)}</Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Utilizado: {formatCurrency(card.used)}</p>
                <Progress value={(card.used / card.limit) * 100} className="h-2" indicatorClassName={card.used / card.limit > 0.7 ? 'bg-red-500' : 'bg-dyad-500'} />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fechamento: Dia {card.closingDate}</span>
                <span>Vencimento: Dia {card.dueDate}</span>
              </div>
              
              <p className="text-sm font-medium pt-2 border-t">Assinaturas Vinculadas: {card.subscriptions.length}</p>
            </Card>
          ))}
        </CardContent>
      </Card>
      
      {/* Assinaturas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Assinaturas Ativas ({subscriptions.filter(s => s.isActive).length})</CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)} className="bg-dyad-500 hover:bg-dyad-600">
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-semibold">Custo Mensal Total: <span className="text-red-500">{formatCurrency(totalMonthlySubscriptionCost)}</span></p>
          
          {/* Ajuste para grid de 1 coluna no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map(sub => (
              <div key={sub.id} className="p-3 border rounded-lg flex justify-between items-center bg-muted/30">
                <div className="space-y-1 min-w-0 pr-4">
                  <h4 className="font-semibold truncate">{sub.name}</h4>
                  <div className="flex items-center text-sm text-muted-foreground space-x-2">
                    <span className="text-red-500 font-medium">- {formatCurrency(sub.amount)}</span>
                    <Badge variant="secondary" className="text-xs">{sub.frequency}</Badge>
                    <Badge variant="outline" className="text-xs">{sub.paymentMethod}</Badge>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEditSubscription(sub)} disabled={isMutating}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteSubscription(sub.id)} disabled={isMutating}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Card className="mt-6">
            <CardHeader><CardTitle>Distribuição de Custo Mensal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subscriptionChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={v => formatCurrency(v as number)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Custo" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubscription ? 'Editar Assinatura' : 'Adicionar Nova Assinatura'}</DialogTitle>
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

export default CardsTab;