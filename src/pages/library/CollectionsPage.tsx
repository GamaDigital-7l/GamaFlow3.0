import React from 'react';
import { Folder, Loader2 } from 'lucide-react';

const CollectionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center space-x-3">
        <Folder className="h-7 w-7 text-dyad-500" />
        <span>Minhas Coleções</span>
      </h1>
      <p className="text-muted-foreground">Organize seus livros em coleções personalizadas.</p>
      
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Funcionalidade de Coleções em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default CollectionsPage;