import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

const UPLOAD_FILE_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/upload-file-proxy';

export const useUserAvatarUpload = (userId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) {
      showError('ID do usuário ausente para upload.');
      return null;
    }
    
    setIsUploading(true);
    
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
    
    try {
      const fileBase64 = await promise;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão de usuário necessária.");

      // 2. Call the Edge Function
      const response = await fetch(UPLOAD_FILE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filename: `${userId}_avatar_${Date.now()}.${file.name.split('.').pop()}`,
          fileType: file.type,
          fileBase64: fileBase64,
          path: `user-avatars/${userId}`, // Caminho específico para avatares de usuário
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file via Edge Function.');
      }

      // 3. Return the public URL
      showSuccess(`Upload de avatar concluído!`);
      return result.publicUrl;
    } catch (error) {
      showError(`Falha no upload: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  return {
    uploadAvatar,
    isUploading,
  };
};