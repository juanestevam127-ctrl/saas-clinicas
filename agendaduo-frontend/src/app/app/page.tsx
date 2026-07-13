'use client';

import { useState, useEffect } from 'react';
import { QrCode, Smartphone, Wifi, WifiOff, Loader2, Calendar, Users, DollarSign, Ban } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

type Consulta = {
  id: string;
  pacienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  servicoNome: string;
  dataHoraInicio: string;
  status: string;
  valorCobrado: number | null;
  servicoValor: number;
};

const LS_KEY = 'whatsapp_instances_v1';

export default function DashboardPage() {
  const router = useRouter();
  const [rawPacientes, setRawPacientes] = useState<any[]>([]);
  const [rawConsultas, setRawConsultas] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<'open' | 'close' | 'checking'>('checking');
  const [loading, setLoading] = useState(true);

  // Filtros de Data
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Perfis
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const [filterProfId, setFilterProfId] = useState<string>('todos');

  useEffect(() => {
    fetchDashboardData();

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

  const fetchDashboardData = async () => {
    try {
      const [pacRes, consRes, profRes] = await Promise.all([
        api.get('/pacientes'),
        api.get('/consultas'),
        api.get('/profissionais'),
      ]);
      setRawPacientes(pacRes.data ?? []);
      setRawConsultas(consRes.data ?? []);
      setProfissionais(profRes.data ?? []);

      // Whatsapp Status - filtra apenas a instância do profissional logado
      const currentRole = localStorage.getItem('agendaduo_user_role') || 'admin';
      const currentProfId = localStorage.getItem('agendaduo_user_profissional_id') || '';
      let savedNames: string[] = [];
      try {
        savedNames = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      } catch { /* ignora */ }

      // Se for profissional, filtra só as instâncias vinculadas a ele
      if (currentRole === 'profissional' && currentProfId) {
        const profMap: Record<string, { profId: string }> = {};
        try { Object.assign(profMap, JSON.parse(localStorage.getItem('whatsapp_prof_map_v1') || '{}')); } catch {}
        savedNames = savedNames.filter(name => profMap[name]?.profId === currentProfId);
      }

      if (savedNames.length === 0) {
        setWhatsappStatus('close');
      } else {
        try {
          const { data } = await api.get(`/whatsapp/status/${savedNames[0]}`);
          setWhatsappStatus(data.state === 'open' || data.connectionStatus === 'open' ? 'open' : 'close');
        } catch {
          setWhatsappStatus('close');
        }
      }
    } catch {
      // Fallbacks silenciosos
    } finally {
      setLoading(false);
    }
  };

  // Filtragem dinâmica com base no seletor de profissionais
  const targetProfId = userRole === 'profissional' ? selectedProfissionalId : filterProfId;

  const filteredConsultas = targetProfId === 'todos'
    ? rawConsultas
    : rawConsultas.filter(c => c.profissional?.id === targetProfId);

  // Métricas calculadas dinamicamente
  const hojeStr = new Date().toLocaleDateString('pt-BR');
  const mesAtual = new Date().getMonth();
  const anoAtual = new Date().getFullYear();

  let consultasCount = 0;
  let canceladosCount = 0;
  let receitaTotal = 0;
  const proximas: any[] = [];

  filteredConsultas.forEach((c: any) => {
    const dataObj = new Date(c.dataHoraInicio);
    const dataStr = dataObj.toLocaleDateString('pt-BR');
    const dataRaw = c.dataHoraInicio.split('T')[0];

    // Verifica intervalo de data se filtros estiverem ativos
    const matchStart = !startDate || dataRaw >= startDate;
    const matchEnd = !endDate || dataRaw <= endDate;
    const matchesDateRange = matchStart && matchEnd;

    if (startDate || endDate) {
      // Cálculo baseado no período selecionado
      if (matchesDateRange) {
        if (c.status !== 'cancelado') {
          consultasCount++;
          receitaTotal += Number(c.valorCobrado || c.servico?.valorPadrao || 0);
        } else {
          canceladosCount++;
        }
      }
    } else {
      // Cálculo padrão (Hoje e Mês Atual)
      if (dataStr === hojeStr && c.status !== 'cancelado') {
        consultasCount++;
      }
      if (c.status === 'cancelado') {
        canceladosCount++;
      }
      if (dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual && c.status !== 'cancelado') {
        receitaTotal += Number(c.valorCobrado || c.servico?.valorPadrao || 0);
      }
    }

    // Próximas consultas (Hoje e Futuras) que cabem no filtro de data
    if (dataObj >= new Date() && c.status !== 'cancelado' && matchesDateRange) {
      proximas.push({
        id: c.id,
        pacienteNome: c.paciente?.nome || 'Paciente',
        profissionalNome: c.profissional?.nome || '—',
        servicoNome: c.servico?.nome || 'Consulta',
        dataHoraInicio: c.dataHoraInicio,
        status: c.status,
      });
    }
  });

  proximas.sort((a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime());
  const proximasFiltradas = proximas.slice(0, 5);

  // Pacientes ativos vinculados ao escopo selecionado
  const totalPacientes = targetProfId === 'todos'
    ? rawPacientes.filter(p => p.ativo).length
    : rawPacientes.filter(p => {
        if (!p.ativo) return false;
        return rawConsultas.some(c => c.paciente?.id === p.id && c.profissional?.id === targetProfId);
      }).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isFiltered = !!(startDate || endDate);

  const dashboardCards = [
    { 
      title: isFiltered ? 'Consultas no Período' : 'Consultas Hoje', 
      value: String(consultasCount), 
      icon: Calendar, 
      color: 'text-blue-600 bg-blue-50' 
    },
    { 
      title: 'Pacientes Ativos', 
      value: String(totalPacientes), 
      icon: Users, 
      color: 'text-emerald-600 bg-emerald-50' 
    },
    { 
      title: isFiltered ? 'Receita no Período' : 'Receita do Mês', 
      value: formatCurrency(receitaTotal), 
      icon: DollarSign, 
      color: 'text-indigo-600 bg-indigo-50' 
    },
    { 
      title: isFiltered ? 'Cancelamentos no Período' : 'Cancelamentos', 
      value: String(canceladosCount), 
      icon: Ban, 
      color: 'text-rose-600 bg-rose-50' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Visão geral do sistema e indicadores em tempo real.</p>
        </div>
        
        {/* Dropdown de filtro para Administrador */}
        {userRole === 'admin' && (
          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtrar por:</span>
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
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs text-red-500 font-semibold hover:text-red-700 transition-colors"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" /> Carregando visão geral...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</h3>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Proximas Consultas */}
            <div className="md:col-span-2 bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4">
                {isFiltered ? 'Agendamentos no Período' : 'Próximos Agendamentos'}
              </h3>
              <div className="space-y-4">
                {proximasFiltradas.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-4">Nenhum agendamento futuro encontrado.</p>
                ) : (
                  proximasFiltradas.map((c) => {
                    const data = new Date(c.dataHoraInicio);
                    const hora = `${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50/50 transition-colors">
                        <div>
                          <h4 className="font-semibold text-slate-800 text-xs">{c.pacienteNome}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{c.servicoNome} · {c.profissionalNome}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">{data.toLocaleDateString('pt-BR')}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{hora}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Canal do WhatsApp status card */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">Status de Conectividade</h3>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Verifique se o seu celular principal de WhatsApp está conectado à API de lembretes.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  {whatsappStatus === 'checking' ? (
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  ) : whatsappStatus === 'open' ? (
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Wifi className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
                      <WifiOff className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs">WhatsApp Lembretes</h4>
                    <p className={`text-[10px] font-semibold mt-0.5 ${whatsappStatus === 'open' ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {whatsappStatus === 'checking' ? 'Verificando...' : whatsappStatus === 'open' ? 'Conexão Ativa' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t">
                <button
                  onClick={() => router.push('/app/whatsapp')}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all text-center block cursor-pointer"
                >
                  Ir para Integração
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
