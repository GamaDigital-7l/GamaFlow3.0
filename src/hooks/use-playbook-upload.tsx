import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const usePlaybookUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<{ url: string, type: string } | null> => {
    if (!clientId) {
      showError('ID do cliente ausente para upload.');
      return null;
    }
    
    setIsUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const filePath = `${clientId}/${uuidv4()}.${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('playbook-files') // Certifique-se de que este bucket existe no Supabase
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw new Error(error.message);
      
      const { data: publicUrlData } = supabase.storage
        .from('playbook-files')
        .getPublicUrl(filePath);
        
      if (!publicUrlData.publicUrl) throw new Error("Não foi possível obter a URL pública do arquivo.");
      
      showSuccess(`Upload de '${file.name}' concluído!`);
      return { url: publicUrlData.publicUrl, type: file.type };
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