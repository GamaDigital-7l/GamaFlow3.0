import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/hooks/use-client-store';
import { format, parseISO, isSameMonth, isSameYear, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText, Clock, CheckCircle, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, generateMonthOptions } from '@/utils/date';
import { Button } from '@/components/ui/button';

interface DemandHistoryPageProps {
  clientId: string;
}

const DemandHistoryPage: React.FC<DemandHistoryPageProps> = ({ clientId }) => {
  const { getClientById } = useClientStore();
  const client = getClientById(clientId);
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  const currentIndex = monthOptions.findIndex(opt => opt.value === selectedMonthYear);
  const isFirstMonth = currentIndex === 0;
  const isLastMonth = currentIndex === monthOptions.length - 1;

  const handlePrevMonth = () => {
    if (currentIndex < monthOptions.length - 1) {
        setSelectedMonthYear(monthOptions[currentIndex + 1].value);
    }
  };

  const handleNextMonth = () => {
    if (currentIndex > 0) {
        setSelectedMonthYear(monthOptions[currentIndex - 1].value);
    }
  };

  const filteredDemands = useMemo(() => {
    if (!client) return [];

    const targetMonthYear = selectedMonthYear;
    
    // Filtra posts que são do mês/ano selecionado
    return client.posts
      .filter(post => {
        // Usa monthYear se existir, senão calcula a partir de dueDate
        const postMonthYear = post.monthYear && post.monthYear.length === 7 
            ? post.monthYear 
            : format(post.dueDate, 'yyyy-MM');
        return postMonthYear === targetMonthYear;
      })
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()); // Mais recentes primeiro
  }, [client, selectedMonthYear]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Produção': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white"><Clock className="h-3 w-3 mr-1" /> Em Produção</Badge>;
      case 'Aprovação': return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white"><FileText className="h-3 w-3 mr-1" /> Em Revisão</Badge>;
      case 'Edição': return <Badge className="bg-red-500 hover:bg-red-600 text-white"><Repeat className="h-3 w-3 mr-1" /> Edição Solicitada</Badge>;
      case 'Aprovado': return <Badge className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Aprovado</Badge>;
      case 'Publicado': return <Badge className="bg-purple-500 hover:bg-purple-600 text-white"><CheckCircle className="h-3 w-3 mr-1" /> Publicado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Histórico de Demandas</h2>
        
        {/* Navegação de Mês */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrevMonth}
                className="h-8 w-8"
                disabled={isLastMonth}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg w-40 text-center flex-shrink-0">
                {format(parseISO(selectedMonthYear + '-01'), 'MMMM/yyyy', { locale: ptBR })}
            </span>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextMonth}
                className="h-8 w-8"
                disabled={isFirstMonth}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <p className="text-muted-foreground">Acompanhe o status de todos os posts e solicitações de trabalho deste mês.</p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posts e Demandas de {format(parseISO(selectedMonthYear + '-01'), 'MMMM/yyyy', { locale: ptBR })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Título</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma demanda ou post encontrado para este mês.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDemands.map(post => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{formatDate(post.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandHistoryPage;