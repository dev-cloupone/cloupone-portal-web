import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { getHomeRoute } from '../utils/get-home-route';
import { api, formatApiError } from '../services/api';
import { MSG } from '../constants/messages';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AuthLayout } from '../components/ui/auth-layout';

export default function ChangePasswordFirstPage() {
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.mustChangePassword) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(MSG.PASSWORD_MIN_LENGTH);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(MSG.PASSWORDS_DONT_MATCH);
      return;
    }

    setIsSubmitting(true);
    try {
      await api('/auth/force-change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setUser({ ...user, mustChangePassword: false });
      navigate(getHomeRoute(user));
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout subtitle="Voce precisa alterar sua senha antes de continuar">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Senha Atual"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label="Nova Senha"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimo 8 caracteres"
          required
        />

        <Input
          label="Confirmar Nova Senha"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a nova senha"
          required
        />

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
        </Button>
      </form>
    </AuthLayout>
  );
}
