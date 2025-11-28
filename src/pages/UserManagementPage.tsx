import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2, User, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserManagement, UserProfile } from '@/hooks/use-user-management';
import { useClientStore } from '@/hooks/use-client-store';
import { UserForm } from '@/components/admin/UserForm';
import { UserEditDialog } from '@/components/admin/UserEditDialog'; // Importando o novo diálogo
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const UserManagementPage: React.FC = () => {
  const { users, isLoading, createUser, updateUser, deleteUser, isCreating, isUpdating } = useUserManagement();
  const { clients } = useClientStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const handleCreateUser = (data: { email: string, password: string, client_id: string }) => {
    createUser(data, {
      onSuccess: () => setIsCreateDialogOpen(false),
    });
  };
  
  const handleUpdateUser = (data: { id: string, email: string, role: string, client_id: string | null, password?: string }) => {
    updateUser(data, {
        onSuccess: () => setIsEditDialogOpen(false),
    });
  };
  
  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };
  
  const getClientName = (clientId?: string) => {
    if (!clientId) return 'N/A';
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';
  };
  
  const handleDelete = (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Isso é irreversível.')) {
        deleteUser(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600"
        >
          <Plus className="h-4 w-4 mr-2" /> Criar Usuário Cliente
        </Button>
      </div>
      <p className="text-muted-foreground">Crie e gerencie os acessos dos clientes ao Portal.</p>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Cliente Vinculado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={cn(
                        user.role === 'admin' ? 'bg-dyad-500' : 'bg-blue-500'
                    )}>
                        {user.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{getClientName(user.client_id)}</TableCell>
                  <TableCell className="text-right flex justify-end space-x-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenEdit(user)}
                        disabled={isUpdating}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {user.role !== 'admin' && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(user.id)}
                            disabled={isUpdating}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário Cliente</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={handleCreateUser} 
            onCancel={() => setIsCreateDialogOpen(false)} 
            isSubmitting={isCreating}
          />
        </DialogContent>
      </Dialog>
      
      {editingUser && (
        <UserEditDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            user={editingUser}
            onSubmit={handleUpdateUser}
            isSubmitting={isUpdating}
        />
      )}
    </div>
  );
};

export default UserManagementPage;