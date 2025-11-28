import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client'; // Importe o cliente Supabase

export const usePlaybookUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<{ url: string, type: string } | null> => {
    if (!clientId) {
      showError('ID do cliente ausente para upload.');
      return null;
    }
    
    setIsUploading(true);
    try {
      const filename = `playbook-files/${clientId}/${uuidv4()}-${file.name}`;

      // Use o cliente Supabase Storage para fazer o upload
      const { data, error } = await supabase
        .storage
        .from('playbook-files') // Substitua pelo nome do seu bucket
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Falha ao fazer upload para o Supabase Storage: ${error.message}`);
      }

      // Obtenha o URL público do arquivo
      const { data: { publicUrl } } = await supabase
        .storage
        .from('playbook-files') // Substitua pelo nome do seu bucket
        .getPublicUrl(data.path);

      showSuccess(`Upload de '${file.name}' concluído!`);
      return { url: publicUrl, type: file.type };
    } catch (error) {
      showError(`Falha no upload: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [clientId]);

  return {
    uploadFile,
    isUploading,
  };
};