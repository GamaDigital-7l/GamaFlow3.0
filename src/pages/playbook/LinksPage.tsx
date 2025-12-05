import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useUsefulLinks } from '@/hooks/use-useful-links';
import { LinkFormDialog } from '@/components/playbook/LinkFormDialog';
import { UsefulLink } from '@/types/playbook';
import { useSession } from '@/components/SessionContextProvider'; // Importando useSession

interface LinksPageProps {
  clientId: string;
}

const LinksPage: React.FC<LinksPageProps> = ({ clientId }) => {
  const { links, isLoading, isAdding, isDeleting, addLink, deleteLink } = useUsefulLinks(clientId);
  const { userRole } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Agora, tanto admin quanto client podem adicionar/deletar
  const canManage = userRole === 'admin' || userRole === 'client';

  const handleAddLink = (linkData: Omit<UsefulLink, 'id' | 'created_at' | 'user_id'>) => {
    // Garantindo que o client_id correto seja usado
    addLink({ ...linkData, client_id: clientId });
  };

  const handleDeleteLink = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este link?')) {
      deleteLink(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Links Úteis</h2>
        {canManage && (
          <Button 
            size="sm" 
            className="bg-dyad-500 hover:bg-dyad-600"
            onClick={() => setIsDialogOpen(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Link
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">Área colaborativa para links importantes.</p>
      
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando links...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Nenhum link útil encontrado.
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell className="truncate max-w-xs text-blue-500">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link.url}
                    </a>
                  </TableCell>
                  <TableCell className="text-right flex justify-end space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="h-4 w-4" />
                      </a>
                    </Button>
                    {canManage && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {canManage && (
        <LinkFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddLink}
          isLoading={isAdding}
        />
      )}
    </div>
  );
};

export default LinksPage;