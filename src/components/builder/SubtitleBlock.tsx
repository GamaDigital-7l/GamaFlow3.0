import React from 'react';
import { SubtitleBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SubtitleBlockProps {
  id: string;
  data: SubtitleBlockData;
  onChange: (id: string, data: SubtitleBlockData) => void;
}

const SubtitleBlock: React.FC<SubtitleBlockProps> = ({ id, data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, subtitle: e.target.value });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`subtitle-${id}`}>Subtitle</Label>
      <Input
        type="text"
        id={`subtitle-${id}`}
        value={data.subtitle || ''}
        onChange={handleChange}
        placeholder="Enter your subtitle"
      />
    </div>
  );
};

export default SubtitleBlock;