import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Goal, GoalCategory, GoalStatus, PortfolioGoalType, PortfolioCategory } from '@/types/goals';
import { showError } from '@/utils/toast';
import { useClientStore } from '@/hooks/use-client-store';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando o novo componente

interface GoalFormProps {
  initialData?: Goal;
  onSubmit: (goal: Omit<Goal, 'id' | 'user_id' | 'createdAt'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CATEGORY_OPTIONS: GoalCategory[] = ['Financeiro', 'Pessoal', 'Profissional', 'Saúde', 'Clientes', 'Agência', 'Outros'];
const STATUS_OPTIONS: GoalStatus[] = ['Em Andamento', 'Concluída', 'Atrasada'];
const PORTFOLIO_TYPE_OPTIONS: PortfolioGoalType[] = ['Projeto Real', 'Projeto Conceito', 'Estudo Pessoal'];
const PORTFOLIO_CATEGORY_OPTIONS: PortfolioCategory[] = ['Design', '3D', 'Vídeo', 'Landing Page', 'Social Media', 'Outro'];

export const GoalForm: React.FC<GoalFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { clients } = useClientStore();
  
  const getInitialClientId = (id?: string) => {
    if (id === '' || id === null || id === undefined) return 'none';
    return id;
  };

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<GoalCategory>(initialData?.category || 'Profissional');
  const [startDate, setStartDate] = useState<Date | undefined>(initialData?.startDate || new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(initialData?.dueDate || undefined);
  const [targetValue, setTargetValue] = useState(initialData?.targetValue?.toString() || '');
  const [currentValue, setCurrentValue] = useState(initialData?.currentValue?.toString() || '0');
  const [isRecurrent, setIsRecurrent] = useState(initialData?.isRecurrent || false);
  const [status, setStatus] = useState<GoalStatus>(initialData?.status || 'Em Andamento');
  // Garante que clientId seja 'none' se for nulo, indefinido ou string vazia
  const [clientId, setClientId] = useState(getInitialClientId(initialData?.clientId)); 
  
  // Portfolio Fields
  const [isPortfolioGoal, setIsPortfolioGoal] = useState(initialData?.isPortfolioGoal || false);
  const [portfolioType, setPortfolioType] = useState<PortfolioGoalType>(initialData?.portfolioType || 'Projeto Conceito');
  const [portfolioCategory, setPortfolioCategory] = useState<PortfolioCategory>(initialData?.portfolioCategory || 'Design');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(initialData?.portfolioLinks || []);
  const [newLink, setNewLink] = useState('');


  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setStartDate(initialData.startDate);
      setDueDate(initialData.dueDate);
      setTargetValue(initialData.targetValue?.toString() || '');
      setCurrentValue(initialData.currentValue?.toString() || '0');
      setIsRecurrent(initialData.isRecurrent);
      setStatus(initialData.status);
      // Mapeia clientId nulo/vazio para 'none' para o Select
      setClientId(getInitialClientId(initialData.clientId)); 
      
      // Portfolio
      setIsPortfolioGoal(initialData.isPortfolioGoal || false);
      setPortfolioType(initialData.portfolioType || 'Projeto Conceito');
      setPortfolioCategory(initialData.portfolioCategory || 'Design');
      setPortfolioLinks(initialData.portfolioLinks || []);
    }
  }, [initialData]);

  const handleAddLink = () => {
    if (newLink.trim()) {
      setPortfolioLinks(prev => [...prev, newLink.trim()]);
      setNewLink('');
    }
  };
  
  const handleRemoveLink = (index: number) => {
    setPortfolioLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleClientIdChange = (value: string) => {
    setClientId(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('O título da meta é obrigatório.');
      return;
    }
    if (!dueDate) {
        showError('A data de vencimento é obrigatória.');
        return;
    }
    
    const parsedTargetValue = targetValue ? parseFloat(targetValue) : undefined;
    if (targetValue && (isNaN(parsedTargetValue) || parsedTargetValue < 0)) {
        showError('Valor alvo deve ser um número válido.');
        return;
    }
    
    const parsedCurrentValue = currentValue ? parseFloat(currentValue) : 0;
    if (isNaN(parsedCurrentValue) || parsedCurrentValue < 0) {
        showError('Valor atual deve ser um número válido.');
        return;
    }

    const finalClientId = clientId === 'none' ? undefined : clientId;

    const goalData: Omit<Goal, 'id' | 'user_id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      startDate: startDate || new Date(),
      dueDate,
      targetValue: parsedTargetValue,
      currentValue: parsedCurrentValue,
      isRecurrent,
      status,
      clientId: finalClientId,
      isPortfolioGoal,
      portfolioType: isPortfolioGoal ? portfolioType : undefined,
      portfolioCategory: isPortfolioGoal ? portfolioCategory : undefined,
      portfolioLinks: isPortfolioGoal ? portfolioLinks : undefined,
    };

    onSubmit(goalData);
  };
  
  const categoryOptions = CATEGORY_OPTIONS.map(opt => ({ value: opt, label: opt }));
  const statusOptions = STATUS_OPTIONS.map(opt => ({ value: opt, label: opt }));
  const portfolioTypeOptions = PORTFOLIO_TYPE_OPTIONS.map(opt => ({ value: opt, label: opt }));
  const portfolioCategoryOptions = PORTFOLIO_CATEGORY_OPTIONS.map(opt => ({ value: opt, label: opt }));
  const clientOptions = [
    { value: 'none', label: 'Nenhum' },
    ...clients.map(client => ({ value: client.id, label: client.name }))
  ];


  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título da Meta</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
        <Label htmlFor="isPortfolioGoal" className="font-medium">Meta de Portfólio?</Label>
        <Switch
          id="isPortfolioGoal"
          checked={isPortfolioGoal}
          onCheckedChange={setIsPortfolioGoal}
          disabled={isSubmitting}
        />
      </div>

      {isPortfolioGoal && (
        <Card className="p-4 space-y-4 border-l-4 border-blue-500/50">
          <h3 className="text-lg font-semibold">Detalhes do Portfólio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HorizontalRadioSelect
                label="Tipo de Projeto"
                options={portfolioTypeOptions}
                value={portfolioType}
                onValueChange={(value) => setPortfolioType(value as PortfolioGoalType)}
                disabled={isSubmitting}
            />
            <HorizontalRadioSelect
                label="Categoria Criativa"
                options={portfolioCategoryOptions}
                value={portfolioCategory}
                onValueChange={(value) => setPortfolioCategory(value as PortfolioCategory)}
                disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="portfolioLinks">Links (Behance, Dribbble, etc.)</Label>
            <div className="space-y-2">
              {portfolioLinks.map((link, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={link} readOnly className="bg-muted/50" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(index)} disabled={isSubmitting}>
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input 
                value={newLink} 
                onChange={(e) => setNewLink(e.target.value)} 
                placeholder="Adicionar novo link"
                disabled={isSubmitting}
              />
              <Button type="button" onClick={handleAddLink} size="icon" disabled={isSubmitting || !newLink.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <HorizontalRadioSelect
            label="Categoria"
            options={categoryOptions}
            value={category}
            onValueChange={(value) => setCategory(value as GoalCategory)}
            disabled={isSubmitting}
        />
        <HorizontalRadioSelect
            label="Cliente Associado (Opcional)"
            options={clientOptions}
            value={clientId}
            onValueChange={handleClientIdChange}
            disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label>Data de Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="targetValue">Valor Alvo (Opcional)</Label>
          <Input 
            id="targetValue" 
            type="number" 
            step="0.01"
            value={targetValue} 
            onChange={(e) => setTargetValue(e.target.value)} 
            placeholder="Ex: 1000.00"
            disabled={isSubmitting} 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currentValue">Valor Atual</Label>
          <Input 
            id="currentValue" 
            type="number" 
            step="0.01"
            value={currentValue} 
            onChange={(e) => setCurrentValue(e.target.value)} 
            placeholder="0.00"
            disabled={isSubmitting} 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <Label htmlFor="isRecurrent" className="font-medium">Recorrente?</Label>
          <Switch
            id="isRecurrent"
            checked={isRecurrent}
            onCheckedChange={setIsRecurrent}
            disabled={isSubmitting}
          />
        </div>
        <HorizontalRadioSelect
            label="Status"
            options={statusOptions}
            value={status}
            onValueChange={(value) => setStatus(value as GoalStatus)}
            disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Meta'}
        </Button>
      </div>
    </form>
  );
};