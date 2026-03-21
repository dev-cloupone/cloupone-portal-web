import { useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AuthLayout } from '../components/ui/auth-layout';
import { resetPassword } from '../services/auth.service';
import { formatApiError } from '../services/api';
import { MSG } from '../constants/messages';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20">
            <div className="h-3 w-3 rounded-full bg-danger" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Link Invalido</h2>
          <p className="text-sm text-text-tertiary">Este link de redefinicao de senha e invalido.</p>
          <Button variant="secondary" onClick={() => navigate('/forgot-password')}>
            Solicitar novo link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(MSG.PASSWORD_MIN_LENGTH);
      return;
    }

    if (password !== confirmPassword) {
      setError(MSG.PASSWORDS_DONT_MATCH);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof Error && err.message.includes('fetch')) {
        setError(MSG.CONNECTION_ERROR);
      } else {
        setError(formatApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center space-y-4">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
            <div className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Senha Redefinida</h2>
          <p className="text-sm text-text-tertiary">{MSG.RESET_PASSWORD_SUCCESS}</p>
          <Button onClick={() => navigate('/login', { state: { passwordReset: true } })}>
            Ir para Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="Crie sua nova senha">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nova Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          <div role="alert" className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-muted">
        <Link to="/login" className="text-text-tertiary hover:text-text-secondary transition-colors">
          Voltar para Login
        </Link>
      </p>
    </AuthLayout>
  );
}
