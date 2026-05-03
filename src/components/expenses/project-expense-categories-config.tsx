import { useState, useEffect, useCallback } from 'react';
import { Pencil, XCircle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../ui/table';
import * as projectCategoryService from '../../services/project-expense-category.service';
import * as categoryTemplateService from '../../services/expense-category.service';
import { formatApiError } from '../../services/api';
import type { ProjectExpenseCategory, ExpenseCategoryTemplate } from '../../types/expense.types';

interface Props {
  projectId: string;
}

export function ProjectExpenseCategoriesConfig({ projectId }: Props) {
  const [categories, setCategories] = useState<ProjectExpenseCategory[]>([]);
  const [templates, setTemplates] = useState<ExpenseCategoryTemplate[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectExpenseCategory | null>(null);
  const [error, setError] = useState('');

  // Import form state
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [importMaxAmount, setImportMaxAmount] = useState('');
  const [importKmRate, setImportKmRate] = useState('');

  // Edit form state
  const [editMaxAmount, setEditMaxAmount] = useState('');
  const [editKmRate, setEditKmRate] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [catResult, tplResult] = await Promise.all([
        projectCategoryService.listByProject(projectId),
        categoryTemplateService.listCategories(),
      ]);
      setCategories(catResult.data);
      setTemplates(tplResult.data);
    } catch {
      setError('Erro ao carregar categorias do projeto');
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  function openImport() {
    setSelectedTemplateId('');
    setImportMaxAmount('');
    setImportKmRate('');
    setError('');
    setIsImportOpen(true);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplateId) return;
    setError('');
    try {
      await projectCategoryService.importFromTemplate(projectId, {
        templateId: selectedTemplateId,
        maxAmount: importMaxAmount || undefined,
        kmRate: importKmRate || undefined,
      });
      setIsImportOpen(false);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openEdit(category: ProjectExpenseCategory) {
    setEditMaxAmount(category.maxAmount || '');
    setEditKmRate(category.kmRate || '');
    setError('');
    setEditing(category);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await projectCategoryService.updateProjectCategory(projectId, editing.id, {
        maxAmount: editMaxAmount || null,
        kmRate: editKmRate || null,
      });
      setEditing(null);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function handleDeactivate(category: ProjectExpenseCategory) {
    if (!confirm(`Desativar "${category.name}" neste projeto?`)) return;
    try {
      await projectCategoryService.deactivateProjectCategory(projectId, category.id);
      await loadData();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function formatCurrency(value: string | null) {
    if (!value) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Filter templates not already imported (only check active categories)
  const availableTemplates = templates.filter(
    t => t.isActive && !categories.some(c => c.templateId === t.id && c.isActive),
  );

  const templateOptions = availableTemplates.map(t => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Categorias de Despesa do Projeto</h3>
        <Button size="sm" onClick={openImport}>
          <Download size={14} className="mr-1.5" /> Importar Categoria
        </Button>
      </div>

      {error && !isImportOpen && !editing && (
        <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2">
          <p className="text-xs text-danger whitespace-pre-line">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">
          Nenhuma categoria configurada. Importe categorias dos templates globais.
        </p>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Teto</TableHeader>
              <TableHeader>KM</TableHeader>
              <TableHeader>Comprovante</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{formatCurrency(c.maxAmount)}</TableCell>
                <TableCell>
                  {c.isKmCategory ? (
                    <Badge variant="default">{c.kmRate ? `R$ ${Number(c.kmRate).toFixed(2)}/km` : 'Sim'}</Badge>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={c.requiresReceipt ? 'default' : 'success'}>
                    {c.requiresReceipt ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-accent hover:text-accent-hover" title="Editar limites">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeactivate(c)} className="text-danger hover:text-danger/80" title="Desativar">
                      <XCircle size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => { setIsImportOpen(false); setError(''); }} title="Importar Categoria">
        <form onSubmit={handleImport} className="space-y-4">
          <Select
            label="Template"
            options={templateOptions}
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            placeholder="Selecione um template..."
          />
          {selectedTemplate && (
            <div className="text-xs text-text-tertiary space-y-1 bg-surface-2 rounded-lg p-3">
              {selectedTemplate.description && <p>{selectedTemplate.description}</p>}
              <p>Teto padrão: {formatCurrency(selectedTemplate.defaultMaxAmount)}</p>
              {selectedTemplate.isKmCategory && (
                <p>Taxa KM padrão: {selectedTemplate.defaultKmRate ? `R$ ${Number(selectedTemplate.defaultKmRate).toFixed(2)}/km` : '—'}</p>
              )}
              <p>Exige comprovante: {selectedTemplate.requiresReceipt ? 'Sim' : 'Não'}</p>
            </div>
          )}
          <Input
            label="Teto para este projeto (R$) — deixe vazio para usar padrão"
            type="number"
            step="0.01"
            min="0"
            value={importMaxAmount}
            onChange={(e) => setImportMaxAmount(e.target.value)}
            placeholder={selectedTemplate?.defaultMaxAmount || 'Sem limite'}
          />
          {selectedTemplate?.isKmCategory && (
            <Input
              label="Taxa KM para este projeto (R$/km) — deixe vazio para usar padrão"
              type="number"
              step="0.01"
              min="0"
              value={importKmRate}
              onChange={(e) => setImportKmRate(e.target.value)}
              placeholder={selectedTemplate?.defaultKmRate || 'Sem taxa'}
            />
          )}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setIsImportOpen(false); setError(''); }}>Cancelar</Button>
            <Button type="submit" disabled={!selectedTemplateId}>Importar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => { setEditing(null); setError(''); }} title={`Editar — ${editing?.name}`}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Teto (R$)"
            type="number"
            step="0.01"
            min="0"
            value={editMaxAmount}
            onChange={(e) => setEditMaxAmount(e.target.value)}
            placeholder="Sem limite"
          />
          {editing?.isKmCategory && (
            <Input
              label="Taxa KM (R$/km)"
              type="number"
              step="0.01"
              min="0"
              value={editKmRate}
              onChange={(e) => setEditKmRate(e.target.value)}
              placeholder="Sem taxa"
            />
          )}
          {error && <div className="rounded-lg bg-danger-muted border border-danger/20 px-3 py-2"><p className="text-xs text-danger whitespace-pre-line">{error}</p></div>}
          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={() => { setEditing(null); setError(''); }}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
