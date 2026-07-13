'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, DollarSign, Activity, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
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

type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number | null;
  valorPadrao: number;
  ativo: boolean;
  _count?: { consultas: number };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Helpers para formatação de moeda em tempo de digitação
function formatInputMoeda(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 'R$ 0,00';
  const num = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

function parseMoedaToNumber(formattedValue: string): number {
  const digits = formattedValue.replace(/\D/g, '');
  return Number(digits) / 100;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    duracaoMinutos: 30,
    valorPadrao: 'R$ 0,00',
    ativo: true,
  });

  useEffect(() => {
    fetchServicos();
  }, []);

  const fetchServicos = async () => {
    try {
      const { data } = await api.get('/servicos');
      setServicos(data);
    } catch (error) {
      toast.error('Erro ao buscar serviços');
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nome: '', descricao: '', duracaoMinutos: 30, valorPadrao: 'R$ 0,00', ativo: true });
    setIsModalOpen(true);
  };

  const openEditModal = (servico: Servico) => {
    setEditingId(servico.id);
    const rawVal = Number(servico.valorPadrao) * 100;
    setFormData({
      nome: servico.nome,
      descricao: servico.descricao || '',
      duracaoMinutos: servico.duracaoMinutos || 30,
      valorPadrao: formatInputMoeda(String(Math.round(rawVal))),
      ativo: servico.ativo,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await api.delete(`/servicos/${id}`);
      toast.success('Serviço excluído com sucesso!');
      fetchServicos();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error('O nome é obrigatório');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        duracaoMinutos: Number(formData.duracaoMinutos),
        valorPadrao: parseMoedaToNumber(formData.valorPadrao),
      };

      if (editingId) {
        await api.patch(`/servicos/${editingId}`, payload);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await api.post('/servicos', payload);
        toast.success('Serviço criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchServicos();
    } catch (error) {
      toast.error('Erro ao salvar serviço');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Serviços</h1>
          <p className="text-slate-500 mt-1 text-sm">{servicos.filter(s => s.ativo).length} serviços ativos</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Serviços', value: servicos.length, icon: Activity, color: 'blue' },
          { label: 'Ativos', value: servicos.filter(s => s.ativo).length, icon: CheckCircle2, color: 'emerald' },
          { label: 'Total Agendamentos', value: servicos.reduce((a, s) => a + (s._count?.consultas || 0), 0), icon: Clock, color: 'indigo' },
          { label: 'Ticket Médio', value: servicos.length ? formatCurrency(servicos.reduce((a, s) => a + s.valorPadrao, 0) / servicos.length) : 'R$ 0,00', icon: DollarSign, color: 'violet' },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              s.color === 'blue' ? 'bg-blue-100' : s.color === 'emerald' ? 'bg-emerald-100' : s.color === 'indigo' ? 'bg-indigo-100' : 'bg-violet-100'
            }`}>
              <s.icon className={`w-4.5 h-4.5 ${
                s.color === 'blue' ? 'text-blue-600' : s.color === 'emerald' ? 'text-emerald-600' : s.color === 'indigo' ? 'text-indigo-600' : 'text-violet-600'
              }`} />
            </div>
            <div className="text-xl font-bold text-slate-800">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">Carregando...</div>
        ) : servicos.length === 0 ? (
          <div className="col-span-full py-16 text-center">
             <div className="text-4xl mb-3">🔍</div>
             <p className="text-slate-500 font-medium">Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          servicos.map((servico) => (
            <div
              key={servico.id}
              onClick={() => openEditModal(servico)}
              className={`bg-white border rounded-2xl shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer ${
                !servico.ativo ? 'opacity-60' : 'hover:border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700`}>
                  Serviço
                </span>
                <div className="flex items-center gap-2">
                  {servico.ativo ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>

              <h3 className="font-bold text-slate-800 mb-1">{servico.nome}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{servico.descricao || 'Sem descrição'}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium">{servico.duracaoMinutos || 0} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium">{servico._count?.consultas || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-slate-800">{formatCurrency(servico.valorPadrao)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome do Serviço *</Label>
              <Input
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Consulta Inicial"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do serviço..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Padrão</Label>
                <Input
                  type="text"
                  value={formData.valorPadrao}
                  onChange={e => setFormData({ ...formData, valorPadrao: formatInputMoeda(e.target.value) })}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duracaoMinutos}
                  onChange={e => setFormData({ ...formData, duracaoMinutos: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <Label htmlFor="ativo">Serviço Ativo</Label>
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
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Serviço
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
