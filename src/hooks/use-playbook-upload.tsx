import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client'; // Importe o cliente Supabase

const UPLOAD_FILE_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/upload-file-proxy';

export const usePlaybookUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File, customPath?: string): Promise<{ url: string, type: string } | null> => {
    const finalClientId = clientId || 'app-settings'; // Usa 'app-settings' se clientId for vazio
    
    setIsUploading(true);
    try {
      // 1. Convert the file to base64
      const fileReader = new FileReader();
      const promise = new Promise<string>((resolve, reject) => {
        fileReader.onload = (event) => {
          const base64String = event.target?.result?.toString().split(',')[1];
          if (base64String) {
            resolve(base64String);
          } else {
            reject(new Error('Failed to convert file to base64.'));
          }
        };
        fileReader.onerror = (error) => reject(error);
        fileReader.readAsDataURL(file);
      });
      const fileBase64 = await promise;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão de usuário necessária.");

      // 2. Call the Edge Function
      const response = await fetch(UPLOAD_FILE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Usando o token da sessão
        },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          fileBase64: fileBase64,
          // Usa o customPath se fornecido, senão usa o caminho padrão do cliente
          path: customPath || `client-logos/${finalClientId}`, 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file via Edge Function.');
      }

      // 3. Return the public URL
      showSuccess(`Upload de '${file.name}' concluído!`);
      return { url: result.publicUrl, type: file.type };
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