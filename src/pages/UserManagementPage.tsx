import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2, User, Edit, Plus } from 'lucide-react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const UserManagementPage: React.FC = () => {
  const { users, isLoading, createUser, updateUser, deleteUser, isCreating, isUpdating } = useUserManagement();
  const { clients } = useClientStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Define o tamanho da página
  const totalPages = Math.ceil(users.length / pageSize); // Calcula o número total de páginas

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Calcula os usuários para a página atual
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return users.slice(startIndex, endIndex);
  }, [users, currentPage, pageSize]);

  const handleCreateUser = (data: { email: string, password: string, client_id: string }) => {
    createUser(data, {
        onSuccess: () => setIsCreateDialogOpen(false)
    });
  };

  const handleEditUser = (data: { id: string, email: string, role: string, client_id: string | null, password?: string }) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cliente Vinculado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map(user => (
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
          </div>
        </CardContent>
      </Card>
      
      {/* Componente de Paginação */}
      <Pagination>
        <PaginationContent className="flex-wrap">
          <PaginationPrevious
            href="#"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page} active={page === currentPage}>
              <PaginationLink
                href="#"
                onClick={() => handlePageChange(page)}
                isCurrent={page === currentPage ? "page" : undefined}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationNext
            href="#"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </PaginationContent>
      </Pagination>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
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
            onSubmit={handleEditUser}
            isSubmitting={isUpdating}
        />
      )}
    </div>
  );
};

export default UserManagementPage;