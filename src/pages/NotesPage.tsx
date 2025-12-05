import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Notebook, Search, Save, Pin, PinOff, Copy, Tag, X } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';
import { Note } from '@/types/note';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { RichTextEditor } from '@/components/notes/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/components/SessionContextProvider';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { NoteList } from '@/components/notes/NoteList'; // Importando NoteList

interface NotesPageProps {}

const NotesPage: React.FC<NotesPageProps> = () => {
  const { notes, isLoading, upsertNote, deleteNote, isMutating } = useNotes();
  const { user } = useSession();
  const isMobile = useIsMobile();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingIndicator, setIsSavingIndicator] = useState(false);

  const debouncedTitle = useDebounce(noteTitle, 1000);
  const debouncedContent = useDebounce(noteContent, 1000);
  const debouncedTags = useDebounce(noteTags, 1000);

  const clientNotes = useMemo(() => {
    return notes.filter(note => note.clientId === null);
  }, [notes]);

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content);
      setNoteTags(selectedNote.tags || []);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteTags([]);
    }
  }, [selectedNote]);

  // Efeito de salvamento automático
  useEffect(() => {
    const hasTitleChanged = selectedNote && debouncedTitle !== selectedNote.title;
    const hasContentChanged = selectedNote && debouncedContent !== selectedNote.content;
    const hasTagsChanged = selectedNote && JSON.stringify(debouncedTags) !== JSON.stringify(selectedNote.tags);

    if (selectedNote && selectedNote.id !== 'new' && (hasTitleChanged || hasContentChanged || hasTagsChanged)) {
      if (debouncedTitle.trim() || debouncedContent.trim()) {
        setIsSavingIndicator(true);

        const updatedNote: Note = {
          ...selectedNote,
          title: debouncedTitle.trim() || 'Nova Anotação',
          content: debouncedContent,
          tags: debouncedTags,
          updatedAt: new Date(),
        };

        upsertNote(updatedNote, {
          onSettled: () => setIsSavingIndicator(false),
          onSuccess: (savedNote) => {
            setSelectedNote(savedNote);
          },
          onError: () => setIsSavingIndicator(false),
        });
      }
    }
  }, [debouncedTitle, debouncedContent, debouncedTags, selectedNote, upsertNote]);

  const handleNewNote = () => {
    if (!user) return;
    const tempNote: Note = {
      id: 'new',
      userId: user.id,
      title: 'Nova Anotação',
      content: '',
      isPinned: false,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      clientId: null,
    };
    setSelectedNote(tempNote);
  };

  const handleSaveNewNote = () => {
    if (selectedNote && selectedNote.id === 'new' && user) {
      setIsSavingIndicator(true);

      const newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { id: string } = {
        id: 'new', // Usamos 'new' para que o hook de mutação gere o ID real
        title: noteTitle.trim() || 'Nova Anotação',
        content: noteContent,
        isPinned: false,
        tags: noteTags,
        clientId: null,
      };

      upsertNote(newNoteData, {
        onSuccess: (savedNote) => {
          setSelectedNote(savedNote);
          setIsSavingIndicator(false);
        },
        onError: () => setIsSavingIndicator(false),
      });
    }
  };

  const handlePinToggle = (note: Note) => {
    const updatedNote: Note = {
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date(),
    };
    upsertNote(updatedNote);
  };

  const handleDuplicateNote = (note: Note) => {
    if (!user) return;
    const newNote: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id: string } = {
      id: 'new',
      title: `${note.title} (Cópia)`,
      content: note.content,
      isPinned: false,
      tags: [...note.tags],
      clientId: note.clientId,
    };
    upsertNote(newNote);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta anotação?')) {
      deleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (tag && !noteTags.includes(tag)) {
        setNoteTags(prev => [...prev, tag]);
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNoteTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const filteredNotes = useMemo(() => {
    if (!searchTerm.trim()) return clientNotes;
    const lowerCaseSearch = searchTerm.trim().toLowerCase();
    return clientNotes.filter(note =>
      note.title.toLowerCase().includes(lowerCaseSearch) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
  }, [clientNotes, searchTerm]);

  const renderEditor = () => {
    if (!selectedNote) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Crie uma nova anotação.
        </div>
      );
    }

    return (
      <>
        <CardHeader className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)} className="mr-2">
                    <X className="h-5 w-5" />
                </Button>
            )}
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Título da Anotação"
              className="text-xl font-bold border-none shadow-none p-0 h-auto bg-transparent focus-visible:ring-0"
              disabled={isMutating}
            />
            <div className="flex space-x-2 flex-shrink-0">
              <span className={cn(
                "text-sm font-medium self-center transition-opacity duration-300",
                isSavingIndicator ? "opacity-100 text-dyad-500" : "opacity-0 text-muted-foreground"
              )}>
                {isSavingIndicator ? 'Salvando...' : 'Salvo'}
              </span>

              {selectedNote.id !== 'new' && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicateNote(selectedNote)} disabled={isMutating}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    disabled={isMutating}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
              {selectedNote.id === 'new' && (
                <Button
                  onClick={handleSaveNewNote}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isMutating || !noteTitle.trim()}
                >
                  <Save className="h-4 w-4 mr-2" /> Criar
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {noteTags.map(tag => (
              <Badge key={tag} className="bg-dyad-500 hover:bg-dyad-600 text-white cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                {tag} <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Adicionar tag (Enter)"
              className="h-6 w-32 text-sm border-dashed focus-visible:ring-0"
              disabled={isMutating}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedNote.id === 'new' ? 'Nova anotação' : `Última edição: ${formatDateTime(selectedNote.updatedAt)}`}
          </p>
        </CardHeader>
        <CardContent className="p-4 flex-grow overflow-y-auto">
          <RichTextEditor
            value={noteContent}
            onChange={setNoteContent}
            placeholder="Comece a escrever sua anotação aqui..."
          />
        </CardContent>
      </>
    );
  };

  // --- Mobile View ---
  if (isMobile) {
    return (
      <div className="h-[90vh] flex flex-col">
        {selectedNote ? (
          // Editor View (Mobile)
          <div className="flex-grow flex flex-col bg-background">
            {renderEditor()}
          </div>
        ) : (
          // List View (Mobile)
          <div className="flex-grow flex flex-col">
            <CardHeader className="p-4 pb-2 border-b bg-card">
              <CardTitle className="text-xl flex items-center space-x-2">
                <Notebook className="h-5 w-5 text-dyad-500" />
                <span>Anotações Pessoais</span>
              </CardTitle>
            </CardHeader>

            <div className="p-4 bg-card border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Busca Global..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleNewNote}
                className="w-full bg-dyad-500 hover:bg-dyad-600"
                disabled={isMutating}
              >
                <Plus className="h-4 w-4 mr-2" /> Nova Anotação
              </Button>
            </div>
            
            {/* Using NoteList for the actual list rendering */}
            <NoteList
                notes={filteredNotes}
                selectedNote={selectedNote}
                onSelectNote={setSelectedNote}
                onPinToggle={handlePinToggle}
                isMutating={isMutating}
                showTitle={false} // Title is already in CardHeader above
                className="border-none"
            />
          </div>
        )}
      </div>
    );
  }

  // --- Desktop View (Three-column layout) ---
  return (
    <div className="flex h-[85vh] border rounded-lg overflow-hidden shadow-xl">
      {/* Coluna 1: Sidebar de Navegação (Pastas/Tags) */}
      <div className="w-full sm:w-60 flex-shrink-0 border-r bg-muted/30 flex flex-col">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-xl flex items-center space-x-2">
            <Notebook className="h-5 w-5 text-dyad-500" />
            <span>Anotações Pessoais</span>
          </CardTitle>
        </CardHeader>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busca Global..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleNewNote}
            className="w-full bg-dyad-500 hover:bg-dyad-600"
            disabled={isMutating}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Anotação
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-2 text-sm">
          <h4 className="font-semibold text-muted-foreground mb-2">Pastas (Simulado)</h4>
          <div className="space-y-1">
            <div className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">Todas as Notas ({notes.length})</div>
            <div className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer flex justify-between">
              <span>Fixadas</span>
              <Pin className="h-4 w-4 text-dyad-500" />
            </div>
            <div className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">Lixeira</div>
          </div>
          <Separator className="my-4" />
          <h4 className="font-semibold text-muted-foreground mb-2">Tags (Simulado)</h4>
          <div className="space-y-1">
            <div className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">#Reunião</div>
            <div className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer">#Ideias</div>
          </div>
        </div>
      </div>

      {/* Coluna 2: Lista de Notas */}
      <NoteList
        notes={filteredNotes}
        selectedNote={selectedNote}
        onSelectNote={setSelectedNote}
        onPinToggle={handlePinToggle}
        isMutating={isMutating}
        showTitle={false}
        className="w-full sm:w-80"
      />

      {/* Coluna 3: Área de Edição */}
      <div className="flex-grow flex flex-col bg-background">
        {renderEditor()}
      </div>
    </div>
  );
};

export default NotesPage;