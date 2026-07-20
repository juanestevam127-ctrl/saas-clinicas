'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, ChevronRight, Loader2, Trash2, Clipboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Paciente = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  genero: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  _count?: { consultas: number };
};

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
];

// Mask helpers
function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, '$1-$2');
}

const emptyForm = {
  nome: '',
  telefone: '',
  email: '',
  cpf: '',
  dataNascimento: '',
  genero: '',
  cep: '',
  endereco: '',
  cidade: '',
  estado: '',
  ativo: true,
};

export default function PacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [loading, setLoading] = useState(true);

  // Perfil de Acesso/Visualização
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loadingCep, setLoadingCep] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPacientes();

    const handleProfileChange = () => {
      setUserRole((localStorage.getItem('agendaduo_user_role') as any) || 'admin');
      setSelectedProfissionalId(localStorage.getItem('agendaduo_user_profissional_id') || '');
    };

    handleProfileChange();
    window.addEventListener('auth-profile-changed', handleProfileChange);
    return () => window.removeEventListener('auth-profile-changed', handleProfileChange);
  }, []);

  const fetchPacientes = async () => {
    try {
      const [pacRes, consRes] = await Promise.all([
        api.get('/pacientes'),
        api.get('/consultas')
      ]);
      setPacientes(pacRes.data);
      setConsultas(consRes.data);

      // Abrir modal de edição automaticamente se vier redirecionado do prontuário
      const urlParams = new URLSearchParams(window.location.search);
      const paramEditarId = urlParams.get('editarPacienteId');
      if (paramEditarId) {
        const found = pacRes.data.find((p: any) => p.id === paramEditarId);
        if (found) {
          openEditModal(found);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      toast.error('Erro ao buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = pacientes.filter(p => {
    const term = search.toLowerCase();
    const matchSearch = p.nome.toLowerCase().includes(term) ||
      (p.email && p.email.toLowerCase().includes(term)) ||
      (p.telefone && p.telefone.includes(term));
    const matchStatus = filterAtivo === 'todos' ||
      (filterAtivo === 'ativos' && p.ativo) ||
      (filterAtivo === 'inativos' && !p.ativo);

    return matchSearch && matchStatus;
  });

  const openNewModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (paciente: Paciente) => {
    setEditingId(paciente.id);
    setFormData({
      nome: paciente.nome,
      telefone: paciente.telefone || '',
      email: paciente.email || '',
      cpf: paciente.cpf || '',
      dataNascimento: paciente.dataNascimento ? paciente.dataNascimento.split('T')[0] : '',
      genero: paciente.genero || '',
      cep: '',
      endereco: '',
      cidade: '',
      estado: '',
      ativo: paciente.ativo,
    });
    setIsModalOpen(true);
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      setFormData(prev => ({
        ...prev,
        endereco: `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''} - ${data.bairro}`,
        cidade: data.localidade,
        estado: data.uf,
      }));
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('[Pacientes] handleSubmit chamado! formData.nome =', formData.nome);
    if (!formData.nome) {
      toast.error('O nome é obrigatório');
      return;
    }
    setSaving(true);

    const payload: any = {
      nome: formData.nome,
      ativo: formData.ativo,
    };

    if (formData.email) payload.email = formData.email;
    if (formData.telefone) payload.telefone = formData.telefone;
    if (formData.cpf) payload.cpf = formData.cpf;
    if (formData.genero) payload.genero = formData.genero;
    if (formData.dataNascimento) {
      try {
        payload.dataNascimento = new Date(formData.dataNascimento + 'T12:00:00').toISOString();
      } catch (err) {
        // Ignora data inválida
      }
    }

    if (formData.endereco) {
      let addr = formData.endereco;
      if (formData.cidade) addr += ` - ${formData.cidade}`;
      if (formData.estado) addr += `/${formData.estado}`;
      if (formData.cep) addr += ` ${formData.cep}`;
      payload.observacoes = `Endereço: ${addr}`;
    }

    try {
      if (editingId) {
        await api.patch(`/pacientes/${editingId}`, payload);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await api.post('/pacientes', payload);
        toast.success('Paciente criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchPacientes();
    } catch (error: any) {
      console.error('[Pacientes] Erro detalhado:', error?.response?.status, JSON.stringify(error?.response?.data));
      const msg = error?.response?.data?.message;
      if (Array.isArray(msg)) {
        toast.error('Erro de validação: ' + msg.join(', '));
      } else if (typeof msg === 'string') {
        toast.error('Erro: ' + msg);
      } else {
        toast.error('Erro ao salvar paciente. Abra o Console (F12) para detalhes.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!confirm('Deseja realmente deletar permanentemente este paciente do banco?')) return;
    try {
      await api.delete(`/pacientes/${editingId}`);
      toast.success('Paciente excluído com sucesso!');
      setIsModalOpen(false);
      fetchPacientes();
    } catch {
      toast.error('Erro ao deletar paciente');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pacientes</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {`${pacientes.filter(p => p.ativo).length} pacientes ativos na clínica`}
          </p>
        </div>
        <button onClick={openNewModal} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Plus className="w-4 h-4" />
          Novo Paciente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: filtered.length, icon: '👥' },
          { label: 'Ativos', value: filtered.filter(p => p.ativo).length, icon: '✅' },
          { label: 'Inativos', value: filtered.filter(p => !p.ativo).length, icon: '⏸️' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(['todos', 'ativos', 'inativos'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterAtivo(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                filterAtivo === f
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-slate-500 font-medium">Nenhum paciente encontrado</p>
            </div>
          ) : (
            filtered.map((paciente, i) => (
              <div
                key={paciente.id}
                onClick={() => openEditModal(paciente)}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {getInitials(paciente.nome)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">{paciente.nome}</span>
                    {!paciente.ativo && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium">Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {paciente.telefone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="w-3 h-3" />
                        {paciente.telefone}
                      </span>
                    )}
                    {paciente.email && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="w-3 h-3" />
                        {paciente.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/app/prontuarios?pacienteId=${paciente.id}`);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Prontuário
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            {/* Nome */}
            <div className="space-y-1.5">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: João da Silva"
                required
              />
            </div>

            {/* Ativo/Inativo Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="ativo-chk"
                type="checkbox"
                checked={formData.ativo}
                onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="ativo-chk" className="cursor-pointer">Paciente Ativo (Desmarque para desativar)</Label>
            </div>

            {/* Telefone + CPF */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: maskTelefone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input
                  value={formData.cpf}
                  onChange={e => setFormData({ ...formData, cpf: maskCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
            </div>

            {/* Email + Data de Nascimento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>
            </div>

            {/* Gênero */}
            <div className="space-y-1.5">
              <Label>Gênero</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.genero}
                onChange={e => setFormData({ ...formData, genero: e.target.value })}
              >
                <option value="">Não informado</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Endereço - busca por CEP */}
            <div className="border-t pt-3 mt-3 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Endereço</p>
              
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <div className="relative">
                  <Input
                    value={formData.cep}
                    onChange={e => setFormData({ ...formData, cep: maskCep(e.target.value) })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    inputMode="numeric"
                    className="pr-9"
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-slate-400">Digite o CEP para preencher o endereço automaticamente</p>
              </div>

              <div className="space-y-1.5">
                <Label>Logradouro / Complemento / Bairro</Label>
                <Input
                  value={formData.endereco}
                  onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between gap-2 border-t">
              <div>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Paciente
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmit()}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
