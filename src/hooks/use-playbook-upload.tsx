import { useState, useCallback } from 'react';
import { showSuccess, showError } from '@/utils/toast';
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
      const filename = `${clientId}/${uuidv4()}-${file.name}`;
      const uploadUrl = `${import.meta.env.VITE_NEXTCLOUD_UPLOAD_URL}/${filename}`;

      // 1. Fetch Nextcloud credentials from the API endpoint
      const credentialsResponse = await fetch('/api/nextcloud-upload-credentials', {
        headers: {
          'Authorization': `Bearer YOUR_SECRET_API_KEY`, // Replace with your actual API key
        },
      });

      if (!credentialsResponse.ok) {
        throw new Error('Failed to fetch Nextcloud upload credentials.');
      }

      const credentials = await credentialsResponse.json();

      // 2. Perform the WebDAV upload using the fetched credentials
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to Nextcloud: ${uploadResponse.statusText}`);
      }

      showSuccess(`Upload de '${file.name}' concluído!`);
      return { url: uploadUrl, type: file.type };
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