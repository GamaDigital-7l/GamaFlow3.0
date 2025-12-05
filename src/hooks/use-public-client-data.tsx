import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, Post } from '@/types/client';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';

const PUBLIC_CLIENT_QUERY_KEY = 'publicClientData';

// Data de vencimento padrão muito futura (para posts sem data definida)
const DEFAULT_FUTURE_DATE = new Date(2099, 11, 31, 23, 59, 59, 999);

// Helper function to ensure date is a Date object
const ensureDate = (date: Date | string): Date => {
    if (date instanceof Date && !isNaN(date.getTime())) return date;
    try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
    } catch {}
    return DEFAULT_FUTURE_DATE; // Fallback
};

// Mapeamento de snake_case para camelCase
const mapSupabaseClientToClient = (data: any): Client => ({
  id: data.id,
  name: data.name,
  logoUrl: data.logo_url || '',
  status: data.status,
  type: data.type,
  color: data.color,
  phone: data.phone || undefined,
  whatsappNumber: data.whatsapp_number || undefined,
  email: data.email || undefined,
  cnpj: data.cnpj || undefined,
  monthlyPostGoal: data.monthly_post_goal,
  posts: (data.posts || []).map((post: any) => {
      const dueDate = ensureDate(post.dueDate);
      return {
          ...post,
          dueDate: dueDate,
          completedAt: post.completedAt ? ensureDate(post.completedAt) : undefined,
          monthYear: post.monthYear || format(dueDate, 'yyyy-MM'),
      };
  }) || [], 
});


const fetchPublicClientData = async (clientId: string): Promise<Client | null> => {
    if (!clientId) return null;

    // Nota: A RLS deve permitir a leitura pública de dados básicos do cliente
    // (apenas o necessário para a aprovação, como posts e logo).
    // Como a RLS atual só permite leitura por admin/cliente, precisamos de uma política
    // que permita a leitura de clientes por ID para a página pública.
    
    // Vamos assumir que a RLS para a tabela 'clients' será ajustada para permitir
    // a leitura de colunas específicas (logo, nome, posts) por anon.
    
    const { data, error } = await supabase
        .from('clients')
        .select('*') // Seleciona todas as colunas (incluindo posts)
        .eq('id', clientId)
        .single();

    if (error) {
        // Se o erro for 'No rows found', retorna null
        if (error.code === 'PGRST116') return null;
        // Se for erro de RLS, isso falhará, mas vamos tentar.
        console.error("Erro ao buscar cliente publicamente:", error);
        throw new Error(error.message);
    }
    
    return mapSupabaseClientToClient(data);
};

export const usePublicClientData = (clientId: string) => {
    const { data: client, isLoading, error } = useQuery<Client | null, Error>({
        queryKey: [PUBLIC_CLIENT_QUERY_KEY, clientId],
        queryFn: () => fetchPublicClientData(clientId),
        enabled: !!clientId,
        staleTime: 60000, // 1 minuto de cache
    });

    if (error) {
        console.error("Erro no usePublicClientData:", error);
    }

    return {
        client,
        isLoading,
        error,
    };
};