import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatApiError } from '../../../services/api';
import * as companyInfoService from '../../../services/company-info.service';

export default function CompanyInfoPage() {
  const [form, setForm] = useState({
    companyName: '',
    cnpj: '',
    address: '',
    zipCode: '',
    cityState: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    companyInfoService.getCompanyInfo()
      .then((data) => {
        setForm({
          companyName: data.companyName,
          cnpj: data.cnpj,
          address: data.address,
          zipCode: data.zipCode,
          cityState: data.cityState,
          phone: data.phone ?? '',
          email: data.email ?? '',
        });
      })
      .catch(() => { /* primeiro acesso, formulario vazio */ })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await companyInfoService.upsertCompanyInfo(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface-1 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Dados da Empresa</h3>
          <Input label="Razao Social" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          <Input label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} required />
          <Input label="Endereco" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CEP" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
            <Input label="Cidade / Estado" value={form.cityState} onChange={(e) => setForm({ ...form, cityState: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
            <p className="text-xs text-danger whitespace-pre-line">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-success-muted border border-success/20 px-3 py-2">
            <p className="text-xs text-success">Dados salvos com sucesso!</p>
          </div>
        )}

        <Button type="submit" disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
