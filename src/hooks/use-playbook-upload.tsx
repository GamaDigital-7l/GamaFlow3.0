import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client'; // Importe o cliente Supabase

const UPLOAD_CLIENT_LOGO_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/upload-client-logo';

export const usePlaybookUpload = (clientId: string) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<{ url: string, type: string } | null> => {
    if (!clientId) {
      showError('ID do cliente ausente para upload.');
      return null;
    }
    
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

      // 2. Call the Edge Function
      const response = await fetch(UPLOAD_CLIENT_LOGO_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneGV4cmpwZW1pZXR1dGZhbGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTMyMTgsImV4cCI6MjA3OTgyOTIxOH0.Le10RhCAtMRuXISpy90YcbleCp5FHFWnQYwtnwVnNg4`, // Substitua pelo seu anon key
        },
        body: JSON.stringify({
          filename: file.name,
          fileType: file.type,
          fileBase64: fileBase64,
          clientId: clientId,
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