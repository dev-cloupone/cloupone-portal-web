import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { SidebarLayout } from '../../components/ui/sidebar-layout';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import * as paymentService from '../../services/consultant-payment.service';
import * as consultantService from '../../services/consultant.service';
import { formatApiError } from '../../services/api';
import { useToastStore } from '../../stores/toast.store';
import { useNavItems } from '../../hooks/use-nav-items';



function buildYearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];
  for (let y = current + 1; y >= current - 3; y--) {
    options.push({ value: String(y), label: String(y) });
  }
  return options;
}

export default function PaymentHoursNewPage() {
  const navItems = useNavItems();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const MONTH_OPTIONS = [
    { value: '1', label: t('months.january') },
    { value: '2', label: t('months.february') },
    { value: '3', label: t('months.march') },
    { value: '4', label: t('months.april') },
    { value: '5', label: t('months.may') },
    { value: '6', label: t('months.june') },
    { value: '7', label: t('months.july') },
    { value: '8', label: t('months.august') },
    { value: '9', label: t('months.september') },
    { value: '10', label: t('months.october') },
    { value: '11', label: t('months.november') },
    { value: '12', label: t('months.december') },
  ];

  const [consultantOptions, setConsultantOptions] = useState<{ value: string; label: string }[]>([]);
  const [userId, setUserId] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadConsultants() {
      try {
        const result = await consultantService.listConsultants({ page: 1, limit: 100 });
        setConsultantOptions(result.data.map((c) => ({ value: c.userId, label: c.userName })));
      } catch { /* silent */ }
    }
    loadConsultants();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await paymentService.generateDraft({
        userId,
        year: Number(year),
        month: Number(month),
      });
      addToast(t('payments.draftGenerated'), 'success');
      navigate(`/financial/payments/hours/${result.id}`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SidebarLayout navItems={navItems} title={t('payments.generateHoursPayment')}>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/financial/payments/hours')}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">{t('payments.generateHoursPayment')}</h2>
        <p className="text-sm text-text-muted mt-1">
          {t('payments.selectConsultantAndPeriod')}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{t('payments.paymentData')}</h3>

          <Select
            label={t('common.consultant')}
            options={[{ value: '', label: t('payments.selectConsultant') }, ...consultantOptions]}
            value={userId}
            onChange={setUserId}
            required
          />

          <Select
            label={t('common.year')}
            options={buildYearOptions()}
            value={year}
            onChange={setYear}
            required
          />

          <Select
            label={t('common.month')}
            options={[{ value: '', label: t('payments.selectMonth') }, ...MONTH_OPTIONS]}
            value={month}
            onChange={setMonth}
            required
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/financial/payments/hours')}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting || !userId || !year || !month}>
            {submitting ? t('common.generating') : t('projects.generateDraft')}
          </Button>
        </div>
      </form>
    </SidebarLayout>
  );
}
