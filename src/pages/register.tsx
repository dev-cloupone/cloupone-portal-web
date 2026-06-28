import { useState, useEffect, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/use-auth';
import { getHomeRoute } from '../utils/get-home-route';
import { getPublicSettings } from '../services/public-settings';
import * as authService from '../services/auth.service';
import { formatApiError } from '../services/api';
import { MSG } from '../constants/messages';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AuthLayout } from '../components/ui/auth-layout';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        setAllowed(settings.allow_self_registration === 'true');
      })
      .catch(() => setAllowed(false));
  }, []);

  if (isAuthenticated && currentUser) {
    return <Navigate to={getHomeRoute(currentUser)} replace />;
  }

  if (allowed === false) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError(MSG.PASSWORD_MIN_LENGTH());
      return;
    }

    if (password !== confirmPassword) {
      setError(MSG.PASSWORDS_DONT_MATCH());
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.register({ name, email, password });
      setSuccess(t('auth.accountCreated'));
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (allowed === null) {
    return null;
  }

  return (
    <AuthLayout subtitle={t('auth.createAccountTitle')}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label={t('auth.name')}
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('auth.fullName')}
          required
        />

        <Input
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          required
        />

        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.minChars')}
          required
        />

        <Input
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t('auth.repeatPassword')}
          required
        />

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-success-muted border border-success/20 px-3 py-2">
            <p className="text-xs text-success">{success}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-text-tertiary">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
          {t('auth.signIn')}
        </Link>
      </p>
    </AuthLayout>
  );
}
