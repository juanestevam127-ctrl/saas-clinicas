'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Award, Trash2, Mail, Copy, CheckCircle } from 'lucide-react';
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

type Profissional = {
  id: string;
  nome: string;
  especialidade: string | null;
  registroProfissional: string | null;
  duracaoPadraoConsulta: number | null;
  ativo: boolean;
  bio: string | null; // Guardará o metadado do convite JSON codificado
  _count?: { agendamentos: number };
};

const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-indigo-400 to-indigo-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const MAX_PROFISSIONAIS = 5;

// Decodificador de metadados da bio
function parseBioMetadata(bioStr: string | null) {
  if (!bioStr) return { isOwner: false, emailInvite: '', inviteStatus: 'pendente' };
  try {
    const parsed = JSON.parse(bioStr);
    if (parsed && typeof parsed === 'object') {
      const isOwner = !!parsed.isOwner || parsed.role === 'admin';
      const inviteStatus = parsed.role === 'admin' ? 'aceito' : (parsed.inviteStatus || 'pendente');
      return {
        isOwner,
        emailInvite: parsed.emailInvite || '',
        inviteStatus,
      };
    }
  } catch {}
  return { isOwner: false, emailInvite: '', inviteStatus: 'pendente' };
}

export default function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    especialidade: '',
    registroProfissional: '',
    duracaoPadraoConsulta: 30,
    ativo: true,
    isOwner: false,
    emailInvite: '',
    inviteStatus: 'pendente' as 'pendente' | 'aceito',
  });

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const fetchProfissionais = async () => {
    try {
      const { data } = await api.get('/profissionais');
      setProfissionais(data);
    } catch (error) {
      toast.error('Erro ao buscar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      especialidade: '',
      registroProfissional: '',
      duracaoPadraoConsulta: 30,
      ativo: true,
      isOwner: false,
      emailInvite: '',
      inviteStatus: 'pendente',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prof: Profissional) => {
    setEditingId(prof.id);
    const meta = parseBioMetadata(prof.bio);
    setFormData({
      nome: prof.nome,
      especialidade: prof.especialidade || '',
      registroProfissional: prof.registroProfissional || '',
      duracaoPadraoConsulta: prof.duracaoPadraoConsulta || 30,
      ativo: prof.ativo,
      isOwner: meta.isOwner,
      emailInvite: meta.emailInvite,
      inviteStatus: meta.inviteStatus,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este profissional? Isso irá remover também o WhatsApp vinculado a ele.')) return;
    try {
      // 1. Remove a instância de WhatsApp vinculada a este profissional (localStorage + Evolution API)
      const LS_KEY = 'whatsapp_instances_v1';
      const LS_PROF_MAP = 'whatsapp_prof_map_v1';
      try {
        const savedNames: string[] = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        const profMap: Record<string, { profId: string; profNome: string }> = JSON.parse(localStorage.getItem(LS_PROF_MAP) || '{}');
        
        const instancesToRemove = savedNames.filter(name => profMap[name]?.profId === id);
        for (const instName of instancesToRemove) {
          try { await api.delete(`/whatsapp/desconectar/${instName}`); } catch { /* ignora */ }
          delete profMap[instName];
        }
        
        const remaining = savedNames.filter(name => !instancesToRemove.includes(name));
        localStorage.setItem(LS_KEY, JSON.stringify(remaining));
        localStorage.setItem(LS_PROF_MAP, JSON.stringify(profMap));
      } catch { /* ignora erro de limpeza */ }

      // 2. Remove o profissional (soft delete)
      await api.delete(`/profissionais/${id}`);
      toast.success('Profissional excluído com sucesso!');
      if (selectedProfissional?.id === id) setSelectedProfissional(null);
      fetchProfissionais();
    } catch (error) {
      toast.error('Erro ao excluir profissional');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error('O nome é obrigatório');
      return;
    }
    if (!editingId && profissionais.length >= MAX_PROFISSIONAIS) {
      toast.error(`Limite de ${MAX_PROFISSIONAIS} profissionais atingido.`);
      return;
    }
    
    try {
      const metadata = {
        isOwner: formData.isOwner,
        emailInvite: formData.isOwner ? '' : formData.emailInvite,
        inviteStatus: formData.isOwner ? 'aceito' : formData.inviteStatus,
      };

      const payload = {
        nome: formData.nome,
        especialidade: formData.especialidade || null,
        registroProfissional: formData.registroProfissional || null,
        duracaoPadraoConsulta: Number(formData.duracaoPadraoConsulta),
        ativo: formData.ativo,
        bio: JSON.stringify(metadata),
      };

      if (editingId) {
        await api.patch(`/profissionais/${editingId}`, payload);
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await api.post('/profissionais', payload);
        toast.success('Profissional criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchProfissionais();
      setSelectedProfissional(null);
    } catch (error) {
      toast.error('Erro ao salvar profissional');
    }
  };

  const copyInviteLink = (profId: string) => {
    const link = `${window.location.origin}/invite-accept?profId=${profId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profissionais</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {profissionais.filter(p => p.ativo).length} profissionais ativos
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              profissionais.length >= MAX_PROFISSIONAIS
                ? 'bg-red-50 text-red-600'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {profissionais.length}/{MAX_PROFISSIONAIS} vagas
            </span>
          </p>
        </div>
        {profissionais.length < MAX_PROFISSIONAIS ? (
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Novo Profissional
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-200">
            Limite de {MAX_PROFISSIONAIS} atingido
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Professionals Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
             <div className="col-span-full py-16 text-center text-slate-500">Carregando...</div>
          ) : profissionais.length === 0 ? (
             <div className="col-span-full py-16 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-slate-500 font-medium">Nenhum profissional cadastrado.</p>
             </div>
          ) : (
            profissionais.map((prof, i) => {
              const meta = parseBioMetadata(prof.bio);
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfissional(prof)}
                  className={`bg-white border rounded-2xl shadow-sm p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    selectedProfissional?.id === prof.id ? 'ring-2 ring-blue-500 border-blue-300' : 'hover:border-blue-200'
                  } ${!prof.ativo ? 'opacity-60' : ''}`}
                >
                  {/* Avatar + Status badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                      {getInitials(prof.nome)}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        prof.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {prof.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {meta.isOwner ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-semibold rounded-full uppercase tracking-wider">
                          👑 Usuário Único
                        </span>
                      ) : meta.inviteStatus === 'pendente' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full uppercase tracking-wider">
                          ✉️ Convite Pendente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded-full uppercase tracking-wider">
                          🟢 Acesso Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">{prof.nome}</h3>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{prof.especialidade || 'Clínico Geral'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{prof.registroProfissional || 'Sem registro'}</p>
                  </div>

                  {/* Invite controls for non-owners with pending status */}
                  {!meta.isOwner && meta.inviteStatus === 'pendente' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyInviteLink(prof.id); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 border rounded-lg text-[10px] font-bold text-slate-600 transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copiar Link de Convite
                      </button>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <Clock className="w-3.5 h-3.5" />
                    Consulta padrão: {prof.duracaoPadraoConsulta || 30} min
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedProfissional ? (
            <div className="bg-white border rounded-2xl shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold`}>
                  {getInitials(selectedProfissional.nome)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{selectedProfissional.nome}</h3>
                  <p className="text-xs text-blue-600">{selectedProfissional.especialidade}</p>
                </div>
              </div>

              {/* Status de Login info */}
              <div className="bg-slate-50 border rounded-xl p-4 mb-6 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acesso ao Sistema</p>
                {(() => {
                  const meta = parseBioMetadata(selectedProfissional.bio);
                  if (meta.isOwner) {
                    return <p className="text-xs text-slate-600">Este profissional é o proprietário e possui acesso completo.</p>;
                  }
                  if (meta.inviteStatus === 'pendente') {
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">
                          Convite enviado para: <strong className="text-slate-700">{meta.emailInvite || 'E-mail não informado'}</strong>
                        </p>
                        <button
                          onClick={() => copyInviteLink(selectedProfissional.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-slate-50 border rounded-lg text-xs font-semibold text-slate-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copiar Link de Convite
                        </button>
                      </div>
                    );
                  }
                  return <p className="text-xs text-green-700">Profissional cadastrou sua senha e está ativo.</p>;
                })()}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => openEditModal(selectedProfissional)}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Editar Profissional
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Award className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">Selecione um profissional</p>
              <p className="text-xs text-slate-400 mt-1">para ver detalhes e opções</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Dr. Carlos Mendes"
                required
              />
            </div>
            
            {/* Owner Checkbox (Este profissional sou eu) */}
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="checkbox"
                id="is-owner"
                checked={formData.isOwner}
                onChange={e => setFormData({ ...formData, isOwner: e.target.checked, emailInvite: e.target.checked ? '' : formData.emailInvite })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="is-owner" className="cursor-pointer font-medium text-slate-700">Este profissional sou eu (Usuário Único da Clínica)</Label>
            </div>

            {/* Email field (only visible and enabled if NOT owner) */}
            {!formData.isOwner && (
              <div className="space-y-1.5 border-l-2 border-blue-100 pl-3">
                <Label>E-mail do Profissional para Convite *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    value={formData.emailInvite}
                    onChange={e => setFormData({ ...formData, emailInvite: e.target.value })}
                    placeholder="medico@exemplo.com"
                    required={!formData.isOwner}
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Um convite será simulado para o e-mail cadastrado criar uma senha.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input
                  value={formData.especialidade}
                  onChange={e => setFormData({ ...formData, especialidade: e.target.value })}
                  placeholder="Ex: Nutricionista"
                />
              </div>
              <div className="space-y-2">
                <Label>Registro (CRM/CRO/...)</Label>
                <Input
                  value={formData.registroProfissional}
                  onChange={e => setFormData({ ...formData, registroProfissional: e.target.value })}
                  placeholder="CRM-SP 12345"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Duração Padrão de Consulta (minutos)</Label>
              <Input
                type="number"
                min="5"
                value={formData.duracaoPadraoConsulta}
                onChange={e => setFormData({ ...formData, duracaoPadraoConsulta: Number(e.target.value) })}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ativo-prof"
                checked={formData.ativo}
                onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <Label htmlFor="ativo-prof">Profissional Ativo</Label>
            </div>

            <div className="pt-4 flex justify-between gap-2 border-t">
              <div>
                {editingId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      setIsModalOpen(false);
                      handleDelete(editingId, e as any);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Profissional
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
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
