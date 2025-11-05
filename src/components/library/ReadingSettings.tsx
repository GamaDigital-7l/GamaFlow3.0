import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ReadingSettingsProps {
  settings: any; // Substitua 'any' pelo tipo correto
  onSettingsChange: (newSettings: any) => void;
}

export const ReadingSettings: React.FC<ReadingSettingsProps> = ({ settings, onSettingsChange }) => {
  const handleThemeChange = (theme: string) => {
    onSettingsChange({ ...settings, theme });
  };

  const handleFontSizeChange = (fontSize: number[]) => {
    onSettingsChange({ ...settings, fontSize: fontSize[0] });
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    onSettingsChange({ ...settings, fontFamily });
  };

  const handleLineSpacingChange = (lineSpacing: number[]) => {
    onSettingsChange({ ...settings, lineSpacing: lineSpacing[0] });
  };

  const handleMarginsChange = (margins: number[]) => {
    onSettingsChange({ ...settings, margins: margins[0] });
  };

  const handleScrollModeChange = (scrollMode: string) => {
    onSettingsChange({ ...settings, scrollMode });
  };

  const handleAutoNightModeChange = (autoNightMode: boolean) => {
    onSettingsChange({ ...settings, autoNightMode });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configurações de Leitura</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Tema */}
        <div className="space-y-2">
          <Label htmlFor="theme">Tema</Label>
          <Select value={settings.theme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="sepia">Sépia</SelectItem>
              <SelectItem value="high-contrast">Alto Contraste</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tamanho da Fonte */}
        <div className="space-y-2">
          <Label htmlFor="fontSize">Tamanho da Fonte</Label>
          <Slider
            defaultValue={[settings.fontSize || 16]}
            max={24}
            min={12}
            step={1}
            onValueChange={handleFontSizeChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fonte */}
        <div className="space-y-2">
          <Label htmlFor="fontFamily">Fonte</Label>
          <Select value={settings.fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="sans-serif">Sans-Serif</SelectItem>
              <SelectItem value="monospace">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Espaçamento entre Linhas */}
        <div className="space-y-2">
          <Label htmlFor="lineSpacing">Espaçamento entre Linhas</Label>
          <Slider
            defaultValue={[settings.lineSpacing || 1.5]}
            max={2.0}
            min={1.0}
            step={0.1}
            onValueChange={handleLineSpacingChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Margens */}
        <div className="space-y-2">
          <Label htmlFor="margins">Margens</Label>
          <Slider
            defaultValue={[settings.margins || 20]}
            max={50}
            min={10}
            step={5}
            onValueChange={handleMarginsChange}
          />
        </div>

        {/* Modo de Rolagem */}
        <div className="space-y-2">
          <Label htmlFor="scrollMode">Modo de Rolagem</Label>
          <Select value={settings.scrollMode} onValueChange={handleScrollModeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">Página</SelectItem>
              <SelectItem value="scroll">Contínuo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modo Noturno Automático */}
      <div className="flex items-center space-x-2">
        <Switch id="autoNightMode" checked={settings.autoNightMode} onCheckedChange={handleAutoNightModeChange} />
        <Label htmlFor="autoNightMode">Modo Noturno Automático</Label>
      </div>
    </div>
  );
};