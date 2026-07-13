'use client';

import { useState, useEffect } from 'react';
import { QrCode, Smartphone, Wifi, WifiOff, Plus, Trash2, Loader2, UserCheck } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LS_KEY = 'whatsapp_instances_v1';
const LS_PROF_MAP = 'whatsapp_prof_map_v1'; // { instanceName: { profId, profNome } }

type Profissional = { id: string; nome: string; especialidade?: string | null; bio?: string };

type Instancia = {
  name: string;
  connectionStatus: string;
  profissionalId?: string;
  profissionalNome?: string;
};

// LocalStorage helpers
function getSavedNames(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function addSavedName(name: string) {
  const list = getSavedNames();
  if (!list.includes(name)) localStorage.setItem(LS_KEY, JSON.stringify([...list, name]));
}
function removeSavedName(name: string) {
  const list = getSavedNames().filter((n) => n !== name);
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}
function getProfMap(): Record<string, { profId: string; profNome: string }> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_PROF_MAP) || '{}'); } catch { return {}; }
}
function setProfMap(map: Record<string, { profId: string; profNome: string }>) {
  localStorage.setItem(LS_PROF_MAP, JSON.stringify(map));
}

export default function WhatsAppPage() {
  const [instancias, setInstancias] = useState<Instancia[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);

  // Perfil de Visualização/Acesso
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');

  const [isOpen, setIsOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedProfId, setSelectedProfId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ instanceName: string; base64: string } | null>(null);

  useEffect(() => {
    fetchProfissionais();
    fetchInstancias();

    const handleProfileChange = () => {
      setUserRole((localStorage.getItem('agendaduo_user_role') as any) || 'admin');
      setSelectedProfissionalId(localStorage.getItem('agendaduo_user_profissional_id') || '');
    };

    handleProfileChange();
    window.addEventListener('auth-profile-changed', handleProfileChange);
    return () => window.removeEventListener('auth-profile-changed', handleProfileChange);
  }, []);

  // Polling para detectar conexão após QR Code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && qrCodeData) {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get(`/whatsapp/status/${qrCodeData.instanceName}`);
          if (data.state === 'open' || data.connectionStatus === 'open') {
            toast.success('WhatsApp conectado com sucesso!');
            setIsOpen(false);
            setQrCodeData(null);
            fetchInstancias();
          }
        } catch { /* ignora */ }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOpen, qrCodeData]);

  const fetchProfissionais = async () => {
    try {
      const { data } = await api.get('/profissionais');
      setProfissionais(Array.isArray(data) ? data : []);
    } catch {
      setProfissionais([]);
    }
  };

  // Quais profissionais já têm instância vinculada
  const usedProfIds = Object.values(getProfMap()).map((v) => v.profId);
  // Profissionais disponíveis = sem instância vinculada ainda
  const availableProfs = profissionais.filter((p) => !usedProfIds.includes(p.id));

  const fetchInstancias = async () => {
    setLoading(true);
    const names = getSavedNames();
    const profMap = getProfMap();

    if (names.length === 0) { setInstancias([]); setLoading(false); return; }

    const results = await Promise.all(
      names.map(async (name) => {
        let connectionStatus = 'close';
        try {
          const { data } = await api.get(`/whatsapp/status/${name}`);
          connectionStatus = data.state || data.connectionStatus || 'close';
        } catch { /* ignora */ }

        return {
          name,
          connectionStatus,
          profissionalId: profMap[name]?.profId,
          profissionalNome: profMap[name]?.profNome,
        } as Instancia;
      })
    );
    setInstancias(results);
    setLoading(false);
  };

  const handleOpenModal = () => {
    const role = (localStorage.getItem('agendaduo_user_role') as any) || 'admin';
    const profId = localStorage.getItem('agendaduo_user_profissional_id') || '';

    setNewInstanceName('');
    setSelectedProfId(role === 'profissional' ? profId : '');
    setQrCodeData(null);
    setIsOpen(true);
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInstanceName.trim();
    if (!trimmed) return;
    
    // Se for profissional, vincula automaticamente ao próprio ID dele
    const targetProfId = userRole === 'profissional' ? selectedProfissionalId : selectedProfId;
    if (!targetProfId) { toast.error('Selecione um profissional'); return; }

    setGenerating(true);
    setQrCodeData(null);
    try {
      const { data } = await api.post('/whatsapp/conectar', { instanceName: trimmed });
      if (data.qrcode) {
        const instName = data.instanceName || trimmed;
        addSavedName(instName);
        const prof = profissionais.find((p) => p.id === targetProfId);
        const map = getProfMap();
        map[instName] = { profId: targetProfId, profNome: prof?.nome ?? '' };
        setProfMap(map);

        // Salvar instancia na bio do profissional no banco para o backend usar no webhook
        try {
          let bioObj = {};
          if (prof?.bio) {
            try { bioObj = JSON.parse(prof.bio); } catch(e){}
          }
          await api.patch(`/profissionais/${targetProfId}`, { 
            bio: JSON.stringify({ ...bioObj, whatsappInstanceName: instName }) 
          });
        } catch (e) {
          console.error('Erro ao salvar instancia no banco', e);
        }

        setQrCodeData({ instanceName: instName, base64: data.qrcode });
        setNewInstanceName('');
        setSelectedProfId('');
        fetchInstancias();
      } else {
        toast.error('QR Code não retornado pela API.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar instância');
    } finally {
      setGenerating(false);
    }
  };

  const handleReconnect = async (name: string) => {
    setGenerating(true);
    setQrCodeData(null);
    setIsOpen(true);
    try {
      const { data } = await api.get(`/whatsapp/reconectar/${name}`);
      if (data.qrcode) {
        setQrCodeData({ instanceName: name, base64: data.qrcode });
      } else {
        toast.error('QR Code não retornado pela API de reconexão.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao reconectar');
      setIsOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteInstance = async (name: string) => {
    if (!confirm(`Deseja remover a instância "${name}"?`)) return;
    try { await api.delete(`/whatsapp/desconectar/${name}`); } catch { /* ignora */ }
    removeSavedName(name);
    const map = getProfMap();
    const targetProfId = map[name]?.profId;
    delete map[name];
    setProfMap(map);
    setInstancias((prev) => prev.filter((i) => i.name !== name));

    // Remover do banco
    if (targetProfId) {
      try {
        const prof = profissionais.find((p) => p.id === targetProfId);
        let bioObj = {};
        if (prof?.bio) {
          try { bioObj = JSON.parse(prof.bio); } catch(e){}
        }
        if ('whatsappInstanceName' in bioObj) {
          delete bioObj.whatsappInstanceName;
          await api.patch(`/profissionais/${targetProfId}`, { bio: JSON.stringify(bioObj) });
        }
      } catch (e) {
        console.error('Erro ao remover instancia do banco', e);
      }
    }

    toast.success('Instância removida');
  };

  const getStatus = (s: string) => {
    if (s === 'open') return { label: 'Conectado', color: 'text-emerald-600 bg-emerald-50', icon: <Wifi className="w-3 h-3" /> };
    if (s === 'connecting') return { label: 'Conectando...', color: 'text-amber-600 bg-amber-50', icon: <Loader2 className="w-3 h-3 animate-spin" /> };
    return { label: 'Desconectado', color: 'text-slate-500 bg-slate-100', icon: <WifiOff className="w-3 h-3" /> };
  };

  // Se for profissional, filtra apenas a instância vinculada ao seu ID
  const viewableInstancias = userRole === 'admin'
    ? instancias
    : instancias.filter(i => i.profissionalId === selectedProfissionalId);

  // Se for profissional, verifica se ele já possui WhatsApp configurado
  const temInstanciaProfissional = viewableInstancias.length > 0;

  // Lógica do botão: só mostra se houver profissionais disponíveis
  const canAddInstance = availableProfs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">WhatsApp</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {userRole === 'admin'
              ? 'Gerencie instâncias e conexões dos profissionais da clínica'
              : 'Gerencie a sua conexão de WhatsApp'}
          </p>
        </div>

        {/* Permite adicionar se for admin com profissionais livres, ou se for profissional logado sem Whats cadastrado */}
        {((userRole === 'admin' && profissionais.length > 0 && canAddInstance) ||
          (userRole === 'profissional' && !temInstanciaProfissional)) && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Instância
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
          </div>
        ) : viewableInstancias.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed rounded-2xl bg-slate-50">
            <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma instância de WhatsApp vinculada.</p>
            <p className="text-xs text-slate-400 mt-1">
              {userRole === 'admin' 
                ? 'Conecte um WhatsApp clicando em "Nova Instância"'
                : 'Conecte o seu aparelho clicando em "Nova Instância" no topo.'}
            </p>
          </div>
        ) : (
          viewableInstancias.map((inst) => {
            const st = getStatus(inst.connectionStatus);
            return (
              <div key={inst.name} className="bg-white border rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{inst.name}</h3>
                      <p className="text-xs text-blue-600 font-medium">🩺 {inst.profissionalNome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${st.color}`}>
                      {st.icon}
                      {st.label}
                    </span>
                    {/* Ambos Admin e o respectivo Profissional podem remover a própria instância */}
                    {(userRole === 'admin' || (userRole === 'profissional' && inst.profissionalId === selectedProfissionalId)) && (
                      <button
                        onClick={() => handleDeleteInstance(inst.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remover Instância"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {inst.connectionStatus !== 'open' && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleReconnect(inst.name)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Reconectar WhatsApp (Obter QR Code)
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Dialog for Create/Edit QR Code */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Conexão WhatsApp</DialogTitle>
            <DialogDescription>
              {qrCodeData
                ? 'Escaneie o QR Code abaixo com o seu WhatsApp para conectar a instância.'
                : 'Defina as configurações da nova instância.'}
            </DialogDescription>
          </DialogHeader>

          {qrCodeData ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="p-3 bg-white border-2 border-blue-100 rounded-2xl shadow-inner">
                <img
                  src={qrCodeData.base64}
                  alt="QR Code de Conexão"
                  className="w-60 h-60 object-contain"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-800">Aguardando leitura do QR Code...</p>
                <p className="text-xs text-slate-400">Instância: {qrCodeData.instanceName}</p>
              </div>
              <div className="flex gap-2 w-full pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateInstance} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nome da Instância *</Label>
                <Input
                  value={newInstanceName}
                  onChange={e => setNewInstanceName(e.target.value)}
                  placeholder="Ex: WhatsApp_Clinica"
                  required
                />
                <p className="text-[10px] text-slate-400">Digite sem espaços ou caracteres especiais</p>
              </div>

              {/* Exibe o seletor apenas para o Administrador. Para o Profissional já vincula direto ao perfil dele */}
              {userRole === 'admin' ? (
                <div className="space-y-1.5">
                  <Label>Vincular a Profissional *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={selectedProfId}
                    onChange={e => setSelectedProfId(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {availableProfs.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed rounded-xl p-3 text-xs text-slate-500">
                  🩺 Instância vinculada automaticamente ao seu perfil profissional.
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...
                    </>
                  ) : (
                    'Gerar QR Code'
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
