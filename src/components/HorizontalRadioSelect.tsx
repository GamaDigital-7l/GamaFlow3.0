import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface HorizontalRadioSelectProps {
  label: string;
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const HorizontalRadioSelect: React.FC<HorizontalRadioSelectProps> = ({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div
          className="flex space-x-3"
        >
          {options.map((option) => (
            <div 
              key={option.value} 
              className={cn(
                "flex items-center space-x-2 p-2 border rounded-md cursor-pointer transition-colors flex-shrink-0",
                value === option.value ? "bg-dyad-500 text-white border-dyad-500" : "bg-muted/50 hover:bg-muted",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none"
              )}
              onClick={() => !disabled && onValueChange(option.value)}
            >
              <Label 
                className={cn(
                    "font-medium cursor-pointer text-sm",
                    value === option.value ? "text-white" : "text-foreground"
                )}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};