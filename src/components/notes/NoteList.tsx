import React from 'react';
import { Note } from '@/types/note';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pin, PinOff, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/date';

interface NoteListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onPinToggle: (note: Note) => void;
  isMutating: boolean;
  showTitle?: boolean;
  className?: string;
}

const getSnippet = (htmlContent: string) => {
    if (!htmlContent) return 'Vazio';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
};

export const NoteList: React.FC<NoteListProps> = ({ 
    notes, 
    selectedNote, 
    onSelectNote, 
    onPinToggle, 
    isMutating, 
    showTitle = true,
    className
}) => {
  return (
    <div className={cn("w-full sm:w-80 flex-shrink-0 border-r bg-muted/30 flex flex-col", className)}>
        {showTitle && (
            <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-lg">Notas ({notes.length})</CardTitle>
            </CardHeader>
        )}
        <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma anotação encontrada.</p>
            ) : (
                notes.map(note => (
                    <div 
                        key={note.id} 
                        className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted",
                            selectedNote?.id === note.id && "bg-dyad-100 dark:bg-dyad-900/50 border border-dyad-500/50"
                        )}
                        onClick={() => onSelectNote(note)}
                    >
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold truncate pr-2">{note.title || 'Sem Título'}</h4>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 flex-shrink-0"
                                onClick={(e) => { e.stopPropagation(); onPinToggle(note); }}
                                disabled={isMutating}
                            >
                                {note.isPinned ? <PinOff className="h-4 w-4 text-dyad-500" /> : <Pin className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{getSnippet(note.content)}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                                    <Tag className="h-3 w-3 mr-1" />{tag}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Editado: {formatDateTime(note.updatedAt)}</p>
                    </div>
                ))
            )}
        </div>
    </div>
  );
};