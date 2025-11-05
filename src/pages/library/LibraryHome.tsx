import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Target, Star, Folder, Plus } from 'lucide-react';
import { useLibrary } from '@/hooks/use-library';
import { BookCard } from '@/components/library/BookCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { BookUploadForm } from '@/components/library/BookUploadForm';

// Componente de Carrossel Horizontal
interface BookCarouselProps {
    title: string;
    books: any[]; // Book & Progress
    linkTo?: string;
}

const BookCarousel: React.FC<BookCarouselProps> = ({ title, books, linkTo }) => {
    if (books.length === 0) return null;
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{title}</h2>
                {linkTo && (
                    <Link to={linkTo} className="text-sm text-dyad-500 hover:underline">
                        Ver Todos
                    </Link>
                )}
            </div>
            <ScrollArea className="w-full whitespace-nowrap pb-4">
                <div className="flex space-x-4">
                    {books.map(book => (
                        <div key={book.id} className="w-[180px] flex-shrink-0">
                            <BookCard book={book} />
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
};


const LibraryHome: React.FC = () => {
  const { library, continueReading, popularBooks, isLoading } = useLibrary();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Simulação de Categorias (usando tags únicas)
  const categories = useMemo(() => {
    const allCategories = Array.from(new Set(library.map(b => b.category).filter(c => c)));
    return allCategories.slice(0, 4); // Top 4 categorias
  }, [library]);
  
  // Simulação de Livros por Categoria
  const booksByCategory = useMemo(() => {
    return categories.map(category => ({
        category,
        books: library.filter(b => b.category === category).slice(0, 10),
    }));
  }, [library, categories]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando sua biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Descubra e Continue Lendo</h1>
        <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-dyad-500 hover:bg-dyad-600">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Livro
        </Button>
      </div>
      
      {/* 1. Continuar Lendo (Prioridade Máxima) */}
      {continueReading.length > 0 && (
        <BookCarousel 
            title="Continue Lendo" 
            books={continueReading} 
            linkTo="/library/my-books?status=Lendo"
        />
      )}
      
      {/* 2. Populares */}
      <BookCarousel 
        title="Populares na Gama Library" 
        books={popularBooks} 
        linkTo="/library/categories"
      />
      
      <Separator />
      
      {/* 3. Carrosséis por Categoria (Estilo Netflix) */}
      {booksByCategory.map(({ category, books }) => (
        <BookCarousel 
            key={category}
            title={category}
            books={books}
            linkTo={`/library/categories?name=${category}`}
        />
      ))}
      
      {library.length === 0 && (
        <Card className="text-center p-12 border-2 border-dashed">
            <BookOpen className="h-12 w-12 text-dyad-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Sua biblioteca está vazia.</h2>
            <p className="text-muted-foreground mt-2">Adicione seus primeiros livros para começar a ler!</p>
        </Card>
      )}
      
      {/* Diálogo de Upload */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <h1 className="text-2xl font-bold">Adicionar Novo Livro</h1>
          </DialogHeader>
          <BookUploadForm onCancel={() => setIsUploadDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryHome;