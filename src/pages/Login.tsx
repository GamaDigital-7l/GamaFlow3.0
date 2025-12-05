import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function Login() {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && !isLoading) {
      navigate('/', { replace: true });
    }
  }, [session, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
          }}
          theme="light"
        />
      </div>
    </div>
  );
}

export default Login;