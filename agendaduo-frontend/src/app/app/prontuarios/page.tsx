'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  User, Clipboard, Calendar, FileText, DollarSign, Edit3, Save, X,
  Trash2, Upload, Search, Loader2, FileDown, Eye, ChevronRight, ExternalLink
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function ProntuariosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryPacienteId = searchParams.get('pacienteId');

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha');

  // Tab State: Evoluções
  const [evolucoes, setEvolucoes] = useState<any[]>([]);
  const [newNota, setNewNota] = useState('');
  const [savingNota, setSavingNota] = useState(false);
  const [loadingEvolucoes, setLoadingEvolucoes] = useState(false);

  // Tab State: Arquivos
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingArquivos, setLoadingArquivos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Tab State: Consultas & Observações inline
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loadingConsultas, setLoadingConsultas] = useState(false);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [tempObs, setTempObs] = useState('');
  const [savingObs, setSavingObs] = useState(false);

  // Tab State: Financeiro
  const [financeiro, setFinanceiro] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  // 1. Carregar Pacientes
  useEffect(() => {
    fetchPacientes();
  }, []);

  // 2. Monitorar Query Params de URL
  useEffect(() => {
    if (pacientes.length > 0 && queryPacienteId) {
      const found = pacientes.find(p => p.id === queryPacienteId);
      if (found) {
        setSelectedPaciente(found);
      }
    }
  }, [queryPacienteId, pacientes]);

  // 3. Carregar dados das abas ao selecionar paciente
  useEffect(() => {
    if (selectedPaciente) {
      setNewNota('');
      setEditingObsId(null);
      fetchTabContent(activeTab);
    }
  }, [selectedPaciente, activeTab]);

  const fetchPacientes = async () => {
    try {
      const res = await api.get('/pacientes');
      setPacientes(res.data || []);
    } catch {
      toast.error('Erro ao carregar lista de pacientes');
    } finally {
      setLoadingPacientes(false);
    }
  };

  const fetchTabContent = async (tab: string) => {
    if (!selectedPaciente) return;

    if (tab === 'ficha') {
      // Ficha não precisa de requisição extra pois já temos os dados no selectedPaciente
    } else if (tab === 'evolucoes') {
      setLoadingEvolucoes(true);
      try {
        const res = await api.get(`/prontuarios/evolucoes?pacienteId=${selectedPaciente.id}`);
        setEvolucoes(res.data || []);
      } catch {
        toast.error('Erro ao carregar anotações evolutivas');
      } finally {
        setLoadingEvolucoes(false);
      }
    } else if (tab === 'arquivos') {
      setLoadingArquivos(true);
      try {
        const res = await api.get(`/prontuarios/arquivos?pacienteId=${selectedPaciente.id}`);
        setArquivos(res.data || []);
      } catch {
        toast.error('Erro ao carregar arquivos');
      } finally {
        setLoadingArquivos(false);
      }
    } else if (tab === 'consultas') {
      setLoadingConsultas(true);
      try {
        const res = await api.get('/consultas');
        const list = (res.data || []).filter((c: any) => c.pacienteId === selectedPaciente.id);
        // Ordenar consultas por data mais recente
        list.sort((a: any, b: any) => new Date(b.dataHoraInicio).getTime() - new Date(a.dataHoraInicio).getTime());
        setConsultas(list);
      } catch {
        toast.error('Erro ao carregar histórico de consultas');
      } finally {
        setLoadingConsultas(false);
      }
    } else if (tab === 'financeiro') {
      setLoadingFinanceiro(true);
      try {
        const res = await api.get('/financeiro');
        const list = (res.data || []).filter((f: any) => f.pacienteId === selectedPaciente.id);
        setFinanceiro(list);
      } catch {
        toast.error('Erro ao carregar financeiro do paciente');
      } finally {
        setLoadingFinanceiro(false);
      }
    }
  };

  // Salvar Nova Nota Evolutiva
  const handleSaveNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNota.trim() || !selectedPaciente) return;

    const profId = localStorage.getItem('agendaduo_user_profissional_id') || '';
    if (!profId) {
      toast.error('Profissional não identificado. Associe seu perfil primeiro.');
      return;
    }

    setSavingNota(true);
    try {
      const res = await api.post('/prontuarios/evolucoes', {
        pacienteId: selectedPaciente.id,
        profissionalId: profId,
        texto: newNota.trim()
      });
      setEvolucoes(prev => [res.data, ...prev]);
      setNewNota('');
      toast.success('Anotação registrada com sucesso!');
    } catch {
      toast.error('Erro ao salvar anotação evolutiva');
    } finally {
      setSavingNota(false);
    }
  };

  // Deletar Nota Evolutiva
  const handleDeleteNota = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta anotação?')) return;

    try {
      await api.delete(`/prontuarios/evolucoes?id=${id}`);
      setEvolucoes(prev => prev.filter(n => n.id !== id));
      toast.success('Anotação removida com sucesso');
    } catch {
      toast.error('Erro ao excluir anotação');
    }
  };

  // Enviar Arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPaciente) return;

    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('O arquivo ultrapassa o limite de 2MB permitidos para fotos e PDFs.');
      return;
    }

    const tipoArquivo = file.type.includes('pdf') ? 'pdf' : 'foto';

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pacienteId', selectedPaciente.id);
    formData.append('tipoArquivo', tipoArquivo);

    try {
      const res = await api.post('/prontuarios/arquivos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setArquivos(prev => [res.data, ...prev]);
      toast.success('Arquivo anexado com sucesso!');
    } catch (errUpload: any) {
      toast.error(errUpload.response?.data?.message || 'Erro ao realizar upload do arquivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Deletar Arquivo
  const handleDeleteArquivo = async (id: string) => {
    if (!confirm('Deseja realmente remover este arquivo permanentemente?')) return;

    try {
      await api.delete(`/prontuarios/arquivos?id=${id}`);
      setArquivos(prev => prev.filter(a => a.id !== id));
      toast.success('Arquivo removido com sucesso');
    } catch {
      toast.error('Erro ao remover arquivo');
    }
  };

  // Salvar Observações de uma Consulta Específica
  const handleSaveObs = async (consultaId: string) => {
    setSavingObs(true);
    try {
      await api.patch(`/consultas/${consultaId}`, { observacoes: tempObs.trim() });
      setConsultas(prev => prev.map(c => c.id === consultaId ? { ...c, observacoes: tempObs.trim() } : c));
      setEditingObsId(null);
      toast.success('Observações da consulta atualizadas com sucesso!');
    } catch {
      toast.error('Erro ao salvar observações da consulta');
    } finally {
      setSavingObs(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.telefone && p.telefone.includes(searchTerm)) ||
    (p.cpf && p.cpf.includes(searchTerm))
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4 sm:p-6 min-h-[85vh]">
      
      {/* 1. Barra Lateral de Clientes */}
      <div className="w-full lg:w-80 shrink-0 bg-white border rounded-2xl p-4 shadow-sm space-y-4 flex flex-col h-[75vh] lg:h-[80vh]">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <Clipboard className="w-5 h-5 text-blue-600" />
            Prontuários Clínicos
          </h2>
          <p className="text-xs text-slate-400">Selecione um paciente para ver o prontuário.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {loadingPacientes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : filteredPacientes.length > 0 ? (
            filteredPacientes.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPaciente(p);
                  router.push(`/app/prontuarios?pacienteId=${p.id}`);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                  selectedPaciente?.id === p.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{p.nome}</p>
                  <p className={`text-[10px] truncate mt-0.5 ${selectedPaciente?.id === p.id ? 'text-white/80' : 'text-slate-400'}`}>
                    Tel: {p.telefone || '—'}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                  selectedPaciente?.id === p.id ? 'text-white' : 'text-slate-300'
                }`} />
              </button>
            ))
          ) : (
            <p className="text-center text-xs text-slate-400 py-8">Nenhum paciente encontrado</p>
          )}
        </div>
      </div>

      {/* 2. Conteúdo do Prontuário */}
      <div className="flex-1 min-w-0">
        {selectedPaciente ? (
          <div className="space-y-6">
            
            {/* Header do Paciente */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                <div 
                  onClick={() => router.push(`/app/pacientes?editarPacienteId=${selectedPaciente.id}`)}
                  className="w-12 h-12 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 font-bold text-base shadow-sm cursor-pointer transition-colors"
                  title="Clique para editar cadastro"
                >
                  {selectedPaciente.nome.charAt(0)}
                </div>
                <div>
                  <h1 
                    onClick={() => router.push(`/app/pacientes?editarPacienteId=${selectedPaciente.id}`)}
                    className="text-lg font-black text-slate-800 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Clique para editar cadastro"
                  >
                    {selectedPaciente.nome}
                    <span className="text-[10px] text-slate-400 font-normal">(Editar Cadastro)</span>
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      CPF: {selectedPaciente.cpf || '—'}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      Cel: {selectedPaciente.telefone || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-5 shrink-0 scrollbar-none">
              {[
                { key: 'ficha', label: 'Ficha Cadastral', icon: User },
                { key: 'evolucoes', label: 'Evoluções', icon: Clipboard },
                { key: 'arquivos', label: 'Fotos & PDFs', icon: Upload },
                { key: 'consultas', label: 'Consultas (Prontuário/Timeline)', icon: Calendar },
                { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 pb-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap px-1 cursor-pointer ${
                    activeTab === tab.key 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Renderizar Conteúdo de Abas */}
            <div className="min-h-[50vh]">
              
              {/* TAB 1: FICHA CADASTRAL */}
              {activeTab === 'ficha' && (
                <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 relative">
                  
                  {/* Botão de Edição Rápida */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => router.push(`/app/pacientes?editarPacienteId=${selectedPaciente.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Ficha Cadastro
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</span>
                      <p className="text-sm font-semibold text-slate-700">{selectedPaciente.nome}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone / WhatsApp</span>
                      <p className="text-sm font-semibold text-slate-700">{selectedPaciente.telefone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CPF</span>
                      <p className="text-sm font-semibold text-slate-700">{selectedPaciente.cpf || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Nascimento</span>
                      <p className="text-sm font-semibold text-slate-700">
                        {selectedPaciente.dataNascimento ? new Date(selectedPaciente.dataNascimento).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail</span>
                      <p className="text-sm font-semibold text-slate-700 truncate">{selectedPaciente.email || '—'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observações / Informações de Saúde</span>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {selectedPaciente.observacoes || 'Nenhuma observação cadastrada para este paciente.'}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EVOLUÇÕES CLÍNICAS */}
              {activeTab === 'evolucoes' && (
                <div className="space-y-5">
                  {/* Cadastrar Nova Anotação */}
                  <form onSubmit={handleSaveNota} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Nova Anotação Evolutiva</label>
                      <textarea
                        placeholder="Digite aqui o prontuário, anotações clínicas ou evolução da consulta..."
                        rows={4}
                        value={newNota}
                        onChange={e => setNewNota(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingNota}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {savingNota ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clipboard className="w-3.5 h-3.5" />}
                        Salvar Anotação
                      </button>
                    </div>
                  </form>

                  {/* Histórico de Evoluções */}
                  <div className="space-y-4">
                    {loadingEvolucoes ? (
                      <div className="flex justify-center py-12 bg-white border rounded-2xl">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : evolucoes.length > 0 ? (
                      evolucoes.map((evo) => (
                        <div key={evo.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-3 relative group">
                          <div className="flex items-center justify-between border-b pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <p className="text-xs font-bold text-slate-700">
                                Por: {evo.profissional?.nome || 'Profissional'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                {new Date(evo.dataHora).toLocaleString('pt-BR')}
                              </span>
                              <button
                                onClick={() => handleDeleteNota(evo.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                title="Excluir anotação"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {evo.texto}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-white border rounded-2xl text-slate-400 text-xs">
                        Nenhuma evolução clínica anotada para este paciente.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: FOTOS E ARQUIVOS (PDF) */}
              {activeTab === 'arquivos' && (
                <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-6">
                  {/* Upload Área */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 hover:bg-slate-100/50 transition-colors relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-xs font-semibold text-slate-500">Enviando e salvando arquivo...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="w-10 h-10 bg-white border rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Clique ou arraste um arquivo para anexar</p>
                          <p className="text-[10px] text-slate-400 mt-1">Imagens (JPG, PNG) ou PDFs de exames. Limite rígido: máximo 2MB.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lista de Arquivos com Nomes Maiores e Datas Visíveis */}
                  {loadingArquivos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : arquivos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {arquivos.map((arq) => (
                        <div key={arq.id} className="border rounded-xl p-4 flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-sm">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {arq.tipoArquivo === 'foto' ? (
                              <div 
                                onClick={() => setPreviewImage(arq.urlArquivo)}
                                className="w-14 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer relative bg-white border flex items-center justify-center hover:opacity-85 transition-opacity"
                              >
                                <img src={arq.urlArquivo} alt={arq.nomeArquivo} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0 border border-red-100">
                                <FileText className="w-7 h-7" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              {/* Nome do arquivo maior e perfeitamente visível */}
                              <h4 className="text-sm font-bold text-slate-800 break-words leading-tight" title={arq.nomeArquivo}>
                                {arq.nomeArquivo}
                              </h4>
                              {/* Data de Adição Visível */}
                              <p className="text-[10px] text-slate-400 mt-1">
                                Adicionado em: {new Date(arq.createdAt).toLocaleString('pt-BR')}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Tamanho: {(arq.tamanhoBytes / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {arq.tipoArquivo === 'pdf' ? (
                              <a
                                href={arq.urlArquivo}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white border"
                                title="Visualizar/Baixar PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </a>
                            ) : (
                              <button
                                onClick={() => setPreviewImage(arq.urlArquivo)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-white border cursor-pointer"
                                title="Ampliar Imagem"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteArquivo(arq.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white border cursor-pointer"
                              title="Remover arquivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs border border-dashed rounded-xl">
                      Nenhum arquivo ou foto anexado a este prontuário.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HISTÓRICO DE CONSULTAS & TIMELINE DE ANOTAÇÕES */}
              {activeTab === 'consultas' && (
                <div className="space-y-6">
                  <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">Timeline Clínico / Anotações das Consultas</h3>
                    <p className="text-xs text-slate-500">Veja o histórico de consultas e adicione observações específicas para cada atendimento realizado.</p>
                  </div>

                  {loadingConsultas ? (
                    <div className="flex justify-center py-12 bg-white border rounded-2xl">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : consultas.length > 0 ? (
                    <div className="space-y-4">
                      {consultas.map((c) => {
                        const dataObj = new Date(c.dataHoraInicio);
                        const isEditing = editingObsId === c.id;

                        return (
                          <div key={c.id} className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
                            {/* Cabeçalho do Card */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3.5">
                              <div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mr-2 ${
                                  c.status === 'realizado' ? 'bg-slate-100 text-slate-600' :
                                  c.status === 'confirmado' ? 'bg-emerald-50 text-emerald-700' :
                                  c.status === 'cancelado' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {c.status === 'realizado' ? 'Atendida' : c.status}
                                </span>
                                <span className="text-xs font-black text-slate-800">
                                  {dataObj.toLocaleDateString('pt-BR')} às {dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Profissional: <strong className="text-slate-600">{c.profissional?.nome || '—'}</strong> | 
                                  Serviço: <strong className="text-slate-600">{c.servico?.nome || '—'}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Botão para ir para a Consulta na Agenda */}
                                <button
                                  onClick={() => {
                                    const datePart = c.dataHoraInicio.split('T')[0];
                                    router.push(`/app/agenda?data=${datePart}&consultaId=${c.id}`);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                  title="Ver consulta na Agenda"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Ver na Agenda ↗
                                </button>
                              </div>
                            </div>

                            {/* Área de Observações da Consulta */}
                            <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  Anotações / Observações Clínicas do Atendimento
                                </span>
                                {!isEditing && (
                                  <button
                                    onClick={() => {
                                      setEditingObsId(c.id);
                                      setTempObs(c.observacoes || '');
                                    }}
                                    className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Adicionar/Editar Nota
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={tempObs}
                                    onChange={e => setTempObs(e.target.value)}
                                    placeholder="Digite notas clínicas específicas para esta consulta (ex: receitas, evolução, queixas do paciente)..."
                                    rows={3}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingObsId(null)}
                                      disabled={savingObs}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      <X className="w-3 h-3" /> Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveObs(c.id)}
                                      disabled={savingObs}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      {savingObs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {c.observacoes || (
                                    <span className="text-slate-400 italic">Sem anotações registradas para esta consulta.</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white border rounded-2xl text-slate-400 text-xs">
                      Nenhuma consulta cadastrada no histórico deste paciente.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FINANCEIRO DO PACIENTE */}
              {activeTab === 'financeiro' && (
                <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                  {loadingFinanceiro ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    </div>
                  ) : financeiro.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            <th className="py-3 px-2">Data Vencimento</th>
                            <th className="py-3 px-2">Descrição</th>
                            <th className="py-3 px-2">Forma de Pagamento</th>
                            <th className="py-3 px-2">Valor</th>
                            <th className="py-3 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                          {financeiro.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-2 font-semibold">
                                {f.vencimento ? new Date(f.vencimento).toLocaleDateString('pt-BR') : '—'}
                              </td>
                              <td className="py-3 px-2 font-medium">{f.descricao}</td>
                              <td className="py-3 px-2">{f.formaPagamento || '—'}</td>
                              <td className="py-3 px-2 font-bold text-slate-800">
                                R$ {Number(f.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  f.pago ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {f.pago ? 'Pago' : 'Pendente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Nenhuma movimentação financeira encontrada para este paciente.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white border border-dashed rounded-2xl p-8 text-center text-slate-400 gap-3">
            <Clipboard className="w-8 h-8 text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-600">Nenhum prontuário carregado</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Use a barra lateral para pesquisar ou selecionar um paciente e abrir a ficha clínica.</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal de Visualização Ampliada da Imagem */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setPreviewImage(null)} />
          <div className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col relative z-10 shadow-2xl animate-in zoom-in duration-150">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors cursor-pointer text-xs font-bold"
            >
              ✕
            </button>
            <div className="p-2 flex items-center justify-center bg-slate-900 overflow-hidden flex-1 max-h-[80vh]">
              <img src={previewImage} alt="Ampliação" className="max-w-full max-h-full object-contain select-none" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
