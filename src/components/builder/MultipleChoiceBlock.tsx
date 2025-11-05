import React, { useState } from 'react';
import { MultipleChoiceBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface MultipleChoiceBlockProps {
  id: string;
  data: MultipleChoiceBlockData;
  onChange: (id: string, data: MultipleChoiceBlockData) => void;
}

const MultipleChoiceBlock: React.FC<MultipleChoiceBlockProps> = ({ id, data, onChange }) => {
  const [options, setOptions] = useState(data.options || ['Option 1', 'Option 2']);
  const [question, setQuestion] = useState(data.question || '');
  const [type, setType] = useState(data.type || 'radio');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onChange(id, { ...data, options: newOptions, question, type });
  };

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
    onChange(id, { ...data, options, question: e.target.value, type });
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    onChange(id, { ...data, options, question, type: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={`question-${id}`}>Question</Label>
        <Input
          type="text"
          id={`question-${id}`}
          value={question}
          onChange={handleQuestionChange}
          placeholder="Enter your question"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor={`type-${id}`}>Type</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="radio">Radio</SelectItem>
            <SelectItem value="select">Select</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-grow"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
            <Plus className="h-4 w-4 mr-2" /> Add Option
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultipleChoiceBlock;