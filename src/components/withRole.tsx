import React from 'react';
import { useSession } from './SessionContextProvider';
import { Navigate } from 'react-router-dom';

type Role = string | string[];

interface WithRoleProps {
  children: React.ReactNode;
  requiredRole: Role;
}

export const withRole = (WrappedComponent: React.ComponentType<any>, requiredRole: Role) => {
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  const WithRole: React.FC<Omit<WithRoleProps, 'requiredRole'>> = ({ children, ...props }) => {
    const { userRole, isLoading } = useSession();

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">Carregando...</div>;
    }

    if (!userRole) {
      return <Navigate to="/login" replace />;
    }
    
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      const roleList = requiredRoles.join(' ou ');
      return (
        <div className="flex justify-center items-center min-h-screen p-4 text-center">
          Acesso negado. Você precisa ter a role de "{roleList}" para acessar esta página.
        </div>
      );
    }

    return <WrappedComponent {...props}>{children}</WrappedComponent>;
  };

  return WithRole;
};