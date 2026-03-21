import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AuthLayout } from '../components/ui/auth-layout';
import { forgotPassword } from '../services/auth.service';
import { formatApiError } from '../services/api';
import { MSG } from '../constants/messages';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
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

  return (
    <AuthLayout subtitle="Recupere sua senha">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
            <div className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Email Enviado</h2>
          <p className="text-sm text-text-secondary">
            {MSG.RESET_EMAIL_SENT}
          </p>
          <Button variant="secondary" className="w-full mt-2" onClick={() => navigate('/login')}>
            Voltar para Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-text-tertiary">
            Informe seu email e enviaremos instruções para redefinir sua senha.
          </p>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          {error && (
            <div role="alert" className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger whitespace-pre-line">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-text-muted">
        Lembrou sua senha?{' '}
        <Link to="/login" className="text-accent hover:text-accent-hover font-medium">
          Fazer login
        </Link>
      </p>
    </AuthLayout>
  );
}
