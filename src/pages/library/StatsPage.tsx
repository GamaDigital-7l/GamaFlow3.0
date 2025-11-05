import React from 'react';
import { LayoutDashboard, Loader2 } from 'lucide-react';

const StatsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center space-x-3">
        <LayoutDashboard className="h-7 w-7 text-dyad-500" />
        <span>Estatísticas de Leitura</span>
      </h1>
      <p className="text-muted-foreground">Acompanhe seu desempenho e conquistas de leitura.</p>
      
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Funcionalidade de Estatísticas em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default StatsPage;