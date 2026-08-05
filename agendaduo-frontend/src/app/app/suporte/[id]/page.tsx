'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { LifeBuoy, Send, Image as ImageIcon, Loader2, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [ticket, setTicket] = useState<any>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [imagemFila, setImagemFila] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMaster = typeof window !== 'undefined' && localStorage.getItem('agendaduo_is_master') === 'true';

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  useEffect(() => {
    // Scroll para o fim do chat
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens]);

  const fetchTicketData = async () => {
    try {
      const { data } = await api.get(`/suporte/${id}`);
      setTicket(data.ticket);
      setMensagens(data.mensagens);
    } catch (err: any) {
      toast.error('Erro ao carregar detalhes do chamado.');
      router.push(isMaster ? '/app/master-clinicas' : '/app/suporte');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem não pode ter mais de 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas arquivos de imagem são permitidos.');
      return;
    }

    setImagemFila(file);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const db = getSupabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${ticket.clinica_id}/${id}/${fileName}`;

      const { error: uploadError, data } = await db.storage
        .from('imagens-suporte-marcai')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = db.storage
        .from('imagens-suporte-marcai')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao fazer upload da imagem.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() && !imagemFila) return;

    setEnviando(true);
    try {
      let anexoUrl = null;
      if (imagemFila) {
        anexoUrl = await uploadImage(imagemFila);
        if (!anexoUrl) {
          setEnviando(false);
          return; // Falha no upload interrompe o envio
        }
      }

      const remetenteNome = isMaster 
        ? 'Suporte MarcAI' 
        : (localStorage.getItem('agendaduo_user_name') || 'Usuário');
      const remetenteId = isMaster ? 'master' : (localStorage.getItem('agendaduo_user_profissional_id') || 'desconhecido');

      await api.post(`/suporte/${id}`, {
        mensagem: novaMensagem,
        anexoUrl,
        remetenteTipo: isMaster ? 'master' : 'cliente',
        remetenteNome,
        remetenteId
      });

      setNovaMensagem('');
      setImagemFila(null);
      await fetchTicketData();
    } catch (err: any) {
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!confirm('Tem certeza que deseja marcar este chamado como resolvido?')) return;
    try {
      await api.post(`/suporte/${id}`, { novoStatus: 'resolvido' });
      toast.success('Chamado resolvido!');
      await fetchTicketData();
    } catch (err: any) {
      toast.error('Erro ao atualizar status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Link 
            href={isMaster ? '/app/master-clinicas' : '/app/suporte'}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{ticket.assunto}</h1>
            <p className="text-xs text-slate-500">
              {isMaster && <span className="font-semibold text-blue-600 mr-2">{ticket.clinica?.nome}</span>}
              Aberto em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
            ticket.status === 'aberto' ? 'bg-amber-100 text-amber-700' :
            ticket.status === 'respondido' ? 'bg-blue-100 text-blue-700' :
            'bg-emerald-100 text-emerald-700'
          }`}>
            {ticket.status}
          </div>
          {ticket.status !== 'resolvido' && (
            <button
              onClick={handleCloseTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatRef}
        className="flex-1 bg-slate-50 border rounded-2xl p-4 overflow-y-auto space-y-6 shadow-inner"
      >
        {mensagens.map((msg, i) => {
          const isMine = isMaster ? msg.remetente_tipo === 'master' : msg.remetente_tipo === 'cliente';
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-500">{msg.remetente_nome}</span>
                <span className="text-[9px] text-slate-400">{format(new Date(msg.created_at), "HH:mm")}</span>
              </div>
              <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                isMine 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white border text-slate-700 rounded-tl-sm'
              }`}>
                {msg.mensagem && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.mensagem}</p>
                )}
                {msg.anexo_url && (
                  <div className={`mt-2 ${msg.mensagem ? 'pt-2 border-t border-white/20' : ''}`}>
                    <a href={msg.anexo_url} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={msg.anexo_url} 
                        alt="Anexo" 
                        className="max-w-full max-h-[300px] rounded-xl object-contain bg-slate-100/10 cursor-pointer hover:opacity-90 transition-opacity" 
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      {ticket.status !== 'resolvido' ? (
        <form 
          onSubmit={handleSendMessage}
          className="shrink-0 bg-white border rounded-2xl p-3 shadow-sm"
        >
          {imagemFila && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-blue-800 truncate">{imagemFila.name}</span>
                <span className="text-[10px] text-blue-500">({(imagemFila.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button
                type="button"
                onClick={() => setImagemFila(null)}
                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
              title="Anexar Imagem (Até 2MB)"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <textarea
              value={novaMensagem}
              onChange={e => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
              rows={1}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            <button
              type="submit"
              disabled={enviando || (!novaMensagem.trim() && !imagemFila) || uploadingImage}
              className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {enviando || uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="px-14 pt-1 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Pressione Enter para enviar</span>
            {uploadingImage && <span className="text-[10px] text-blue-500 font-medium animate-pulse">Fazendo upload da imagem...</span>}
          </div>
        </form>
      ) : (
        <div className="shrink-0 bg-slate-50 border rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-slate-500">Este chamado foi resolvido e encerrado.</p>
        </div>
      )}
    </div>
  );
}
