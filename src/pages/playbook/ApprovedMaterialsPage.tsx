import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/hooks/use-client-store';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { ImageLightbox } from '@/components/ImageLightbox'; // Importando Lightbox
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovedMaterialsPageProps {
  clientId: string;
}

const ApprovedMaterialsPage: React.FC<ApprovedMaterialsPageProps> = ({ clientId }) => {
  const { getClientById } = useClientStore();
  const client = getClientById(clientId);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string, title: string } | null>(null);

  const handleImageClick = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setLightboxOpen(true);
  };

  const groupedPosts = useMemo(() => {
    if (!client) return {};
    const approvedStatuses = ['Aprovado', 'Publicado'];
    
    const posts = client.posts
      .filter(post => approvedStatuses.includes(post.status))
      .map(post => ({
        ...post,
        clientName: client.name,
      }))
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()); // Mais recentes primeiro

    // Agrupamento por Mês/Ano (monthYear: 'YYYY-MM')
    return posts.reduce((acc, post) => {
      // Garante que o monthYear seja válido, usando o campo monthYear do post
      const monthYearKey = post.monthYear && post.monthYear.length === 7 
        ? post.monthYear 
        : format(post.dueDate, 'yyyy-MM'); // Fallback para dueDate
        
      if (!acc[monthYearKey]) {
        acc[monthYearKey] = [];
      }
      acc[monthYearKey].push(post);
      return acc;
    }, {} as Record<string, typeof posts>);
  }, [client]);

  // Ordena as chaves (YYYY-MM) do mais recente para o mais antigo
  const sortedMonthYears = Object.keys(groupedPosts).sort().reverse(); 

  // Função para formatar a chave 'YYYY-MM' para exibição
  const formatMonthYear = (monthYearKey: string) => {
    try {
        // Cria uma data a partir de 'YYYY-MM-01'
        const date = parseISO(`${monthYearKey}-01`);
        return format(date, 'MMMM yyyy', { locale: ptBR });
    } catch {
        return monthYearKey;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Materiais Aprovados e Publicados</h2>
      <p className="text-muted-foreground">Miniaturas dos posts que já passaram pelo processo de aprovação e estão prontos ou já foram publicados.</p>
      
      {sortedMonthYears.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border rounded-lg">
          Nenhum material aprovado ou publicado encontrado para este cliente.
        </div>
      ) : (
        sortedMonthYears.map(monthYearKey => (
          <div key={monthYearKey} className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2 mt-4">
              {formatMonthYear(monthYearKey)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {groupedPosts[monthYearKey].map(post => (
                <Card 
                  key={post.id} 
                  className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
                  onClick={() => handleImageClick(post.imageUrl || '/placeholder.svg', post.title)}
                >
                  {/* Imagem de Capa (1080x1350 ajustada) */}
                  <div className={cn(
                    "relative w-full aspect-[4/5] bg-muted",
                    "shadow-md shadow-gray-400/50 dark:shadow-gray-900/50"
                  )}>
                    <img 
                      src={post.imageUrl || '/placeholder.svg'} 
                      alt={post.title} 
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className={cn(
                        "text-xs",
                        post.status === 'Publicado' ? 'bg-green-600' : 'bg-blue-600'
                      )}>
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                    <p className="text-xs text-dyad-500 font-semibold">{post.clientName}</p>
                    <p className="text-xs text-muted-foreground">Data: {formatDate(post.dueDate)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
      
      {selectedImage && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onOpenChange={setLightboxOpen}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
        />
      )}
    </div>
  );
};

export default ApprovedMaterialsPage;