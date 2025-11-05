import React from 'react';
import { ButtonBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ButtonBlockProps {
  id: string;
  data: ButtonBlockData;
  onChange: (id: string, data: ButtonBlockData) => void;
}

const ButtonBlock: React.FC<ButtonBlockProps> = ({ id, data, onChange }) => {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, label: e.target.value });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, url: e.target.value });
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <Label htmlFor={`button-label-${id}`}>Button Label</Label>
        <Input
          type="text"
          id={`button-label-${id}`}
          value={data.label || ''}
          onChange={handleLabelChange}
          placeholder="Button Text"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`button-url-${id}`}>Button URL</Label>
        <Input
          type="url"
          id={`button-url-${id}`}
          value={data.url || ''}
          onChange={handleUrlChange}
          placeholder="https://example.com"
        />
      </div>
      <Button asChild>
        <a href={data.url} target="_blank" rel="noopener noreferrer">{data.label || 'Click Here'}</a>
      </Button>
    </div>
  );
};

export default ButtonBlock;