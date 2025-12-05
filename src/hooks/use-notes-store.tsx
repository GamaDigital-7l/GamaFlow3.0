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
    const payload = mapNoteToSupabase(noteData);
    
    const { data, error } = await supabase
        .from('notes')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapSupabaseNoteToNote(data);
};

export function useNotesStore() {
    const queryClient = useQueryClient();
    
    const { data: notes = [], isLoading } = useQuery<Note[], Error>({
        queryKey: [NOTES_QUERY_KEY],
        queryFn: fetchNotes,
        staleTime: 60000, // 1 minuto de cache
    });

    // Mutação para adicionar/atualizar/deletar anotações
    const noteMutation = useMutation({
        mutationFn: async (action: { type: 'add' | 'update' | 'delete', payload: any }) => {
            if (action.type === 'add') {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Usuário não autenticado.");
                
                const newNoteData = action.payload as Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isPinned' | 'tags'>;
                
                // GERA UM UUID VÁLIDO AQUI
                const newNote: Note = {
                    ...newNoteData,
                    id: uuidv4(), 
                    userId: user.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isPinned: false,
                    tags: [],
                };
                
                const result = await upsertNoteToDB(newNote);
                return { type: 'add', result, tempId: action.payload.id }; // Passa o ID temporário ("new")
                
            } else if (action.type === 'update') {
                const updatedNote = action.payload as Note;
                const result = await upsertNoteToDB({ ...updatedNote, updatedAt: new Date() });
                return { type: 'update', result };
                
            } else if (action.type === 'delete') {
                const noteId = action.payload as string;
                const { error } = await supabase.from('notes').delete().eq('id', noteId);
                if (error) throw new Error(error.message);
                return { type: 'delete', noteId };
            }
            throw new Error("Ação de mutação desconhecida.");
        },
        onSuccess: (data) => {
            queryClient.setQueryData<Note[]>([NOTES_QUERY_KEY], (oldNotes) => {
                if (!oldNotes) return [];
                
                if (data.type === 'add') {
                    showSuccess('Anotação criada com sucesso!');
                    // Substitui o ID temporário ("new") pelo ID real gerado
                    const filteredNotes = oldNotes.filter(n => n.id !== data.tempId);
                    return [data.result, ...filteredNotes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                } else if (data.type === 'update') {
                    showSuccess('Anotação atualizada com sucesso!');
                    return oldNotes.map(n => n.id === data.result.id ? data.result : n)
                                    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                } else if (data.type === 'delete') {
                    showSuccess('Anotação excluída.');
                    return oldNotes.filter(n => n.id !== data.noteId);
                }
                return oldNotes;
            });
        },
        onError: (err) => {
            showError(`Erro ao salvar anotação: ${err.message}`);
        },
    });

    const addNote = (newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isPinned' | 'tags'> & { id: string }) => {
        // O payload agora inclui o ID temporário ("new") para que o onSuccess possa removê-lo
        noteMutation.mutate({ type: 'add', payload: newNoteData });
    };

    const updateNote = (updatedNote: Note) => {
        noteMutation.mutate({ type: 'update', payload: updatedNote });
    };

    const deleteNote = (noteId: string) => {
        noteMutation.mutate({ type: 'delete', payload: noteId });
    };
    
    const getNoteById = (noteId: string) => {
        return notes.find(n => n.id === noteId);
    };
    
    const getClientNotes = (clientId: string) => {
        return notes.filter(n => n.clientId === clientId);
    };

    return {
        notes,
        isLoading,
        isMutating: noteMutation.isPending,
        addNote,
        updateNote,
        deleteNote,
        getNoteById,
        getClientNotes,
    };
}