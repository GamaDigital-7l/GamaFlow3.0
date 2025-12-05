import React, { useMemo } from 'react';
import { BriefingResponse, BriefingForm, BriefingField, FieldType } from '@/types/briefing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/utils/date';
import { FileText, User, Clock, Link as LinkIcon, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface BriefingResponseDetailsProps {
  response: BriefingResponse;
  form: BriefingForm;
  clientName?: string;
}

const getFieldIcon = (type: FieldType) => {
    switch (type) {
        case 'text_short':
        case 'text_long':
            return <FileText className="h-4 w-4 text-dyad-500" />;
        case 'select_single':
        case 'select_multiple':
        case 'dropdown':
            return <User className="h-4 w-4 text-dyad-500" />;
        case 'upload':
            return <Upload className="h-4 w-4 text-dyad-500" />;
        case 'link':
            return <LinkIcon className="h-4 w-4 text-dyad-500" />;
        default:
            return <FileText className="h-4 w-4 text-dyad-500" />;
    }
};

const formatResponseValue = (field: BriefingField, value: any): React.ReactNode => {
    if (value === undefined || value === null || value === '') {
        return <span className="text-muted-foreground italic">Não respondido</span>;
    }
    
    if (field.type === 'date') {
        try {
            return formatDateTime(new Date(value));
        } catch {
            return value;
        }
    }
    
    if (Array.isArray(value)) {
        if (field.type === 'upload') {
            // Simulação de arquivos
            return (
                <ul className="list-disc list-inside space-y-1">
                    {value.map((file: File, index) => (
                        <li key={index} className="text-sm">{file.name}</li>
                    ))}
                </ul>
            );
        }
        return value.join(', ');
    }
    
    if (typeof value === 'object' && value.name) {
        // Caso de upload de arquivo simulado (objeto File)
        return value.name;
    }

    return value.toString();
};

export const BriefingResponseDetails: React.FC<BriefingResponseDetailsProps> = ({ response, form, clientName }) => {
  
  const fieldMap = useMemo(() => {
    return new Map(form.fields.map(f => [f.id, f]));
  }, [form.fields]);

  // Filtra apenas campos que foram respondidos e não são apenas informativos
  const answeredFields = useMemo(() => {
    return Object.entries(response.response_data)
      .map(([fieldId, value]) => {
        const field = fieldMap.get(fieldId);
        if (!field || field.type === 'section' || field.type === 'description') return null;
        return { field, value };
      })
      .filter(item => item !== null);
  }, [response.response_data, fieldMap]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center space-x-2">
            <Clock className="h-5 w-5 text-dyad-500" />
            <span>Resposta de {clientName || 'Público'}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
            Enviado em: {formatDateTime(response.submitted_at)}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        <h3 className="text-lg font-semibold border-b pb-2">Respostas do Formulário: {form.title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {answeredFields.map(({ field, value }) => (
            <div key={field.id} className="space-y-1 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2 text-sm font-medium">
                {getFieldIcon(field.type)}
                <span className="text-foreground">{field.label}</span>
              </div>
              <div className="text-sm pl-6 text-foreground/80">
                {formatResponseValue(field, value)}
              </div>
            </div>
          ))}
        </div>
        
        {answeredFields.length === 0 && (
            <p className="text-center text-muted-foreground">Nenhuma resposta interativa registrada.</p>
        )}
      </CardContent>
    </Card>
  );
};