import React from 'react';
import { UploadBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadBlockProps {
  id: string;
  data: UploadBlockData;
  onChange: (id: string, data: UploadBlockData) => void;
}

const UploadBlock: React.FC<UploadBlockProps> = ({ id, data, onChange }) => {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, label: e.target.value });
  };

  const handleAllowedTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement logic to handle allowed file types (e.g., comma-separated string)
    onChange(id, { ...data, allowedTypes: e.target.value.split(',') });
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <Label htmlFor={`upload-label-${id}`}>Label</Label>
        <Input
          type="text"
          id={`upload-label-${id}`}
          value={data.label || ''}
          onChange={handleLabelChange}
          placeholder="Enter label"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`upload-allowed-types-${id}`}>Allowed File Types (comma-separated)</Label>
        <Input
          type="text"
          id={`upload-allowed-types-${id}`}
          value={data.allowedTypes?.join(',') || ''}
          onChange={handleAllowedTypesChange}
          placeholder="e.g., image/*, application/pdf"
        />
      </div>
      <Input type="file" id={`upload-file-${id}`} />
    </div>
  );
};

export default UploadBlock;