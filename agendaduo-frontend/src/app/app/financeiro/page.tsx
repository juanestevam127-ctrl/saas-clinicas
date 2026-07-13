'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, CreditCard, Download, ArrowUpRight, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

type Lancamento = {
  id: string;
  paciente: string;
  profissional: string;
  profissionalId: string;
  servico: string;
  valor: number;
  status: 'pago' | 'pendente' | 'cancelado';
  forma: string;
  data: string;
  dataRaw: string;
};

const statusConfig = {
  pago: { label: 'Pago', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  cancelado: { label: 'Cancelado', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function FinanceiroPage() {
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Perfis
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const [filterProfId, setFilterProfId] = useState<string>('todos');

  useEffect(() => {
    fetchLancamentos();

    const handleProfileChange = () => {
      const role = (localStorage.getItem('agendaduo_user_role') as any) || 'admin';
      const profId = localStorage.getItem('agendaduo_user_profissional_id') || '';
      setUserRole(role);
      setSelectedProfissionalId(profId);
      setFilterProfId(role === 'profissional' ? profId : 'todos');
    };

    handleProfileChange();
    window.addEventListener('auth-profile-changed', handleProfileChange);
    return () => window.removeEventListener('auth-profile-changed', handleProfileChange);
  }, []);

  const fetchLancamentos = async () => {
    try {
      const [consRes, profRes] = await Promise.all([
        api.get('/consultas'),
        api.get('/profissionais')
      ]);
      setProfissionais(profRes.data ?? []);

      const mapped: Lancamento[] = (consRes.data ?? []).map((c: any) => {
        const valor = Number(c.valorCobrado || c.servico?.valorPadrao || 0);
        
        let status: 'pago' | 'pendente' | 'cancelado' = 'pendente';
        if (c.status === 'realizado') status = 'pago';
        else if (c.status === 'cancelado') status = 'cancelado';

        const dataObj = new Date(c.dataHoraInicio);
        const dataStr = dataObj.toLocaleDateString('pt-BR');
        const dataRaw = c.dataHoraInicio.split('T')[0];

        return {
          id: c.id,
          paciente: c.paciente?.nome || 'Paciente não identificado',
          profissional: c.profissional?.nome || '—',
          profissionalId: c.profissional?.id || '',
          servico: c.servico?.nome || 'Consulta',
          valor,
          status,
          forma: c.formaPagamento || 'PIX',
          data: dataStr,
          dataRaw,
        };
      });

      setLancamentos(mapped);
    } catch {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };
  const handleFormaChange = async (consultaId: string, novaForma: string) => {
    try {
      await api.patch(`/consultas/${consultaId}`, { formaPagamento: novaForma });
      setLancamentos(prev => prev.map(l => l.id === consultaId ? { ...l, forma: novaForma } : l));
      toast.success('Forma de pagamento atualizada!');
    } catch {
      toast.error('Erro ao atualizar forma de pagamento');
    }
  };

  const [filterForma, setFilterForma] = useState<string>('todos');
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);

  // Determina o profissional alvo de filtragem baseado na role
  const targetProfId = userRole === 'profissional' ? selectedProfissionalId : filterProfId;

  // Filtra lançamentos com base no status, nas datas e no profissional selecionado
  const filtered = lancamentos.filter(l => {
    const matchStatus = filterStatus === 'todos' || l.status === filterStatus;
    const matchForma = filterForma === 'todos' || l.forma === filterForma;
    const matchStart = !startDate || l.dataRaw >= startDate;
    const matchEnd = !endDate || l.dataRaw <= endDate;
    const matchProf = targetProfId === 'todos' || l.profissionalId === targetProfId;
    return matchStatus && matchForma && matchStart && matchEnd && matchProf;
  });

  // Recalcula resumos dinamicamente com base nos filtros selecionados!
  const totalPago = filtered.filter(l => l.status === 'pago').reduce((a, l) => a + l.valor, 0);
  const totalPendente = filtered.filter(l => l.status === 'pendente').reduce((a, l) => a + l.valor, 0);
  const totalMes = filtered.filter(l => l.status !== 'cancelado').reduce((a, l) => a + l.valor, 0);
  const totalAtendimentos = filtered.filter(l => l.status === 'pago').length;
  const ticketMedio = totalAtendimentos > 0 ? totalPago / totalAtendimentos : 0;

  const handleUpdateFinanceiro = async () => {
    if (!editingLancamento) return;
    try {
      let statusToSave = 'agendado';
      if (editingLancamento.status === 'pago') statusToSave = 'realizado';
      if (editingLancamento.status === 'cancelado') statusToSave = 'cancelado';

      await api.patch(`/consultas/${editingLancamento.id}`, { 
        formaPagamento: editingLancamento.forma,
        status: statusToSave,
        valorCobrado: editingLancamento.valor
      });
      
      setLancamentos(prev => prev.map(l => l.id === editingLancamento.id ? editingLancamento : l));
      setEditingLancamento(null);
      toast.success('Financeiro atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar financeiro');
    }
  };

  // Função para exportar os lançamentos filtrados em CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    
    const headers = ['Data', 'Paciente', 'Serviço', 'Profissional', 'Forma de Pagamento', 'Status', 'Valor (R$)'];
    const rows = filtered.map(l => [
      l.data,
      `"${l.paciente.replace(/"/g, '""')}"`,
      `"${l.servico.replace(/"/g, '""')}"`,
      `"${l.profissional.replace(/"/g, '""')}"`,
      l.forma,
      l.status,
      l.valor.toFixed(2).replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financeiro</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {userRole === 'admin'
              ? 'Controle financeiro e relatórios consolidados da clínica.'
              : 'Seus honorários e comissões da clínica.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Dropdown de filtro para Administrador */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-1.5 shadow-sm mr-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visualizar:</span>
              <select
                value={filterProfId}
                onChange={e => setFilterProfId(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos os Profissionais (Consolidado)</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Date Filters Card */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período de:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Até:</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Forma:</span>
          <select
            value={filterForma}
            onChange={e => setFilterForma(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas as Formas</option>
            <option value="PIX">PIX</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Transferência">Transferência</option>
            <option value="Plano de Saúde">Plano de Saúde</option>
          </select>
        </div>

        {(startDate || endDate || filterForma !== 'todos') && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setFilterForma('todos'); }}
            className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors ml-auto"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" /> Carregando lançamentos...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-blue-200 text-xs font-medium uppercase tracking-wider">Receita Prevista</div>
                <TrendingUp className="w-4 h-4 text-blue-300" />
              </div>
              <div className="text-2xl font-black">{formatCurrency(totalMes)}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-blue-200">
                <ArrowUpRight className="w-3 h-3" />
                Agendados + Realizados
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Recebido</div>
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-800">{formatCurrency(totalPago)}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                {totalAtendimentos} pagamentos realizados
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Pendente</div>
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-800">{formatCurrency(totalPendente)}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                {filtered.filter(l => l.status === 'pendente').length} em aberto
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Ticket Médio</div>
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-800">{formatCurrency(ticketMedio)}</div>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                Por atendimento realizado
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 text-sm">Lançamentos Recentes ({filtered.length})</h2>
              <div className="flex bg-white border shadow-sm rounded-xl p-1 gap-1">
                {[
                  { key: 'todos', label: 'Todos' },
                  { key: 'pago', label: 'Pago' },
                  { key: 'pendente', label: 'Pendente' },
                  { key: 'cancelado', label: 'Cancelado' }
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setFilterStatus(s.key)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filterStatus === s.key ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  Nenhum lançamento encontrado.
                </div>
              ) : (
                filtered.map((l) => {
                  const cfg = statusConfig[l.status] || statusConfig.pendente;
                  return (
                    <div 
                      key={l.id} 
                      onClick={() => setEditingLancamento(l)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${cfg.bg} ${cfg.text}`}>
                          {l.paciente.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{l.paciente}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {l.servico} · {l.profissional}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium text-slate-700">{l.data}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{l.forma}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 min-w-[90px]">
                          <span className={`font-bold text-sm ${l.status === 'pago' ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {formatCurrency(l.valor)}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Editar Lançamento */}
      {editingLancamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Editar Lançamento</h2>
              <button 
                onClick={() => setEditingLancamento(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-semibold text-slate-800">{editingLancamento.paciente}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Serviço:</span>
                  <span className="text-slate-800">{editingLancamento.servico}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Data:</span>
                  <span className="text-slate-800">{editingLancamento.data}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Valor Cobrado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingLancamento.valor}
                  onChange={e => setEditingLancamento({ ...editingLancamento, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Forma de Pagamento</label>
                <select
                  value={editingLancamento.forma}
                  onChange={e => setEditingLancamento({ ...editingLancamento, forma: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Plano de Saúde">Plano de Saúde</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status do Pagamento</label>
                <select
                  value={editingLancamento.status}
                  onChange={e => setEditingLancamento({ ...editingLancamento, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pendente">Pendente (Agendado)</option>
                  <option value="pago">Pago (Realizado)</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setEditingLancamento(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateFinanceiro}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
