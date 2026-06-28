import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { formatApiError } from '../../../services/api';
import * as bankAccountsService from '../../../services/bank-accounts.service';
import type { BankAccount } from '../../../services/bank-accounts.service';

export default function BankAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  const ACCOUNT_TYPES = [
    { value: 'corrente', label: t('admin.accountTypeCurrent') },
    { value: 'poupanca', label: t('admin.accountTypeSavings') },
  ];

  async function loadAccounts() {
    try {
      const data = await bankAccountsService.listBankAccounts(true);
      setAccounts(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAccounts(); }, []);

  function handleEdit(account: BankAccount) {
    setEditing(account);
    setModalOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setModalOpen(true);
  }

  async function handleToggle(account: BankAccount) {
    try {
      await bankAccountsService.toggleBankAccount(account.id);
      await loadAccounts();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleSave(data: Parameters<typeof bankAccountsService.createBankAccount>[0]) {
    if (editing) {
      await bankAccountsService.updateBankAccount(editing.id, data);
    } else {
      await bankAccountsService.createBankAccount(data);
    }
    await loadAccounts();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{t('admin.bankAccounts')}</h3>
        <Button onClick={handleNew}>
          <Plus size={16} className="mr-2" />
          {t('admin.newAccount')}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2 mb-4">
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-tertiary">{t('admin.noBankAccounts')}</p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('admin.nickname')}</TableHeader>
              <TableHeader>{t('admin.bank')}</TableHeader>
              <TableHeader>{t('admin.agency')}</TableHeader>
              <TableHeader>{t('admin.account')}</TableHeader>
              <TableHeader>{t('admin.accountType')}</TableHeader>
              <TableHeader>{t('common.status')}</TableHeader>
              <TableHeader className="text-right">{t('common.actions')}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} className={!account.isActive ? 'opacity-50' : ''}>
                <TableCell>{account.label}</TableCell>
                <TableCell>{account.bankName}</TableCell>
                <TableCell>{account.agency}</TableCell>
                <TableCell>{account.accountNumber}</TableCell>
                <TableCell>{account.accountType === 'corrente' ? t('admin.accountTypeCurrent') : t('admin.accountTypeSavings')}</TableCell>
                <TableCell>
                  <Badge variant={account.isActive ? 'success' : 'default'}>
                    {account.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>{t('common.edit')}</Button>
                    <Button variant={account.isActive ? 'danger' : 'secondary'} size="sm" onClick={() => handleToggle(account)}>
                      {account.isActive ? t('common.deactivate') : t('common.activate')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BankAccountFormModal
        isOpen={modalOpen}
        account={editing}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        accountTypes={ACCOUNT_TYPES}
      />
    </div>
  );
}

// --- Modal de Formulario ---

interface BankAccountFormModalProps {
  isOpen: boolean;
  account: BankAccount | null;
  onSave: (data: Parameters<typeof bankAccountsService.createBankAccount>[0]) => Promise<void>;
  onClose: () => void;
  accountTypes: { value: string; label: string }[];
}

function BankAccountFormModal({ isOpen, account, onSave, onClose, accountTypes }: BankAccountFormModalProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'corrente' | 'poupanca'>('corrente');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLabel(account?.label ?? '');
      setHolderName(account?.holderName ?? '');
      setBankName(account?.bankName ?? '');
      setAgency(account?.agency ?? '');
      setAccountNumber(account?.accountNumber ?? '');
      setAccountType(account?.accountType ?? 'corrente');
      setPixKey(account?.pixKey ?? '');
      setError('');
    }
  }, [isOpen, account]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave({ label, holderName, bankName, agency, accountNumber, accountType, pixKey: pixKey || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorSaving'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title={account ? t('admin.editAccount') : t('admin.newAccount')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('admin.nickname')} value={label} onChange={(e) => setLabel(e.target.value)} required placeholder={t('admin.nicknamePlaceholder')} />
        <Input label={t('admin.holder')} value={holderName} onChange={(e) => setHolderName(e.target.value)} required />
        <Input label={t('admin.bank')} value={bankName} onChange={(e) => setBankName(e.target.value)} required placeholder={t('admin.bankPlaceholder')} />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t('admin.agency')} value={agency} onChange={(e) => setAgency(e.target.value)} required />
          <Input label={t('admin.account')} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
        </div>
        <Select label={t('admin.accountType')} options={accountTypes} value={accountType} onChange={(v) => setAccountType(v as 'corrente' | 'poupanca')} />
        <Input label={t('admin.pixKeyOptional')} value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder={t('admin.optional')} />

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={loading}>{loading ? t('common.saving') : t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
