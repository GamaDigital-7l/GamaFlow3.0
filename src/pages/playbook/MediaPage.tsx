import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as LinkIcon, Folder, Plus, Loader2, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePlaybookContent } from '@/hooks/use-playbook-content';
import { useSession } from '@/components/SessionContextProvider';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MediaPageProps {
  clientId: string;
}

interface MediaLink {
    id: string;
    title: string;
    url: string;
    isPrimary: boolean;
}

const SECTION_NAME = 'media_links';

const MediaPage: React.FC<MediaPageProps> = ({ clientId }) => {
  const { content, isLoading, saveContent, isSaving } = usePlaybookContent(clientId, SECTION_NAME);
  const { userRole } = useSession();
  const canManage = userRole === 'admin';
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<MediaLink | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const links: MediaLink[] = useMemo(() => {
    return content?.content?.links || [];
  }, [content]);
  
  // Removido primaryLink useMemo

  const handleOpenDialog = (link: MediaLink | null = null) => {
    if (link) {
        setEditingLink(link);
        setNewTitle(link.title);
        setNewUrl(link.url);
        setIsPrimary(link.isPrimary);
    } else {
        setEditingLink(null);
        setNewTitle('');
        setNewUrl('');
        setIsPrimary(false);
    }
    setIsDialogOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
        showError('Título e URL são obrigatórios.');
        return;
    }
    
    let updatedLinks = links;
    
    // 1. Garante que apenas um seja primário
    if (isPrimary) {
        updatedLinks = updatedLinks.map(l => ({ ...l, isPrimary: false }));
    }
    
    if (editingLink) {
        // Update
        updatedLinks = updatedLinks.map(l => 
            l.id === editingLink.id 
                ? { ...l, title: newTitle.trim(), url: newUrl.trim(), isPrimary } 
                : l
        );
    } else {
        // Add
        const newLink: MediaLink = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            url: newUrl.trim(),
            isPrimary,
        };
        updatedLinks = [...updatedLinks, newLink];
    }
    
    saveContent(SECTION_NAME, { links: updatedLinks });
    setIsDialogOpen(false);
  };
  
  const handleDeleteLink = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este link?')) {
        const updatedLinks = links.filter(l => l.id !== id);
        saveContent(SECTION_NAME, { links: updatedLinks });
    }
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Folder className="h-6 w-6 text-dyad-500" />
          <span>Mídias e Drives</span>
        </h2>
        {canManage && (
          <Button 
            size="sm" 
            className="bg-dyad-500 hover:bg-dyad-600"
            onClick={() => handleOpenDialog()}
            disabled={isSaving}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Link
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">Acesso rápido aos drives, pastas e mídias do cliente.</p>
      
      {/* Removida a Pré-visualização do Link Principal */}

      {/* Lista de Links Adicionais */}
      <Card>
        <CardHeader><CardTitle>Todos os Links ({links.length})</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-3">
                {links.length === 0 ? (
                    <p className="text-muted-foreground text-center">Nenhum link de mídia cadastrado.</p>
                ) : (
                    links.map(link => (
                        <div key={link.id} className={cn(
                            "p-3 border rounded-lg flex justify-between items-center",
                            link.isPrimary && "bg-dyad-50/50 dark:bg-dyad-950/50 border-dyad-500/50"
                        )}>
                            <div className="min-w-0 pr-4">
                                <h4 className="font-semibold truncate flex items-center space-x-2">
                                    <LinkIcon className="h-4 w-4 text-dyad-500 flex-shrink-0" />
                                    <span>{link.title}</span>
                                    {link.isPrimary && <Badge className="bg-dyad-500/20 text-dyad-500 hover:bg-dyad-500/30 text-xs">Principal</Badge>}
                                </h4>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                                    {link.url}
                                </a>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                {canManage && (
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(link)} disabled={isSaving}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                                {canManage && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLink(link.id)} disabled={isSaving}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </CardContent>
      </Card>

      {/* Diálogo de Adição/Edição de Link */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Editar Link de Mídia' : 'Adicionar Novo Link de Mídia'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLink} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título (Ex: Google Drive)</Label>
              <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required disabled={isSaving} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL (Drive, Dropbox, etc.)</Label>
              <Input id="url" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required disabled={isSaving} />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="isPrimary"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="h-4 w-4 text-dyad-500 border-gray-300 rounded focus:ring-dyad-500"
                    disabled={isSaving}
                />
                <Label htmlFor="isPrimary">Link Principal (Exibir Pré-visualização)</Label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving} className="bg-dyad-500 hover:bg-dyad-600">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPage;