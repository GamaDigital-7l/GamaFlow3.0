import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';

const Login: React.FC = () => {
  const { session, isLoading, userRole, clientId } = useSession(); // Adicionando userRole e clientId
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { theme } = useTheme();

  useEffect(() => {
    if (session && !isLoading) {
      if (userRole === 'client' && clientId) {
        // Cliente: Redireciona para o Playbook específico
        navigate(`/playbook/${clientId}`, { replace: true });
      } else if (userRole === 'admin' || userRole === 'user') {
        // Admin/User: Redireciona para o Dashboard
        navigate('/', { replace: true });
      } else if (userRole === 'client' && !clientId) {
        // Cliente sem clientId configurado (erro de configuração)
        console.error("Usuário é cliente, mas não tem client_id configurado no perfil.");
        // Permanece no login ou redireciona para uma página de erro
      }
    }
  }, [session, isLoading, userRole, clientId, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
  }
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
              <img 
                src={finalLogoUrl} 
                alt="Gama Creative Logo" 
                className="h-12 object-contain" 
              />
            ) : (
              <CardTitle className="text-2xl text-center text-dyad-500">Gama Creative</CardTitle>
            )}
          </div>
          <CardTitle className="text-xl text-center text-dyad-500">Acesso ao Portal do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(340 85% 51%)', // Dyad Pink
                    brandAccent: 'hsl(340 85% 61%)',
                  },
                },
              },
            }}
            theme="light"
            view="sign_in"
            // Mantendo a restrição de links para focar apenas no login
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={false} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;