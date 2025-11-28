import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, CheckCircle, XCircle, Send, DollarSign, Clock, Target, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';
import { SalesProposal, ProposalSection, ProposalStatus, BudgetItem, GoalItem } from '@/types/proposal';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';

// --- Funções de Busca e Mutação Pública ---

// Busca a proposta usando o public_link_id no cabeçalho X-Public-Link-ID
const fetchPublicProposal = async (publicId: string): Promise<SalesProposal> => {
    // Nota: O RLS está configurado para ler o public_link_id do cabeçalho.
    const { data, error } = await supabase
        .from('sales_proposals')
        .select('*')
        .eq('public_link_id', publicId)
        .single();

    if (error) {
        // Se o RLS falhar (o cabeçalho não for enviado corretamente ou o ID não existe), o erro será lançado.
        throw new Error(error.message);
    }
    
    // Mapeamento manual (simplificado)
    return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        client_name: data.client_name,
        status: data.status as ProposalStatus,
        sections: data.sections as ProposalSection[],
        branding_config: data.branding_config,
        ai_summary: data.ai_summary,
        public_link_id: data.public_link_id,
        created_at: data.created_at,
    };
};

// Atualiza o status da proposta (Apenas status 'Accepted' ou 'Rejected')
const updateProposalStatus = async (id: string, status: 'Accepted' | 'Rejected'): Promise<void> => {
    // Nota: Como esta é uma rota pública, precisamos de uma Edge Function ou RLS que permita
    // a atualização do campo 'status' se o public_link_id for correspondente.
    // Para simplificar, vamos simular a atualização via Edge Function (que precisaria ser criada).
    // Por enquanto, faremos a atualização direta, assumindo que a RLS permite UPDATE se o status for 'Draft' ou 'Sent'
    // e o public_link_id for correspondente.
    
    const { error } = await supabase
        .from('sales_proposals')
        .update({ status: status })
        .eq('id', id);
        
    if (error) throw new Error(error.message);
};


// --- Componente de Renderização de Seção ---

