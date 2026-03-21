import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { getHomeRoute } from '../utils/get-home-route';
import { useAuthStore } from '../stores/auth.store';
import { getPublicSettings } from '../services/public-settings';
import { MSG } from '../constants/messages';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AuthLayout } from '../components/ui/auth-layout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(false);
  const { login, user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        setAllowRegistration(settings.allow_self_registration === 'true');
      })
      .catch(() => {});
  }, []);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getHomeRoute(currentUser)} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const { user } = useAuthStore.getState();
      if (user) {
        navigate(getHomeRoute(user));
      }
    } catch (err) {
      console.warn('[auth] Login failed:', err);
      if (err instanceof Error && err.message.includes('fetch')) {
        setError(MSG.CONNECTION_ERROR);
      } else {
        setError(MSG.WRONG_CREDENTIALS);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Acesse sua conta">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />

        <div>
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-xs text-text-tertiary hover:text-accent transition-colors">
              Esqueceu sua senha?
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      {allowRegistration && (
        <p className="mt-5 text-center text-xs text-text-tertiary">
          Nao tem uma conta?{' '}
          <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
            Criar conta
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
