import { Navigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-surface-0">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-glow-pulse" />
          <span className="text-xs text-text-muted">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
