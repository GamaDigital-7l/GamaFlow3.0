import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Lock, Trash2 } from 'lucide-react';
import { useClientLogins } from '@/hooks/use-client-logins';
import { LoginFormDialog } from '@/components/playbook/LoginFormDialog';
import { ClientLogin } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider'; // Importando useSession

interface LoginsPageProps {
  clientId: string;
}

const LoginsPage: React.FC<LoginsPageProps> = ({ clientId }) => {
  const { logins, isLoading, isAdding, isDeleting, addLogin, deleteLogin } = useClientLogins(clientId);
  const { userRole } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null);
  
  const isAdmin = userRole === 'admin';
  const canManage = isAdmin || userRole === 'client'; // Clientes podem adicionar/deletar

  const handleAddLogin = (loginData: Omit<ClientLogin, 'id' | 'created_at' | 'user_id'>) => {
    // Garantindo que o client_id correto seja usado
    addLogin({ ...loginData, client_id: clientId });
  };

  const handleDeleteLogin = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este login?')) {
      deleteLogin(id);
    }
  };

  const handleTogglePassword = (id: string, password?: string) => {
    if (!password) {
      showError('Senha não registrada.');
      return;
    }
    
    if (!isAdmin) {
        showError('Apenas administradores podem visualizar senhas.');
        return;
    }
    
    if (showPasswordId === id) {
      setShowPasswordId(null);
    } else {
      setShowPasswordId(id);
      // Em um app real, a senha seria descriptografada aqui.
      showSuccess('Senha revelada. Copie rapidamente!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Logins</h2>
        {canManage && (
          <Button 
            size="sm" 
            className="bg-dyad-500 hover:bg-dyad-600"
            onClick={() => setIsDialogOpen(true)}
            disabled={isAdding}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Login
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">Tabela colaborativa de acessos. Senhas devem ser tratadas com segurança.</p>
      
      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando logins...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Senha</TableHead>
              <TableHead className="text-right">Notas</TableHead>
              {canManage && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {logins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                  Nenhum login encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logins.map((login) => (
                <TableRow key={login.id}>
                  <TableCell className="font-medium">{login.title}</TableCell>
                  <TableCell>{login.login}</TableCell>
                  <TableCell className="flex items-center space-x-2">
                    {showPasswordId === login.id && isAdmin ? (
                      <span className="font-mono text-sm text-green-600 dark:text-green-400">{login.password}</span>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-gray-500" />
                        <span>••••••••</span>
                      </>
                    )}
                    {/* Botão de visualização de senha (apenas para Admin) */}
                    {isAdmin && login.password && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTogglePassword(login.id, login.password)}
                            disabled={!login.password}
                            className="h-6 w-6 p-0"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm max-w-xs truncate">{login.notes || 'N/A'}</TableCell>
                  {canManage && (
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteLogin(login.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {canManage && (
        <LoginFormDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleAddLogin}
          isLoading={isAdding}
        />
      )}
    </div>
  );
};

export default LoginsPage;