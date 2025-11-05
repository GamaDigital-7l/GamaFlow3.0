import React from 'react';
import { TextBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextBlockProps {
  id: string;
  data: TextBlockData;
  onChange: (id: string, data: TextBlockData) => void;
}

const TextBlock: React.FC<TextBlockProps> = ({ id, data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, text: e.target.value });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`text-${id}`}>Text</Label>
      <Input
        type="text"
        id={`text-${id}`}
        value={data.text || ''}
        onChange={handleChange}
        placeholder="Enter your text"
      />
    </div>
  );
};

export default TextBlock;