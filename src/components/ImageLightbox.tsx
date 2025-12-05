import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast'; // Importando showError

interface ImageLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, onOpenChange, imageUrl, title }) => {
  
  const handleDownload = async () => {
    try {
      // 1. Fetch the image data
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image for download.');
      }
      
      // 2. Convert the response to a Blob
      const blob = await response.blob();
      
      // 3. Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob);
      
      // 4. Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // 5. Set the download filename
      const filename = title.replace(/[^a-z0-9]/gi, '_') || 'gama_creative_post'; 
      // Tenta inferir a extensão do tipo MIME, senão usa .jpg
      const extension = blob.type.split('/')[1] || 'jpg';
      link.download = `${filename}.${extension}`; 
      
      // 6. Simulate a click to trigger download
      document.body.appendChild(link);
      link.click();
      
      // 7. Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      showError(`Falha ao iniciar o download: ${error.message}`);
      console.error("Download error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          
          {/* Botão de Fechar - Posicionado no topo direito do DialogContent */}
          <div className="absolute top-4 right-4 z-50 flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={() => onOpenChange(false)}
              title="Fechar"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Imagem (Centralizada) */}
          <img 
            src={imageUrl} 
            alt={title} 
            className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
          
          {/* Controles de Ação e Dica (Abaixo da Imagem) */}
          <div className={cn(
              "w-full max-w-3xl mt-4 p-4 rounded-lg bg-card shadow-lg border border-dyad-500/50", // Adicionado destaque
              "flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4"
          )}>
              <p className="text-sm text-foreground font-medium text-center md:text-left flex-grow">
                  Dica: Clique e segure na imagem para salvar direto na galeria do seu dispositivo ou clique no botão de download.
              </p>
              
              <Button 
                variant="default" 
                className="bg-dyad-500 hover:bg-dyad-600 w-full md:w-auto"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" /> Fazer Download
              </Button>
          </div>
          
        </div>
      </DialogContent>
    </Dialog>
  );
};