import React from 'react';
import { CheckboxBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxBlockProps {
  id: string;
  data: CheckboxBlockData;
  onChange: (id: string, data: CheckboxBlockData) => void;
}

const CheckboxBlock: React.FC<CheckboxBlockProps> = ({ id, data, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, label: e.target.value });
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={`checkbox-${id}`} />
      <Label htmlFor={`checkbox-${id}`}>{data.label || 'Checkbox Label'}</Label>
    </div>
  );
};

export default CheckboxBlock;