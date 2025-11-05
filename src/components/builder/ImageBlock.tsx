import React from 'react';
import { ImageBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageBlockProps {
  id: string;
  data: ImageBlockData;
  onChange: (id: string, data: ImageBlockData) => void;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ id, data, onChange }) => {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, url: e.target.value });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`image-url-${id}`}>Image URL</Label>
      <Input
        type="url"
        id={`image-url-${id}`}
        value={data.url || ''}
        onChange={handleUrlChange}
        placeholder="Enter image URL"
      />
      {data.url && (
        <img
          src={data.url}
          alt="Image"
          className="max-w-full h-auto"
        />
      )}
    </div>
  );
};

export default ImageBlock;