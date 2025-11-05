import React from 'react';
import { Tag, Loader2 } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center space-x-3">
        <Tag className="h-7 w-7 text-dyad-500" />
        <span>Categorias e Tags</span>
      </h1>
      <p className="text-muted-foreground">Explore o catálogo por categorias e tags.</p>
      
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Funcionalidade de Categorias em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default CategoriesPage;