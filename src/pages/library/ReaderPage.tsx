import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLibrary } from '@/hooks/use-library';
import { Loader2 } from 'lucide-react';

const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { getBookById, isLoading } = useLibrary();
  const book = getBookById(bookId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Livro Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">O ID do livro é inválido ou o livro foi removido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-bold text-dyad-500">{book.title}</h1>
          <p className="text-xl text-muted-foreground">Por {book.author}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Área para o leitor (PDF/EPUB) */}
          <div className="h-[600px] border rounded-lg bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Leitor aqui (PDF/EPUB)</p>
          </div>
          
          {/* Controles de Leitura (A implementar) */}
          <div className="flex justify-between items-center">
            <Button variant="outline">Anterior</Button>
            <Button variant="outline">Próximo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReaderPage;