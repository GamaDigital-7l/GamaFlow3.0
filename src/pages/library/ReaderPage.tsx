import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLibrary } from '@/hooks/use-library';
import { Loader2 } from 'lucide-react';
import { PdfReader } from '@/components/library/PdfReader';
import { EpubReader } from '@/components/library/EpubReader';
import { Button } from '@/components/ui/button';
import { ReadingSettings } from '@/components/library/ReadingSettings';
import { cn } from '@/lib/utils';
import { Annotation } from '@/components/library/Annotation';

const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { getBookById, getProgressByBookId, upsertProgress, isLoading } = useLibrary();
  const book = getBookById(bookId || '');
  const initialProgress = getProgressByBookId(bookId || '');
  
  const [settings, setSettings] = useState({
    theme: 'light',
    fontSize: 16,
    fontFamily: 'serif',
    lineSpacing: 1.5,
    margins: 20,
    scrollMode: 'page',
    autoNightMode: false,
  });
  
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  
  useEffect(() => {
    if (initialProgress?.settings) {
      setSettings(initialProgress.settings);
    }
  }, [initialProgress]);
  
  const handleSettingsChange = (newSettings: any) => {
    setSettings(newSettings);
    
    // Salva as configurações no banco de dados
    upsertProgress({
        book_id: bookId,
        current_page: 0,
        reading_status: 'Lendo',
        total_pages: book?.page_count || 0,
        settings: newSettings,
    });
  };
  
  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString().trim();
      if (text) {
        setHighlightedText(text);
        setIsAnnotationOpen(true);
      }
    }
  };
  
  const handleSaveAnnotation = (note: string, color: string) => {
    // Lógica para salvar a anotação (a implementar)
    console.log(`Anotação salva: ${note} com cor ${color}`);
    setIsAnnotationOpen(false);
    setHighlightedText('');
  };

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
          <div 
            className={cn(
              "h-[600px] border rounded-lg flex items-center justify-center",
              settings.theme === 'light' && 'bg-white text-gray-800',
              settings.theme === 'dark' && 'bg-gray-800 text-gray-100',
              settings.theme === 'sepia' && 'bg-yellow-100 text-gray-700',
              settings.theme === 'high-contrast' && 'bg-black text-yellow-400',
            )}
            onMouseUp={handleTextSelect}
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: settings.fontFamily,
            lineHeight: `${settings.lineSpacing}`,
            padding: `${settings.margins}px`,
          }}>
            {book.file_type === 'pdf' && <PdfReader fileUrl={book.file_url} />}
            {book.file_type === 'epub' && <EpubReader fileUrl={book.file_url} />}
            {book.file_type === 'mobi' && <p className="text-muted-foreground">Leitor MOBI não implementado.</p>}
            {(!book.file_type) && <p className="text-muted-foreground">Tipo de arquivo não suportado.</p>}
          </div>
          
          {/* Controles de Leitura (A implementar) */}
          <div className="flex justify-between items-center">
            <Button variant="outline">Anterior</Button>
            <Button variant="outline">Próximo</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Configurações de Leitura */}
      <Card className="w-full max-w-md mt-8">
        <CardContent>
          <ReadingSettings settings={settings} onSettingsChange={handleSettingsChange} />
        </CardContent>
      </Card>
      
      {/* Componente de Anotação (Condicional) */}
      {isAnnotationOpen && (
        <Annotation
          highlightedText={highlightedText}
          onSave={handleSaveAnnotation}
          onCancel={() => setIsAnnotationOpen(false)}
          isSaving={false} // Adicione a lógica de salvamento aqui
        />
      )}
    </div>
  );
};

export default ReaderPage;