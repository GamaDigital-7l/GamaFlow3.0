import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, onOpenChange, imageUrl, title }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
        <div className="relative w-full h-full">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={title} 
              className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};