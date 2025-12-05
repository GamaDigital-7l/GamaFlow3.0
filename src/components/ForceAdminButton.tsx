import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';
import { useForceAdmin } from '@/hooks/use-force-admin';

const ForceAdminButton = () => {
  const { forceAdmin, isForcing } = useForceAdmin();

  return (
    <Button 
      onClick={forceAdmin} 
      className="bg-red-600 hover:bg-red-700"
      disabled={isForcing}
    >
      {isForcing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />} 
      {isForcing ? 'Forçando Admin...' : 'FORÇAR ADMIN (Emergência)'}
    </Button>
  );
};

export default ForceAdminButton;