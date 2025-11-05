import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '@/types/note'; // Importando o novo tipo Note

const NOTES_QUERY_KEY = 'allNotes';

// Mapeia snake_case do DB para camelCase do frontend
const mapSupabaseNoteToNote = (data: any): Note => ({
  id: data.id,
  userId: data.user_id,
  title: data.title,
  content: data.content,
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
  isPinned: data.is_pinned || false, // Novo campo
  tags: data.tags || [], // Novo campo
  clientId: data.client_id || null, // Mantido
});

// Mapeia camelCase do frontend para snake_case do DB
const mapNoteToSupabase = (note: Note) => ({
  id: note.id,
  title: note.title,
  content: note.content,
  client_id: note.clientId,
  user_id: note.userId,
  is_pinned: note.isPinned, // Novo campo
  tags: note.tags, // Novo campo
});

// Função para buscar todas as anotações
const fetchNotes = async (): Promise<Note[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('is_pinned', { ascending: false }) // Ordena por pin
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  return data.map(mapSupabaseNoteToNote);
};

// Função para adicionar/atualizar anotação no DB
const upsertNoteToDB = async (noteData: Note): Promise<Note> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    id: noteData.id,
    user_id: user.id,
    title: noteData.title,
    content: noteData.content,
    is_pinned: noteData.isPinned, // Novo campo
    tags: noteData.tags, // Novo campo
    client_id: noteData.clientId,
  };

  const { data, error } = await supabase
    .from('notes')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseNoteToNote(data);
};

const deleteNoteFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const useNotes = () => {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery<Note[], Error>({
    queryKey: [NOTES_QUERY_KEY],
    queryFn: fetchNotes,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertNoteToDB,
    onSuccess: (savedNote) => {
      // Atualiza o cache localmente para refletir a mudança e a ordenação
      queryClient.setQueryData<Note[]>([NOTES_QUERY_KEY], (oldNotes) => {
        if (!oldNotes) return [savedNote];
        
        // Remove a versão antiga e adiciona a nova
        const updatedList = oldNotes.filter(n => n.id !== savedNote.id);
        
        // Reordena: Fixadas primeiro, depois por data de atualização
        return [savedNote, ...updatedList]
            .sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1; // Fixadas vêm primeiro
                }
                return b.updatedAt.getTime() - a.updatedAt.getTime(); // Mais recentes primeiro
            });
      });
      // Não mostra toast de sucesso para salvar automático
    },
    onError: (err) => {
      showError(`Erro ao salvar anotação: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNoteFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY] });
      showSuccess('Anotação excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir anotação: ${err.message}`);
    },
  });

  return {
    notes,
    isLoading,
    upsertNote: upsertMutation.mutate,
    deleteNote: deleteMutation.mutate,
    isMutating: upsertMutation.isPending || deleteMutation.isPending,
  };
};