'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Stethoscope, Phone, Loader2, Trash2 } from 'lucide-react';
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

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h às 19h

type Consulta = {
  id: string;
  paciente: { id: string; nome: string };
  profissional: { id: string; nome: string };
  servico: { id: string; nome: string };
  dataHoraInicio: string;
  dataHoraFim: string;
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado';
  googleEventId?: string;
  linkReuniao?: string;
  tipoAtendimento?: 'presencial' | 'online';
};

const statusConfig: Record<string, any> = {
  agendado: { label: 'Agendado', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  confirmado: { label: 'Confirmado', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  realizado: { label: 'Atendida', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
};

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay();
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

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

export default function AgendaPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'semana' | 'dia'>('semana');
  const weekDates = getWeekDates(currentDate);

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);

  // Perfil de acesso/visualização
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');

  const fetchGoogleEvents = async (profId?: string) => {
    const activeProfId = profId || selectedProfissionalId || localStorage.getItem('agendaduo_user_profissional_id') || '';
    if (!activeProfId) {
      setGoogleEvents([]);
      return;
    }
    try {
      const startStr = weekDates[0].toISOString();
      const endStr = weekDates[6].toISOString();
      const { data } = await api.get(`/auth/google/events?profissionalId=${activeProfId}&start=${startStr}&end=${endStr}`);
      if (Array.isArray(data)) {
        setGoogleEvents(data);
      } else {
        setGoogleEvents([]);
      }
    } catch (err) {
      console.error('Erro ao buscar eventos do Google:', err);
      setGoogleEvents([]);
    }
  };
  const [currentProfData, setCurrentProfData] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [editingLink, setEditingLink] = useState('');

  // Form State
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [isNewPaciente, setIsNewPaciente] = useState(false);
  
  // New patient state
  const [newPacienteTelefone, setNewPacienteTelefone] = useState('');
  const [newPacienteCpf, setNewPacienteCpf] = useState('');
  const [newPacienteDataNascimento, setNewPacienteDataNascimento] = useState('');
  const [newPacienteCep, setNewPacienteCep] = useState('');
  const [newPacienteEndereco, setNewPacienteEndereco] = useState('');
  const [newPacienteCidade, setNewPacienteCidade] = useState('');
  const [newPacienteEstado, setNewPacienteEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  const [formData, setFormData] = useState({
    profissionalId: '',
    servicoId: '',
    data: new Date().toISOString().split('T')[0],
    hora: '09:00',
    duracao: 30,
    observacoes: '',
    tipoAtendimento: 'presencial',
    linkReuniao: '',
  });

  useEffect(() => {
    fetchData();

    const urlParams = new URLSearchParams(window.location.search);
    const googleStatus = urlParams.get('google_status');
    if (googleStatus === 'success') {
      toast.success('Google Agenda vinculada com sucesso!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleStatus === 'error' || googleStatus === 'server_error') {
      toast.error('Erro ao vincular Google Agenda.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleProfileChange = () => {
      const role = (localStorage.getItem('agendaduo_user_role') as any) || 'admin';
      const profId = localStorage.getItem('agendaduo_user_profissional_id') || '';
      setUserRole(role);
      setSelectedProfissionalId(profId);

      if (role === 'profissional') {
        setFormData(prev => ({ ...prev, profissionalId: profId }));
      }

      if (profId) {
        api.get(`/profissionais/${profId}`)
          .then(res => setCurrentProfData(res.data))
          .catch(console.error);
      } else {
        setCurrentProfData(null);
      }
    };

    handleProfileChange();
    window.addEventListener('auth-profile-changed', handleProfileChange);
    return () => window.removeEventListener('auth-profile-changed', handleProfileChange);
  }, []);

  const handleGoogleConnect = async () => {
    const profId = localStorage.getItem('agendaduo_user_profissional_id');
    if (!profId) return toast.error('Nenhum profissional selecionado');

    setGoogleLoading(true);
    try {
      const { data } = await api.get(`/auth/google/url?profissionalId=${profId}`);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      toast.error('Erro ao conectar ao Google Agenda');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    const profId = localStorage.getItem('agendaduo_user_profissional_id');
    if (!profId) return toast.error('Nenhum profissional selecionado');

    if (!confirm('Tem certeza que deseja desconectar seu Google Agenda?')) return;

    setGoogleLoading(true);
    try {
      await api.post(`/auth/google/disconnect?profissionalId=${profId}`);
      toast.success('Google Agenda desconectada com sucesso!');
      if (currentProfData) {
        setCurrentProfData({
          ...currentProfData,
          googleAccessToken: null,
          googleCalendarId: null,
        });
      }
    } catch (e) {
      toast.error('Erro ao desconectar Google Agenda');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleEvents();
  }, [selectedProfissionalId, currentDate, view]);

  const fetchData = async () => {
    try {
      const [consRes, profRes, servRes, pacRes] = await Promise.all([
        api.get('/consultas'),
        api.get('/profissionais'),
        api.get('/servicos'),
        api.get('/pacientes'),
      ]);
      setConsultas(consRes.data);
      setProfissionais(profRes.data);
      setServicos(servRes.data);
      setPacientes(pacRes.data);
      fetchGoogleEvents();

      // Tratar redirecionamento vindo do Prontuário
      const urlParams = new URLSearchParams(window.location.search);
      const paramData = urlParams.get('data');
      const paramConsultaId = urlParams.get('consultaId');
      if (paramData) {
        setCurrentDate(new Date(paramData + 'T12:00:00'));
      }
      if (paramConsultaId) {
        const found = consRes.data.find((c: any) => c.id === paramConsultaId);
        if (found) {
          setSelectedConsulta(found);
          setIsDetailsOpen(true);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      toast.error('Erro ao buscar dados da agenda');
    }
  };

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (view === 'dia' ? 1 : 7));
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'dia' ? 1 : 7));
    setCurrentDate(d);
  };

  const todayStr = new Date().toDateString();
  const currentDateStr = currentDate.toDateString();

  const handlePacienteSearch = (val: string) => {
    setPacienteSearch(val);
    
    // Check if what they typed exactly matches the currently selected patient's name
    const current = pacientes.find(p => p.id === selectedPacienteId);
    if (current && val === current.nome) {
      return; // Keeps it selected, hides dropdown
    }
    
    setSelectedPacienteId('');
    setIsNewPaciente(true);
  };

  const handleCepBlur = async () => {
    const cepDigits = newPacienteCep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      setNewPacienteEndereco(`${data.logradouro}${data.complemento ? ', ' + data.complemento : ''} - ${data.bairro}`);
      setNewPacienteCidade(data.localidade);
      setNewPacienteEstado(data.uf);
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSearch) return toast.error('Informe o paciente');
    if (!formData.profissionalId) return toast.error('Informe o profissional');
    if (!formData.servicoId) return toast.error('Informe o serviço');

    try {
      let finalPacienteId = selectedPacienteId;

      // Inline patient creation
      if (isNewPaciente && !selectedPacienteId) {
        let obs = '';
        if (newPacienteEndereco) {
          obs = `Endereço: ${newPacienteEndereco}`;
          if (newPacienteCidade) obs += ` - ${newPacienteCidade}`;
          if (newPacienteEstado) obs += `/${newPacienteEstado}`;
          if (newPacienteCep) obs += ` CEP ${newPacienteCep}`;
        }

        const { data: newPaciente } = await api.post('/pacientes', {
          nome: pacienteSearch,
          telefone: newPacienteTelefone || null,
          cpf: newPacienteCpf || null,
          dataNascimento: newPacienteDataNascimento ? new Date(newPacienteDataNascimento).toISOString() : null,
          observacoes: obs || null,
        });
        finalPacienteId = newPaciente.id;
      }

      // Prepare date/time
      const inicio = new Date(`${formData.data}T${formData.hora}:00`);
      const fim = new Date(inicio.getTime() + formData.duracao * 60000);

      await api.post('/consultas', {
        pacienteId: finalPacienteId,
        profissionalId: formData.profissionalId,
        servicoId: formData.servicoId,
        dataHoraInicio: inicio.toISOString(),
        dataHoraFim: fim.toISOString(),
        status: 'agendado',
        tipoAtendimento: formData.tipoAtendimento,
        linkReuniao: formData.tipoAtendimento === 'online' ? formData.linkReuniao : null,
        observacoes: formData.observacoes,
      });

      toast.success('Agendamento criado com sucesso!');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/consultas/${id}`, { status });
      toast.success('Status atualizado');
      setIsDetailsOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteConsulta = async (id: string) => {
    if (!confirm('Deseja realmente deletar permanentemente este agendamento do banco?')) return;
    try {
      await api.delete(`/consultas/${id}`);
      toast.success('Agendamento excluído com sucesso!');
      setIsDetailsOpen(false);
      fetchData();
    } catch {
      toast.error('Erro ao excluir consulta');
    }
  };

  useEffect(() => {
    if (selectedConsulta) {
      setEditingLink(selectedConsulta.linkReuniao || '');
    }
  }, [selectedConsulta]);

  const handleUpdateLink = async () => {
    if (!selectedConsulta) return;
    try {
      await api.patch(`/consultas/${selectedConsulta.id}`, { linkReuniao: editingLink });
      toast.success('Link da reunião atualizado com sucesso!');
      setSelectedConsulta(prev => prev ? { ...prev, linkReuniao: editingLink } : null);
      fetchData();
    } catch {
      toast.error('Erro ao atualizar o link da reunião');
    }
  };

  // Filtragem de escopo de consultas com base no perfil logado
  const viewableConsultas = userRole === 'admin'
    ? consultas
    : consultas.filter(c => c.profissional?.id === selectedProfissionalId);

  const consultasHoje = viewableConsultas.filter(c => {
    const today = new Date().toDateString();
    return new Date(c.dataHoraInicio).toDateString() === today;
  }).sort((a, b) => new Date(a.dataHoraInicio).getTime() - new Date(b.dataHoraInicio).getTime());

  const handleOpenNewModal = () => {
    const role = (localStorage.getItem('agendaduo_user_role') as any) || 'admin';
    const profId = localStorage.getItem('agendaduo_user_profissional_id') || '';

    setFormData({
      profissionalId: role === 'profissional' ? profId : '',
      servicoId: '',
      data: new Date().toISOString().split('T')[0],
      hora: '09:00',
      duracao: 30,
      observacoes: '',
      tipoAtendimento: 'presencial',
      linkReuniao: '',
    });
    setPacienteSearch('');
    setSelectedPacienteId('');
    setNewPacienteTelefone('');
    setNewPacienteCpf('');
    setNewPacienteDataNascimento('');
    setNewPacienteCep('');
    setNewPacienteEndereco('');
    setNewPacienteCidade('');
    setNewPacienteEstado('');
    setIsNewPaciente(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {userRole === 'admin' 
              ? 'Visualizando agendamentos de todos os profissionais'
              : 'Visualizando apenas os seus agendamentos'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentProfData && (
            currentProfData.googleAccessToken ? (
              <button
                onClick={handleGoogleDisconnect}
                disabled={googleLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                title="Google Agenda Conectada. Clique para desconectar."
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Google Agenda Ativa
              </button>
            ) : (
              <button
                onClick={handleGoogleConnect}
                disabled={googleLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Vincular Google Agenda
              </button>
            )
          )}
          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b bg-slate-50/50 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-slate-800">
              {weekDates[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Hoje
            </button>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {(['semana', 'dia'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'semana' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Wrapper */}
        <div className="overflow-x-auto">
          <div className={`${view === 'semana' ? 'min-w-[800px]' : 'min-w-0'} w-full`}>
            
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b bg-slate-50/30">
              <div className="py-3 px-2 text-xs text-slate-400 font-medium text-center">Hora</div>
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === todayStr;
                const isSelected = date.toDateString() === currentDateStr;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      setCurrentDate(date);
                      setView('dia');
                    }}
                    className={`py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors ${view === 'dia' && !isSelected ? 'hidden' : ''}`}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                      {DAYS[i]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="overflow-y-auto max-h-[500px]">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b last:border-0 hover:bg-slate-50/30 group">
                  <div className="py-3 px-3 text-xs text-slate-400 font-medium text-right sticky left-0 bg-white border-r">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {weekDates.map((date, dayIdx) => {
                    const dayConsultas = viewableConsultas.filter(c => {
                      const d = new Date(c.dataHoraInicio);
                      return d.toDateString() === date.toDateString() && d.getHours() === hour;
                    });
                    const dayGoogleEvents = googleEvents
                      .filter(e => !consultas.some(c => c.googleEventId === e.id))
                      .filter(e => {
                        const d = new Date(e.start);
                        return d.toDateString() === date.toDateString() && d.getHours() === hour;
                      });
                    const isToday = date.toDateString() === todayStr;
                    const isSelected = date.toDateString() === currentDateStr;

                    return (
                      <div key={dayIdx} className={`border-r last:border-0 py-1 px-1 min-h-[52px] relative transition-colors ${view === 'dia' && !isSelected ? 'hidden' : ''}`}>
                        {dayConsultas.map((c) => {
                          const sc = statusConfig[c.status] || statusConfig.agendado;
                          const inicio = new Date(c.dataHoraInicio);
                          const fim = new Date(c.dataHoraFim);
                          const duracao = (fim.getTime() - inicio.getTime()) / 60000;

                          return (
                            <div
                              key={c.id}
                              onClick={() => { setSelectedConsulta(c); setIsDetailsOpen(true); }}
                              className={`${sc.bg} ${sc.border} border rounded-lg px-2 py-1.5 text-xs cursor-pointer hover:shadow-sm transition-all mb-1`}
                            >
                              <div className={`font-semibold ${sc.text} truncate`}>{c.paciente.nome}</div>
                              <div className="text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                {inicio.getHours().toString().padStart(2, '0')}:{inicio.getMinutes().toString().padStart(2, '0')} · {duracao}min
                              </div>
                              {userRole === 'admin' && (
                                <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate border-t border-slate-100/50 pt-0.5">
                                  🩺 {c.profissional.nome}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {dayGoogleEvents.map((e) => {
                          const startT = new Date(e.start);
                          const endT = new Date(e.end);
                          const dur = (endT.getTime() - startT.getTime()) / 60000;
                          return (
                            <div
                              key={e.id}
                              className="bg-slate-100 border-slate-200 border text-slate-600 rounded-lg px-2 py-1.5 text-xs mb-1 select-none hover:shadow-sm"
                              title={e.title}
                            >
                              <div className="font-semibold text-slate-700 truncate flex items-center gap-1">
                                📅 {e.title}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {startT.getHours().toString().padStart(2, '0')}:{startT.getMinutes().toString().padStart(2, '0')} · {dur}min
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Today's Appointments List */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Consultas de Hoje
        </h2>
        <div className="space-y-3">
          {consultasHoje.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma consulta agendada para hoje.</p>
          ) : (
            consultasHoje.map((c) => {
              const sc = statusConfig[c.status] || statusConfig.agendado;
              const inicio = new Date(c.dataHoraInicio);
              const fim = new Date(c.dataHoraFim);
              const duracao = (fim.getTime() - inicio.getTime()) / 60000;
              const hora = `${inicio.getHours().toString().padStart(2, '0')}:${inicio.getMinutes().toString().padStart(2, '0')}`;

              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedConsulta(c); setIsDetailsOpen(true); }}
                  className="flex items-center gap-4 p-4 rounded-xl border hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <div className="text-center w-12 shrink-0">
                    <div className="text-sm font-bold text-slate-800">{hora}</div>
                    <div className="text-xs text-slate-400">{duracao}min</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 text-sm truncate">{c.paciente.nome}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/prontuarios?pacienteId=${c.paciente.id}`);
                        }}
                        className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                      >
                        Prontuário
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500">{c.profissional.nome} · {c.servico.nome}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text} ${sc.border} border shrink-0`}>
                    {sc.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Appointment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            
            {/* Inline Patient Autocomplete logic */}
            <div className="space-y-2 relative">
              <Label>Paciente *</Label>
              <Input
                value={pacienteSearch}
                onChange={e => handlePacienteSearch(e.target.value)}
                placeholder="Nome, CPF, Telefone ou E-mail do paciente"
                required
              />
              {pacienteSearch && !selectedPacienteId && pacientes.filter(p => {
                const term = pacienteSearch.toLowerCase();
                const termClean = term.replace(/\D/g, '');
                return (p.nome && p.nome.toLowerCase().includes(term)) ||
                       (p.cpf && termClean && p.cpf.replace(/\D/g, '').includes(termClean)) ||
                       (p.telefone && termClean && p.telefone.replace(/\D/g, '').includes(termClean)) ||
                       (p.email && p.email.toLowerCase().includes(term));
              }).length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                  {pacientes.filter(p => {
                    const term = pacienteSearch.toLowerCase();
                    const termClean = term.replace(/\D/g, '');
                    return (p.nome && p.nome.toLowerCase().includes(term)) ||
                           (p.cpf && termClean && p.cpf.replace(/\D/g, '').includes(termClean)) ||
                           (p.telefone && termClean && p.telefone.replace(/\D/g, '').includes(termClean)) ||
                           (p.email && p.email.toLowerCase().includes(term));
                  }).map(p => (
                    <div
                      key={p.id}
                      className="px-3 py-2.5 text-sm hover:bg-blue-50 cursor-pointer border-b last:border-0"
                      onClick={() => {
                        setPacienteSearch(p.nome);
                        setSelectedPacienteId(p.id);
                        setIsNewPaciente(false);
                      }}
                    >
                      <div className="font-semibold text-slate-800">{p.nome}</div>
                      <div className="text-xs text-slate-500 flex gap-3 mt-0.5">
                        {p.telefone && <span>{p.telefone}</span>}
                        {p.cpf && <span>CPF: {p.cpf}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isNewPaciente && pacienteSearch.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Cadastrar Paciente Novo</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Telefone</Label>
                    <Input
                      value={newPacienteTelefone}
                      onChange={e => setNewPacienteTelefone(maskTelefone(e.target.value))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CPF</Label>
                    <Input
                      value={newPacienteCpf}
                      onChange={e => setNewPacienteCpf(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={newPacienteDataNascimento}
                      onChange={e => setNewPacienteDataNascimento(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">CEP</Label>
                    <Input
                      value={newPacienteCep}
                      onChange={e => setNewPacienteCep(maskCep(e.target.value))}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Endereço Completo</Label>
                  <Input
                    value={newPacienteEndereco}
                    onChange={e => setNewPacienteEndereco(e.target.value)}
                    placeholder="Rua, número, bairro..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={newPacienteCidade}
                      onChange={e => setNewPacienteCidade(e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Estado</Label>
                    <Input
                      value={newPacienteEstado}
                      onChange={e => setNewPacienteEstado(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <select
                  disabled={userRole === 'profissional'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.profissionalId}
                  onChange={e => setFormData({ ...formData, profissionalId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {profissionais.filter(p => p.ativo).map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Serviço *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.servicoId}
                  onChange={e => setFormData({ ...formData, servicoId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {servicos.filter(s => s.ativo).map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Tipo de Atendimento *</Label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoAtendimento"
                      value="presencial"
                      checked={formData.tipoAtendimento === 'presencial'}
                      onChange={e => setFormData({ ...formData, tipoAtendimento: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Presencial</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoAtendimento"
                      value="online"
                      checked={formData.tipoAtendimento === 'online'}
                      onChange={e => setFormData({ ...formData, tipoAtendimento: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Online</span>
                  </label>
                </div>
              </div>
              {formData.tipoAtendimento === 'online' && (
                <div className="space-y-2 col-span-1 sm:col-span-2 animate-in fade-in slide-in-from-top-1">
                  <Label>Link da Reunião (Meet, Zoom, Teams, etc.)</Label>
                  <Input
                    type="url"
                    value={formData.linkReuniao}
                    onChange={e => setFormData({ ...formData, linkReuniao: e.target.value })}
                    placeholder="Ex: https://meet.google.com/abc-defg-hij"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora (HH:mm)</Label>
                <Input
                  type="time"
                  value={formData.hora}
                  onChange={e => setFormData({ ...formData, hora: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  min="5"
                  value={formData.duracao}
                  onChange={e => setFormData({ ...formData, duracao: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Agendar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {selectedConsulta && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{selectedConsulta.paciente.nome}</span>
                  <button
                    onClick={() => router.push(`/app/prontuarios?pacienteId=${selectedConsulta.paciente.id}`)}
                    className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    Ver Prontuário ↗
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{selectedConsulta.profissional.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {new Date(selectedConsulta.dataHoraInicio).toLocaleString('pt-BR')} - 
                    {selectedConsulta.servico.nome}
                  </span>
                </div>
              </div>

              {/* Link da Reunião Online */}
              {selectedConsulta.tipoAtendimento === 'online' && (
                <div className="space-y-2 border-t pt-3">
                  <Label>Link da Consulta Online</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={editingLink}
                      onChange={e => setEditingLink(e.target.value)}
                      placeholder="Ex: https://meet.google.com/abc-defg-hij"
                      className="flex-1"
                    />
                    <button
                      onClick={handleUpdateLink}
                      className="px-3 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors shrink-0"
                    >
                      Salvar Link
                    </button>
                  </div>
                  {selectedConsulta.linkReuniao && (
                    <p className="text-[10px] text-slate-400 truncate">
                      Link cadastrado: <a href={selectedConsulta.linkReuniao} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{selectedConsulta.linkReuniao}</a>
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Atualizar Status</Label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleUpdateStatus(selectedConsulta.id, 'confirmado')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-md hover:bg-emerald-200">Confirmar</button>
                  <button onClick={() => handleUpdateStatus(selectedConsulta.id, 'realizado')} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200">Atendida</button>
                  <button onClick={() => handleUpdateStatus(selectedConsulta.id, 'cancelado')} className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200">Cancelar</button>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  onClick={() => handleDeleteConsulta(selectedConsulta.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Consulta
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
