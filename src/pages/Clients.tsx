import React, { useState } from "react";
import { useClientStore } from "@/hooks/use-client-store";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientForm } from "@/components/ClientForm";
import { Client, ClientStatus, ClientType } from "@/types/client";
import { cn } from "@/lib/utils";
import { ArrowRight, Plus, MoreVertical, Edit, Trash2, Loader2, Phone, Mail } from "lucide-react";
import { ClientAvatar } from "@/components/ClientAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showError } from "@/utils/toast";
import { ClientProgressCard } from "@/components/ClientProgressCard"; // Importando o novo componente
import { useQueryClient } from "@tanstack/react-query"; // Importando useQueryClient

const ClientsList: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, isUpdating, isLoading } = useClientStore();
  const queryClient = useQueryClient(); // Usando queryClient para refetch
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Estados para Edição e Exclusão
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false); // Estado local para exclusão
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-500 hover:bg-green-600';
      case 'Pausado': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Finalizado': return 'bg-red-500 hover:bg-red-700';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, 'id' | 'posts'>) => {
    try {
        // 1. Adiciona o cliente e obtém o ID
        const newClientId = await addClient(clientData); 
        
        // 2. Força a recarga da query principal e ESPERA que ela termine
        await queryClient.refetchQueries({ queryKey: ['allClients'] });
        
        setIsCreateDialogOpen(false);
        navigate(`/clients/${newClientId}`); // Redireciona para o workspace
    } catch (error) {
        showError('Falha ao criar cliente.');
    }
  };
  
  const handleEditClient = (clientData: Omit<Client, 'id' | 'posts'>) => {
    if (!editingClient) return;
    
    const updatedClient: Omit<Client, 'posts'> = {
      ...clientData,
      id: editingClient.id,
    };
    
    updateClient(updatedClient);
    setIsEditDialogOpen(false);
    setEditingClient(null);
  };
  
  const handleDeleteClient = async () => {
    if (!editingClient) return;
    
    setIsDeletingClient(true);
    try {
        // Chama a mutação assíncrona que primeiro deleta usuários Auth via Edge Function
        await deleteClient(editingClient.id);
        setIsDeleteDialogOpen(false);
        setEditingClient(null);
    } catch (error) {
        showError('Erro ao excluir cliente e usuários vinculados.');
    } finally {
        setIsDeletingClient(false);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (client: Client) => {
    setEditingClient(client);
    setIsDeleteDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando clientes...</p>
      </div>
    );
  }


  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Módulo de Clientes</h1>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Novo Cliente
        </Button>
      </div>
      
      <p className="text-muted-foreground">Selecione um cliente para acessar o workspace Kanban.</p>

      {/* Ajuste do grid para 1 coluna no mobile, 2 no md, 3 no lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map(client => (
          <Card 
            key={client.id} 
            className="transition-shadow hover:shadow-xl h-full relative flex flex-col overflow-hidden" 
          >
            {/* Menu de 3 pontos para ações (Posicionado no topo) */}
            <div className="absolute top-4 right-4 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(client)}>
                    <Edit className="h-4 w-4 mr-2" /> Editar Cliente
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => openDeleteDialog(client)}
                    className="text-red-600 focus:text-red-600"
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir Cliente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Link to={`/clients/${client.id}`} className="block flex-grow flex flex-col justify-between">
              <CardHeader className="p-6 pb-2 text-center flex flex-col items-center">
                
                {/* Avatar Centralizado e Maior (Topo) */}
                <div className="flex justify-center mb-4">
                    <ClientAvatar 
                      name={client.name} 
                      logoUrl={client.logoUrl} 
                      className="w-16 h-16 flex-shrink-0" 
                    />
                </div>
                
                {/* Título */}
                <CardTitle className="text-xl font-bold truncate">{client.name}</CardTitle>
                
                {/* Status e Tipo */}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={cn("text-white text-xs", getStatusColor(client.status))}>
                    {client.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {client.type}
                  </Badge>
                </div>
                
              </CardHeader>
              
              <CardContent className="p-6 pt-4 space-y-4">
                
                {/* Progresso Mensal (Sutil) */}
                <ClientProgressCard client={client as any} isClickable={false} />
                
                {/* Botão de Acesso Rápido (Barra Inferior) - Estilo Sólido Neutro */}
                <div className="w-full">
                    <Button 
                        variant="default" 
                        className="w-full bg-gray-800 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                        Acessar Workspace <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Diálogos (mantidos) */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClientForm 
            onSubmit={handleCreateClient} 
            onCancel={() => setIsCreateDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente: {editingClient?.name}</DialogTitle>
          </DialogHeader>
          {editingClient && (
            <ClientForm 
              client={editingClient}
              onSubmit={handleEditClient} 
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente 
              <span className="font-bold text-red-500"> {editingClient?.name} </span>
              e todos os dados associados (Kanban, Posts, Links, **e todos os usuários clientes vinculados**).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingClient}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClient} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingClient}
            >
              {isDeletingClient ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isDeletingClient ? 'Excluindo...' : 'Sim, Excluir Cliente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsList;