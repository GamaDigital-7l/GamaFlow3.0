import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Fuso horário de São Paulo (GMT-3)
// Nota: date-fns não lida nativamente com timezones complexos como 'America/Sao_Paulo' sem bibliotecas adicionais (como date-fns-tz).
// Para simplificar e focar no formato 24h e locale, usaremos as funções básicas, assumindo que as datas armazenadas
// já estão ajustadas ou que a exibição local é suficiente para a maioria dos casos de uso.

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "HH:mm", { locale: ptBR });
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
};

export const isTaskOverdue = (dueDate: Date | string): boolean => {
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  // Considera a tarefa atrasada se a data/hora for no passado
  return isPast(date);
};

export const getDaysOverdue = (dueDate: Date | string): number => {
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (!isTaskOverdue(date)) return 0;
  
  // Calcula a diferença em dias entre hoje e a data de vencimento
  // Se a tarefa venceu hoje, retorna 0. Se venceu ontem, retorna 1.
  return differenceInDays(new Date(), date);
};