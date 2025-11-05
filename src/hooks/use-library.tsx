import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book, UserProgress, Highlight, ReadingStatus } from '@/types/book';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '@/components/SessionContextProvider';

const BOOKS_QUERY_KEY = 'libraryBooks';
const PROGRESS_QUERY_KEY = 'userProgress';
const HIGHLIGHTS_QUERY_KEY = 'userHighlights';

// --- Mapeamento ---

const mapSupabaseBookToBook = (data: any): Book => ({
  id: data.id,
  title: data.title,
  author: data.author,
  cover_url: data.cover_url,
  file_url: data.file_url,
  file_type: data.file_type,
  description: data.description,
  page_count: data.page_count,
  tags: data.tags || [],
  category: data.category,
  rating: data.rating,
  created_at: data.created_at,
});

const mapSupabaseProgressToProgress = (data: any): UserProgress => ({
  id: data.id,
  user_id: data.user_id,
  book_id: data.book_id,
  current_page: data.current_page,
  total_pages: data.total_pages,
  reading_status: data.reading_status as ReadingStatus,
  last_read_at: data.last_read_at,
  reading_time_seconds: data.reading_time_seconds,
  settings: data.settings || {},
});

// --- Funções de Busca ---

const fetchBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseBookToBook);
};

const fetchUserProgress = async (userId: string): Promise<UserProgress[]> => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseProgressToProgress);
};

const fetchHighlights = async (userId: string): Promise<Highlight[]> => {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Highlight[];
};

// --- Funções de Mutação ---

const upsertBookToDB = async (book: Omit<Book, 'created_at'> & { id?: string }): Promise<Book> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  
  // Apenas admins podem fazer upsert de livros
  // if (user.role !== 'admin') throw new Error("Apenas administradores podem gerenciar livros.");

  const payload = {
    id: book.id || uuidv4(),
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
    file_url: book.file_url,
    file_type: book.file_type,
    description: book.description,
    page_count: book.page_count,
    tags: book.tags,
    category: book.category,
    rating: book.rating,
  };

  const { data, error } = await supabase
    .from('books')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseBookToBook(data);
};

const upsertProgressToDB = async (progress: Omit<UserProgress, 'id' | 'user_id' | 'last_read_at'> & { id?: string }): Promise<UserProgress> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    id: progress.id,
    user_id: user.id,
    book_id: progress.book_id,
    current_page: progress.current_page,
    total_pages: progress.total_pages,
    reading_status: progress.reading_status,
    reading_time_seconds: progress.reading_time_seconds,
    settings: progress.settings,
    last_read_at: new Date().toISOString(),
  };
  
  // Usamos onConflict para garantir que haja apenas um registro por user_id e book_id
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id, book_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseProgressToProgress(data);
};

const upsertHighlightToDB = async (highlight: Omit<Highlight, 'id' | 'user_id' | 'created_at'> & { id?: string }): Promise<Highlight> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    id: highlight.id || uuidv4(),
    user_id: user.id,
    book_id: highlight.book_id,
    page_number: highlight.page_number,
    text_content: highlight.text_content,
    note: highlight.note,
    color: highlight.color,
  };

  const { data, error } = await supabase
    .from('highlights')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Highlight;
};

const deleteHighlightFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('highlights').delete().eq('id', id);
  if (error) throw new Error(error.message);
};


export const useLibrary = () => {
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingSession } = useSession();
  const userId = user?.id;
  const isEnabled = !!userId && !isLoadingSession;

  // 1. Livros (Catálogo)
  const { data: books = [], isLoading: isLoadingBooks } = useQuery<Book[], Error>({
    queryKey: [BOOKS_QUERY_KEY],
    queryFn: fetchBooks,
    enabled: isEnabled,
  });

  // 2. Progresso do Usuário
  const { data: progress = [], isLoading: isLoadingProgress } = useQuery<UserProgress[], Error>({
    queryKey: [PROGRESS_QUERY_KEY, userId],
    queryFn: () => fetchUserProgress(userId!),
    enabled: isEnabled,
  });
  
  // 3. Destaques e Anotações
  const { data: highlights = [], isLoading: isLoadingHighlights } = useQuery<Highlight[], Error>({
    queryKey: [HIGHLIGHTS_QUERY_KEY, userId],
    queryFn: () => fetchHighlights(userId!),
    enabled: isEnabled,
  });

  // --- Mutações ---
  
  const bookMutation = useMutation({
    mutationFn: upsertBookToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOOKS_QUERY_KEY] });
      showSuccess('Livro salvo no catálogo.');
    },
    onError: (err) => showError(`Erro ao salvar livro: ${err.message}`),
  });

  const progressMutation = useMutation({
    mutationFn: upsertProgressToDB,
    onSuccess: (newProgress) => {
      // Atualiza o cache localmente para evitar recarregar tudo
      queryClient.setQueryData<UserProgress[]>([PROGRESS_QUERY_KEY, userId], (oldData) => {
        if (!oldData) return [newProgress];
        return oldData.map(p => p.book_id === newProgress.book_id ? newProgress : p);
      });
      // showSuccess('Progresso sincronizado.'); // Silencioso para sincronização frequente
    },
    onError: (err) => console.error("Erro ao sincronizar progresso:", err.message),
  });
  
  const highlightMutation = useMutation({
    mutationFn: upsertHighlightToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HIGHLIGHTS_QUERY_KEY, userId] });
      showSuccess('Destaque/Anotação salva.');
    },
    onError: (err) => showError(`Erro ao salvar destaque: ${err.message}`),
  });
  
  const deleteHighlightMutation = useMutation({
    mutationFn: deleteHighlightFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HIGHLIGHTS_QUERY_KEY, userId] });
      showSuccess('Destaque excluído.');
    },
    onError: (err) => showError(`Erro ao excluir destaque: ${err.message}`),
  });

  // --- Funções de Acesso e Combinação ---
  
  const getBookById = (bookId: string) => books.find(b => b.id === bookId);
  
  const getProgressByBookId = (bookId: string) => progress.find(p => p.book_id === bookId);
  
  const getHighlightsByBookId = (bookId: string) => highlights.filter(h => h.book_id === bookId);

  const library = useMemo(() => {
    return books.map(book => {
      const userProgress = getProgressByBookId(book.id);
      return {
        ...book,
        progress: userProgress,
        readingStatus: userProgress?.reading_status || 'Quero Ler',
        currentPage: userProgress?.current_page || 0,
        lastReadAt: userProgress?.last_read_at,
      };
    });
  }, [books, progress]);
  
  const continueReading = useMemo(() => {
    return library
        .filter(b => b.readingStatus === 'Lendo')
        .sort((a, b) => new Date(b.lastReadAt || 0).getTime() - new Date(a.lastReadAt || 0).getTime());
  }, [library]);
  
  const popularBooks = useMemo(() => {
    return [...books].sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [books]);


  return {
    library,
    books,
    progress,
    highlights,
    isLoading: isLoadingBooks || isLoadingProgress || isLoadingHighlights,
    
    // Mutações
    upsertBook: bookMutation.mutate,
    upsertProgress: progressMutation.mutate,
    upsertHighlight: highlightMutation.mutate,
    deleteHighlight: deleteHighlightMutation.mutate,
    
    // Acessores
    getBookById,
    getProgressByBookId,
    getHighlightsByBookId,
    continueReading,
    popularBooks,
  };
};