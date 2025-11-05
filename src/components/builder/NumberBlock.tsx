import React from 'react';
import { NumberBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberBlockProps {
  id: string;
  data: NumberBlockData;
  onChange: (id: string, data: NumberBlockData) => void;
}

const NumberBlock: React.FC<NumberBlockProps> = ({ id, data, onChange }) => {
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, label: e.target.value });
  };

  const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, placeholder: e.target.value });
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        <Label htmlFor={`number-label-${id}`}>Label</Label>
        <Input
          type="text"
          id={`number-label-${id}`}
          value={data.label || ''}
          onChange={handleLabelChange}
          placeholder="Enter label"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`number-placeholder-${id}`}>Placeholder (Optional)</Label>
        <Input
          type="text"
          id={`number-placeholder-${id}`}
          value={data.placeholder || ''}
          onChange={handlePlaceholderChange}
          placeholder="Enter placeholder"
        />
      </div>
    </div>
  );
};

export default NumberBlock;