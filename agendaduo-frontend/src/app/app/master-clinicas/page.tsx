'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building, Users, Calendar, Shield, ExternalLink, Search, Loader2, LifeBuoy, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function MasterClinicasPage() {
  const router = useRouter();
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'empresas' | 'suporte'>('empresas');

  useEffect(() => {
    const isMaster = localStorage.getItem('agendaduo_is_master') === 'true';
    if (!isMaster) {
      toast.error('Acesso não autorizado');
      router.push('/app');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resClinicas, resTickets] = await Promise.all([
        api.get('/master/clinicas'),
        api.get('/suporte', { headers: { 'x-is-master': 'true' } }).catch(() => ({ data: [] }))
      ]);
      setClinicas(resClinicas.data || []);
      setTickets(resTickets.data || []);
    } catch {
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };



  const handleImpersonate = (c: any) => {
    // Definir os dados da empresa no localStorage
    localStorage.setItem('agendaduo_clinica_id', c.id);
    localStorage.setItem('agendaduo_user_role', 'admin');
    localStorage.setItem('agendaduo_logged_role', 'admin');
    localStorage.setItem('agendaduo_user_name', c.adminNome || 'Administrador');
    localStorage.setItem('agendaduo_user_profissional_id', c.adminId || '');
    localStorage.setItem('agendaduo_admin_profissional_id', c.adminId || '');
    localStorage.setItem('agendaduo_user_especialidade', c.adminEspecialidade || '-');
    
    // Disparar evento para atualizar o Sidebar/Header
    window.dispatchEvent(new Event('auth-profile-changed'));
    
    toast.success(`Entrando na empresa: ${c.nome}`);
    router.push('/app');
  };

  const filteredClinicas = clinicas.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj && c.cnpj.includes(search)) ||
    c.adminNome.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Aguardando</span>;
      case 'respondido': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><MessageCircle className="w-3 h-3" /> Respondido</span>;
      case 'resolvido': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Resolvido</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Carregando painel de controle master...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Painel Master Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerencie e acesse todas as empresas cadastradas na plataforma.</p>
        </div>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('empresas')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'empresas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Empresas
            </button>
            <button
              onClick={() => setActiveTab('suporte')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'suporte' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Chamados
              {tickets.filter(t => t.status === 'aberto').length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                  {tickets.filter(t => t.status === 'aberto').length}
                </span>
              )}
            </button>
          </div>
        </div>
      {activeTab === 'empresas' ? (
        <>
          {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por empresa, CNPJ ou administrador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Grid de Empresas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClinicas.map((c) => (
          <div key={c.id} className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                  <Building className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleImpersonate(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Entrar
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{c.nome}</h3>
                <p className="text-xs text-slate-400 mt-0.5">CNPJ: {c.cnpj || '—'}</p>
              </div>

              <div className="border-t pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Administrador:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]" title={c.adminNome}>{c.adminNome}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">E-mail:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]" title={c.adminEmail}>{c.adminEmail}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Profissionais:</span>
                  <span className="font-bold text-slate-800">{c.totalProfessionals}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClinicas.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-slate-400 text-sm">
          Nenhuma empresa encontrada.
        </div>
      )}
      </>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {tickets.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <LifeBuoy className="w-8 h-8 text-slate-300 mb-4" />
              <p className="text-sm">Nenhum chamado de suporte aberto.</p>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map(ticket => (
                <Link 
                  key={ticket.id} 
                  href={`/app/suporte/${ticket.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 truncate max-w-md">{ticket.assunto}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-blue-600">{ticket.clinica?.nome || 'Empresa desconhecida'}</span>
                      <span>•</span>
                      <span>Aberto em {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-xs font-semibold text-slate-400">
                      {ticket.mensagens?.[0]?.count || ticket.mensagens?.length || 0} msgs
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
