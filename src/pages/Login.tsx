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
  const { session, isLoading, userRole, clientIds } = useSession(); // Usando clientIds
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { theme } = useTheme();

  useEffect(() => {
    if (session && !isLoading) {
      const firstClientId = clientIds?.[0];
      
      if ((userRole === 'client' || userRole === 'equipe') && firstClientId) {
        // Cliente ou Equipe: Redireciona para o Playbook do primeiro cliente vinculado
        navigate(`/playbook/${firstClientId}`, { replace: true });
      } else if (userRole === 'admin' || userRole === 'user') {
        // Admin/User: Redireciona para o Dashboard
        navigate('/', { replace: true });
      } else if (userRole === 'client' || userRole === 'equipe') {
        // Cliente/Equipe logado, mas sem client_id configurado. Permanece na tela de login com aviso.
        console.error(`Usuário é ${userRole}, mas não tem client_id configurado no perfil.`);
      }
    }
  }, [session, isLoading, userRole, clientIds, navigate]);

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
          <CardTitle className="text-xl text-center text-dyad-500">Acesso ao Portal</CardTitle>
          
          {/* Aviso para clientes/equipe sem vinculação */}
          {session && (userRole === 'client' || userRole === 'equipe') && !clientIds && (
            <p className="text-sm text-red-500 mt-2">
                Sua conta não está vinculada a um portal de cliente. Contate o administrador.
            </p>
          )}
          
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