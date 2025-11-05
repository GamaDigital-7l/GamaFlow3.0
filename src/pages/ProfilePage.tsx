import React, { useState } from 'react';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Button } from '@/components/ui/button';
import { Edit, Shield, Loader2 } from 'lucide-react';
import { useForceAdmin } from '@/hooks/use-force-admin'; // Importando o novo hook
import { useSession } from '@/components/SessionContextProvider';

const ProfilePage: React.FC = () => {
  const { userRole } = useSession();
  const { forceAdmin, isForcing } = useForceAdmin();
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleForceAdmin = () => {
    if (window.confirm("ATENÇÃO: Isso forçará sua role para 'admin' usando a Service Role Key. Use apenas em caso de emergência de acesso.")) {
        forceAdmin();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <div className="flex space-x-2">
          {userRole !== 'admin' && (
            <Button 
              onClick={handleForceAdmin} 
              className="bg-red-600 hover:bg-red-700"
              disabled={isForcing}
            >
              {isForcing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />} 
              {isForcing ? 'Forçando Admin...' : 'FORÇAR ADMIN (Emergência)'}
            </Button>
          )}
          <Button onClick={handleEdit} className="bg-dyad-500 hover:bg-dyad-600">
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        </div>
      </div>
      
      {isEditing ? (
        <UserProfileForm
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <p className="text-muted-foreground">Visualize e edite suas informações de perfil.</p>
      )}
      
      {userRole === 'admin' && (
        <div className="p-4 border border-green-500/50 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="font-semibold text-green-700 dark:text-green-300">Status: Você é um Administrador.</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;