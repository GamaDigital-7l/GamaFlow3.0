import React from 'react';
import { DollarSign, Briefcase, CreditCard, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './financeiro/OverviewTab';
import ClientsTab from './financeiro/ClientsTab';
import CardsTab from './financeiro/CardsTab';
import RecurrencesTab from './financeiro/RecurrencesTab';
import { withRole } from '@/components/withRole';
import { cn } from '@/lib/utils';

const FinanceiroPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
        <DollarSign className="h-7 w-7 text-dyad-500" />
        <span>Módulo Financeiro</span>
      </h1>
      <p className="text-muted-foreground">Gestão completa de receitas, despesas, clientes e assinaturas da agência.</p>
      
      <Tabs defaultValue="overview">
        {/* Ajuste para grid de 2 colunas no mobile, 4 no desktop */}
        <TabsList className={cn("grid w-full grid-cols-2 md:grid-cols-4 h-auto flex-wrap")}>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span>Empresas</span>
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Cartões/Assinaturas</span>
          </TabsTrigger>
          <TabsTrigger value="recurrences" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recorrências</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-4">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          <CardsTab />
        </TabsContent>
        <TabsContent value="recurrences" className="mt-4">
          <RecurrencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default withRole(FinanceiroPage, 'admin');