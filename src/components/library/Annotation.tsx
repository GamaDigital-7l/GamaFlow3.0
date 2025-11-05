import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, X, Edit, Save, CheckCircle } from 'lucide-react';

interface AnnotationProps {
  highlightedText: string;
  onSave: (note: string, color: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const COLOR_OPTIONS = ['yellow', 'green', 'blue', 'red', 'purple'];

export const Annotation: React.FC<AnnotationProps> = ({ highlightedText, onSave, onCancel, isSaving }) => {
  const [note, setNote] = useState('');
  const [color, setColor] = useState('yellow');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(note, color);
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h4 className="text-lg font-semibold">Anotação</h4>
      <p className="text-sm text-muted-foreground">Texto selecionado: {highlightedText}</p>
      
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="note">Anotação</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Escreva sua anotação aqui..."
            rows={3}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="color">Cor do Destaque</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cor" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Anotação'}
          </Button>
        </div>
      </form>
    </div>
  );
};