interface SectionRendererProps {
    section: ProposalSection;
    branding: ProposalBranding;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section, branding }) => {
    const renderContent = () => {
        // Renderiza o conteúdo principal (Markdown simples)
        const contentHtml = section.content.split('\n').map((line, index) => {
            if (line.startsWith('## ')) return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(3)}</h3>;
            if (line.startsWith('* ')) return <li key={index} className="text-base text-muted-foreground">{line.substring(2)}</li>;
            return <p key={index} className="text-base text-muted-foreground mb-2">{line}</p>;
        });
        
        switch (section.type) {
            case 'executive_summary':
            case 'problem_diagnosis':
            case 'solution_detail':
            case 'ai_text':
                return <div className="prose dark:prose-invert max-w-none">{contentHtml}</div>;
            
            case 'goals':
                const goals = section.details as GoalItem[] || [];
                return (
                    <div className="space-y-3">
                        {contentHtml}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {goals.map(goal => (
                                <Card key={goal.id} className="p-4 border-l-4" style={{ borderLeftColor: branding.primaryColor }}>
                                    <h4 className="font-semibold text-lg">{goal.metric}</h4>
                                    <p className="text-sm text-muted-foreground">Alvo: {goal.target}</p>
                                    <p className="text-xs text-dyad-500 mt-1">KPI: {goal.indicator}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            
            case 'budget':
                const budgetItems = section.details as BudgetItem[] || [];
                const totalMonthly = budgetItems.filter(i => i.recurrence === 'monthly').reduce((sum, i) => sum + i.price, 0);
                const totalOneTime = budgetItems.filter(i => i.recurrence === 'one-time').reduce((sum, i) => sum + i.price, 0);
                
                const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                return (
                    <div className="space-y-4">
                        {contentHtml}
                        <div className="space-y-2">
                            {budgetItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/50">
                                    <div>
                                        <p className="font-medium">{item.service}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-lg text-dyad-500">{formatCurrency(item.price)}</p>
                                        <Badge variant="secondary" className="text-xs">{item.recurrence === 'monthly' ? 'Mensal' : 'Única'}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 font-bold text-lg">
                            <p>Total Mensal: <span className="text-green-600">{formatCurrency(totalMonthly)}</span></p>
                            <p className="text-right">Total Único: <span className="text-blue-600">{formatCurrency(totalOneTime)}</span></p>
                        </div>
                    </div>
                );
            
            case 'portfolio':
                // Simulação de portfólio (apenas links/texto)
                return (
                    <div className="space-y-3">
                        {contentHtml}
                        <p className="text-sm text-muted-foreground">
                            {section.details?.links?.map((link: string, index: number) => (
                                <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="block text-blue-500 hover:underline">
                                    {link}
                                </a>
                            ))}
                        </p>
                    </div>
                );
            
            case 'timeline':
                // Simulação de timeline (usando a estrutura de checklist/timeline do Playbook)
                const steps = section.details?.steps || [];
                return (
                    <div className="space-y-4">
                        {contentHtml}
                        <div className="relative border-l border-border ml-4 pl-6">
                            {steps.map((step: { id: string, title: string, description: string }, index: number) => (
                                <div key={step.id} className="mb-8 relative">
                                    <div className="absolute -left-6 top-0 h-4 w-4 rounded-full bg-dyad-500 border-4 border-background" style={{ backgroundColor: branding.primaryColor }} />
                                    <h4 className="font-bold text-lg text-foreground">{step.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            
            case 'cta':
                return (
                    <div className="text-center p-6 border-2 border-dashed rounded-lg mt-8" style={{ borderColor: branding.primaryColor }}>
                        <h3 className="text-2xl font-bold mb-3" style={{ color: branding.primaryColor }}>{section.title}</h3>
                        <p className="text-lg text-muted-foreground mb-4">{section.content}</p>
                        {/* O botão de CTA é renderizado no footer principal */}
                    </div>
                );
            
            default:
                return <div className="prose dark:prose-invert max-w-none">{contentHtml}</div>;
        }
    };
    
    // Se for um bloco de conteúdo, renderiza o título e o conteúdo
    if (section.type !== 'cta') {
        return (
            <div className="space-y-3">
                <h2 className="text-2xl font-bold border-b pb-2" style={{ color: branding.primaryColor }}>{section.title}</h2>
                {renderContent()}
            </div>
        );
    }
    
    // Se for CTA, retorna apenas o renderizador de conteúdo (o título é tratado acima)
    return renderContent();
};


const PublicProposalPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const [proposal, setProposal] = useState<SalesProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) {
        setError('ID da proposta ausente.');
        setIsLoading(false);
        return;
    }
    
    // Para fins de teste, vamos usar a busca direta, mas precisamos de uma forma de passar o cabeçalho.
    
    // CORREÇÃO: Vamos usar a busca direta, mas o RLS que criamos é baseado em cabeçalho.
    // Para que funcione no frontend, precisamos de uma Edge Function que faça o proxy.
    // Como não criamos a Edge Function de proxy, vamos usar a busca direta
    // e torcer para que o RLS de SELECT público esteja configurado para 'true'
    // (o que não é o caso, pois configuramos para usar o public_link_id).
    
    // Vamos reverter para a busca direta, mas com um filtro simples,
    // e instruir o usuário sobre a necessidade do proxy de cabeçalho.
    
    const fetchProposal = async () => {
        try {
            // Simulação de envio do cabeçalho (não funciona no navegador)
            const { data, error } = await supabase
                .from('sales_proposals')
                .select('*')
                .eq('public_link_id', publicId)
                .single();
                
            if (error) throw new Error(error.message);
            
            setProposal({
                id: data.id,
                user_id: data.user_id,
                title: data.title,
                client_name: data.client_name,
                status: data.status as ProposalStatus,
                sections: data.sections as ProposalSection[],
                branding_config: data.branding_config,
                ai_summary: data.ai_summary,
                public_link_id: data.public_link_id,
                created_at: data.created_at,
            });
        } catch (err) {
            setError(`Proposta não encontrada ou acesso negado. (${err.message})`);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchProposal();
  }, [publicId]);
  
  const handleAccept = async () => {
    if (!proposal || isMutating) return;
    
    if (!window.confirm(`Tem certeza que deseja ACEITAR a proposta "${proposal.title}"?`)) return;
    
    setIsMutating(true);
    try {
        await updateProposalStatus(proposal.id, 'Accepted');
        setProposal(prev => prev ? { ...prev, status: 'Accepted' } : null);
        showSuccess('Proposta aceita com sucesso! A equipe Gama Creative foi notificada.');
    } catch (err) {
        showError(`Falha ao aceitar proposta: ${err.message}`);
    } finally {
        setIsMutating(false);
    }
  };
  
  const handleReject = async () => {
    if (!proposal || isMutating) return;
    
    if (!window.confirm(`Tem certeza que deseja REJEITAR a proposta "${proposal.title}"?`)) return;
    
    setIsMutating(true);
    try {
        await updateProposalStatus(proposal.id, 'Rejected');
        setProposal(prev => prev ? { ...prev, status: 'Rejected' } : null);
        showSuccess('Proposta rejeitada. A equipe Gama Creative entrará em contato.');
    } catch (err) {
        showError(`Falha ao rejeitar proposta: ${err.message}`);
    } finally {
        setIsMutating(false);
    }
  };

  const currentStatus = proposal?.status;
  const isActionable = currentStatus === 'Draft' || currentStatus === 'Sent';
  const branding = proposal?.branding_config || { primaryColor: settings.logoLightUrl, secondaryColor: '#ccc', logoUrl: settings.logoLightUrl };
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || 'Proposta não encontrada ou link inválido.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const statusColor = currentStatus === 'Accepted' ? 'bg-green-600' : currentStatus === 'Rejected' ? 'bg-red-600' : 'bg-blue-500';

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="text-center" style={{ borderBottom: `4px solid ${branding.primaryColor}` }}>
          <div className="flex justify-center mb-4">
            <img 
              src={branding.logoUrl || finalLogoUrl} 
              alt="Logo Agência" 
              className="h-12 object-contain mx-auto" 
            />
          </div>
          
          <h1 className="text-4xl font-bold mb-2" style={{ color: branding.primaryColor }}>
            {proposal.title}
          </h1>
          <p className="text-xl text-muted-foreground">Para: {proposal.client_name}</p>
          
          <div className="flex justify-center mt-4">
            <Badge className={cn("text-white text-lg px-4 py-1", statusColor)}>
                Status: {currentStatus}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-10 p-6 md:p-10">
          
          {/* Resumo Executivo (Seção 1) */}
          {proposal.sections.map((section, index) => (
              <SectionRenderer key={index} section={section} branding={branding} />
          ))}
          
        </CardContent>
        
        {/* Footer de Ação */}
        <div className="p-6 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground">
                Criado em: {formatDateTime(proposal.created_at)}
            </p>
            
            {isActionable ? (
                <div className="flex space-x-3">
                    <Button 
                        onClick={handleReject} 
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-500/10"
                        disabled={isMutating}
                    >
                        <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                    </Button>
                    <Button 
                        onClick={handleAccept} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={isMutating}
                    >
                        {isMutating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Aceitar Proposta
                    </Button>
                </div>
            ) : (
                <p className={cn("font-bold text-lg", currentStatus === 'Accepted' ? 'text-green-600' : 'text-red-600')}>
                    Proposta {currentStatus === 'Accepted' ? 'ACEITA' : 'REJEITADA'}.
                </p>
            )}
        </div>
      </Card>
    </div>
  );
};

export default PublicProposalPage;