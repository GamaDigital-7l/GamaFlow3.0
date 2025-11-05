import React from 'react';
import { TitleBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TitleBlockProps {
  id: string;
  data: TitleBlockData;
  onChange: (id: string, data: TitleBlockData) => void;
}

const TitleBlock: React.FC<TitleBlockProps> = ({ id, data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, title: e.target.value });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`title-${id}`}>Title</Label>
      <Input
        type="text"
        id={`title-${id}`}
        value={data.title || ''}
        onChange={handleChange}
        placeholder="Enter your title"
      />
    </div>
  );
};

export default TitleBlock;