import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Filter, Search } from 'lucide-react';
import { useLibrary } from '@/hooks/use-library';
import { BookCard } from '@/components/library/BookCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReadingStatus } from '@/types/book';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS: ReadingStatus[] = ['Lendo', 'Lido', 'Quero Ler'];

const MyBooksPage: React.FC = () => {
  const { library, isLoading } = useLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const filteredBooks = useMemo(() => {
    let filtered = library;

    if (statusFilter !== 'Todos') {
      filtered = filtered.filter(b => b.readingStatus === statusFilter);
    }

    if (searchTerm.trim()) {
      const lowerCaseSearch = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(lowerCaseSearch) ||
        b.author.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Ordena por último lido (se estiver lendo) ou por título
    return filtered.sort((a, b) => {
        if (a.readingStatus === 'Lendo' && b.readingStatus === 'Lendo') {
            return new Date(b.lastReadAt || 0).getTime() - new Date(a.lastReadAt || 0).getTime();
        }
        return a.title.localeCompare(b.title);
    });
  }, [library, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando sua biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center space-x-3">
        <BookOpen className="h-7 w-7 text-dyad-500" />
        <span>Minha Biblioteca</span>
      </h1>
      <p className="text-muted-foreground">Todos os livros que você possui, organizados por status de leitura.</p>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="grid gap-2 w-full sm:w-auto flex-grow sm:flex-grow-0">
            <Label htmlFor="search">Buscar Livro</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="search"
                placeholder="Título ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="grid gap-2 w-full sm:w-40">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Lista de Livros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pt-4">
        {filteredBooks.length === 0 ? (
          <p className="col-span-full text-center p-8 text-muted-foreground border rounded-lg">
            Nenhum livro encontrado com os filtros aplicados.
          </p>
        ) : (
          filteredBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))
        )}
      </div>
    </div>
  );
};

export default MyBooksPage;