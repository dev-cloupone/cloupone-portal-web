import { Navigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { LoadingFallback } from './ui/loading-fallback';
import { getHomeRoute } from '../utils/get-home-route';

export function DefaultRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  return <Navigate to="/login" replace />;
}
