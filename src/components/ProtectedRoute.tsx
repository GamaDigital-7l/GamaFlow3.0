import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-dyad-500" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};