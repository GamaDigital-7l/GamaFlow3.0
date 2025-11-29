import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientAvatarProps {
  name: string;
  logoUrl?: string;
  className?: string;
}

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  return '?';
};

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ name, logoUrl, className }) => {
  const initials = getInitials(name);
  
  // Verifica se a URL é válida e não é o placeholder padrão
  const hasValidLogo = logoUrl && logoUrl.trim() !== '' && logoUrl.trim() !== '/placeholder.svg';
  
  // Estado para controlar se a imagem falhou ao carregar
  const [imageError, setImageError] = React.useState(false);
  
  // Resetar o estado de erro quando a URL muda
  React.useEffect(() => {
    setImageError(false);
  }, [logoUrl]);

  const shouldShowInitials = !hasValidLogo || imageError;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-full flex items-center justify-center bg-muted border border-border",
      className
    )}>
      {shouldShowInitials ? (
        <span className="text-xl font-bold text-dyad-500">
          {initials}
        </span>
      ) : (
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};