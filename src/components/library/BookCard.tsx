import React from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Tipo combinado para o card
interface BookWithProgress extends Book {
    readingStatus: ReadingStatus;
    currentPage: number;
    progress?: { total_pages: number };
}

interface BookCardProps {
    book: BookWithProgress;
}

const getStatusColor = (status: ReadingStatus) => {
    switch (status) {
        case 'Lendo': return 'bg-blue-500 hover:bg-blue-600';
        case 'Lido': return 'bg-green-600 hover:bg-green-700';
        case 'Quero Ler': return 'bg-gray-500 hover:bg-gray-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
};

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
    const totalPages = book.progress?.total_pages || book.page_count || 1;
    const percentage = totalPages > 0 ? Math.round((book.currentPage / totalPages) * 100) : 0;
    const isReading = book.readingStatus === 'Lendo';
    
    // Link para a página de leitura (simulado)
    const readerLink = `/library/reader/${book.id}`;

    return (
        <Link to={readerLink} className="block h-full">
            <Card className="w-full h-full flex flex-col overflow-hidden transition-shadow hover:shadow-xl">
                
                {/* Capa do Livro (Aspecto 2:3) */}
                <div className="relative w-full aspect-[2/3] overflow-hidden bg-muted">
                    {book.cover_url ? (
                        <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover object-center"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <BookOpen className="h-8 w-8" />
                        </div>
                    )}
                    {/* Rating */}
                    <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-xs flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{book.rating.toFixed(1)}</span>
                    </Badge>
                </div>

                <CardContent className="p-3 flex-grow space-y-1">
                    <h4 className="text-sm font-semibold line-clamp-2">{book.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                </CardContent>
                
                <CardFooter className="p-3 pt-0 flex flex-col space-y-2">
                    {/* Status de Leitura */}
                    <Badge className={cn("w-full justify-center text-xs text-white", getStatusColor(book.readingStatus))}>
                        {book.readingStatus}
                    </Badge>
                    
                    {/* Progresso (se estiver lendo) */}
                    {isReading && (
                        <div className="w-full space-y-1">
                            <Progress value={percentage} className="h-1.5" indicatorClassName="bg-dyad-500" />
                            <p className="text-xs text-muted-foreground text-right">
                                {percentage}% ({book.currentPage}/{totalPages})
                            </p>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
};