'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LifeBuoy, Plus, MessageCircle, AlertCircle, Clock, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function SuportePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [isCriando, setIsCriando] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/suporte');
      setTickets(data);
    } catch (err: any) {
      toast.error('Erro ao carregar tickets de suporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAssunto || !novaMensagem) return toast.error('Preencha os campos obrigatórios');
    
    setSubmitting(true);
    try {
      const remetenteNome = localStorage.getItem('agendaduo_user_name') || 'Usuário';
      const profissionalId = localStorage.getItem('agendaduo_user_profissional_id') || '';
      
      const { data } = await api.post('/suporte', {
        assunto: novoAssunto,
        mensagem: novaMensagem,
        remetenteNome
      }, {
        headers: { 'x-profissional-id': profissionalId }
      });
      toast.success('Chamado aberto com sucesso!');
      setIsCriando(false);
      setNovoAssunto('');
      setNovaMensagem('');
      router.push(`/app/suporte/${data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar chamado.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aberto': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Aguardando</span>;
      case 'respondido': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><MessageCircle className="w-3 h-3" /> Respondido</span>;
      case 'resolvido': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Resolvido</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Suporte</h1>
          <p className="text-slate-500 mt-1 text-sm">Precisa de ajuda ou tem alguma sugestão? Abra um chamado.</p>
        </div>
        {!isCriando && (
          <button
            onClick={() => setIsCriando(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Chamado
          </button>
        )}
      </div>

      {isCriando ? (
        <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Abrir novo chamado de suporte</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Assunto / Motivo</label>
              <input
                type="text"
                required
                value={novoAssunto}
                onChange={e => setNovoAssunto(e.target.value)}
                placeholder="Ex: Dúvida sobre agendamentos, Sugestão de melhoria..."
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Mensagem</label>
              <textarea
                required
                rows={4}
                value={novaMensagem}
                onChange={e => setNovaMensagem(e.target.value)}
                placeholder="Descreva detalhadamente o que você precisa..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
              />
              <p className="text-[10px] text-slate-400">Você poderá enviar imagens (prints) na próxima tela.</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsCriando(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir Chamado'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm font-medium">Carregando chamados...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <LifeBuoy className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Nenhum chamado aberto</h3>
              <p className="text-sm max-w-sm">Você ainda não precisou do nosso suporte. Clique no botão acima caso precise de ajuda.</p>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map(ticket => (
                <Link 
                  key={ticket.id} 
                  href={`/app/suporte/${ticket.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800 truncate max-w-[250px] sm:max-w-md">{ticket.assunto}</h3>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <span>Aberto em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                      <span>•</span>
                      <span>{ticket.mensagens?.[0]?.count || ticket.mensagens?.length || 0} mensagens</span>
                    </p>
                  </div>
                  <div className="shrink-0 pl-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
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
