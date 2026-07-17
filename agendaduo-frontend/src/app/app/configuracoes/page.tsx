'use client';

import { useState, useEffect } from 'react';
import { Save, Building2, Clock, Bell, Shield, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

const tabs = [
  { key: 'clinica', label: 'Clínica', icon: Building2 },
  { key: 'horarios', label: 'Horários', icon: Clock },
  { key: 'lembretes', label: 'Lembretes', icon: Bell },
];

const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

type HorarioConfig = {
  ativo: boolean;
  inicio: string;
  fim: string;
};

const defaultHorarios: HorarioConfig[] = [
  { ativo: false, inicio: '08:00', fim: '18:00' }, // Dom
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Seg
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Ter
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Qua
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Qui
  { ativo: true, inicio: '08:00', fim: '17:00' },  // Sex
  { ativo: false, inicio: '08:00', fim: '12:00' }, // Sab
];

const defaultMsgPresencial = `Olá, {{nome_paciente}}! 😊

Este é um lembrete de que sua consulta está confirmada.

📅 Data: {{data_consulta}}
🕒 Horário: {{horario_consulta}}
👨‍⚕️ Profissional: {{nome_profissional}}
📍 Endereço: {{endereco_consultorio}}

Se possível, chegue com alguns minutos de antecedência.

Caso precise reagendar ou tenha alguma dúvida, basta responder esta mensagem.

A equipe da {{nome_clinica}} espera por você!`;

const defaultMsgOnline = `Olá, {{nome_paciente}}! 😊

Este é um lembrete de que sua consulta online está confirmada.

📅 Data: {{data_consulta}}
🕒 Horário: {{horario_consulta}}
👨‍⚕️ Profissional: {{nome_profissional}}
💻 Link da reunião: {{link_reuniao}}

Recomendamos acessar o link alguns minutos antes do horário marcado para garantir que tudo esteja funcionando corretamente.

Se precisar de ajuda ou desejar reagendar, é só responder esta mensagem.

Até breve!`;

const defaultMsgAniversario = `🎉 Feliz aniversário, {{nome_paciente}}!

Toda a equipe da {{nome_clinica}} deseja que o seu dia seja repleto de alegria, saúde e muitos momentos especiais.

Obrigado por confiar em nosso trabalho. Esperamos continuar cuidando de você sempre que precisar.

Parabéns e muitas felicidades! 🎂💙`;

const defaultMsgAvaliacao = `Olá, {{nome_paciente}}! 😊

Esperamos que sua consulta tenha sido excelente e agradecemos pela confiança na {{nome_clinica}}.

Sua opinião é muito importante para nós! Se puder, reserve um minutinho para avaliar nosso atendimento:

⭐ Avalie nossa clínica:
{{link_avaliacao_google}}

E para acompanhar novidades, dicas de saúde e conteúdos exclusivos, siga nosso Instagram:

📲 Instagram:
{{link_instagram}}

Obrigado por fazer parte da nossa história. Esperamos revê-lo em breve! 💙`;

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('clinica');
  const [horarios, setHorarios] = useState<HorarioConfig[]>(defaultHorarios);
  const [lembretes, setLembretes] = useState({ h24: true, h2: true, h1: false });
  const [customLembretes, setCustomLembretes] = useState<{ id: string; valor: number; unidade: 'minutos' | 'horas' | 'dias'; ativo: boolean }[]>([
    { id: '1', valor: 30, unidade: 'minutos', ativo: true }
  ]);
  const [newCustomVal, setNewCustomVal] = useState<number>(3);
  const [newCustomUnit, setNewCustomUnit] = useState<'minutos' | 'horas' | 'dias'>('horas');

  const [clinica, setClinica] = useState({
    nome: 'Clínica AgendaDuo Demo',
    cnpj: '00.000.000/0001-00',
    telefone: '(11) 99999-8888',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    fusoHorario: 'America/Sao_Paulo',
    n8nWebhookUrl: '',
    lembreteAniversarioAtivo: false,
    lembreteAniversarioHorario: '08:00',
    msgLembretePresencial: defaultMsgPresencial,
    msgLembreteOnline: defaultMsgOnline,
    msgAniversario: defaultMsgAniversario,
    lembreteAvaliacaoAtivo: false,
    lembreteAvaliacaoValor: 60,
    lembreteAvaliacaoUnidade: 'minutos',
    linkAvaliacaoGoogle: '',
    linkInstagram: '',
    msgAvaliacao: defaultMsgAvaliacao,
  });

  const toggleHorario = (i: number) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, ativo: !h.ativo } : h));
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/configuracoes');
      const data = res.data;
      if (data.clinica) {
        setClinica({
          nome: data.clinica.nome || '',
          cnpj: data.clinica.cnpj || '',
          telefone: data.clinica.telefone || '',
          endereco: data.clinica.endereco || '',
          fusoHorario: data.clinica.fusoHorario || 'America/Sao_Paulo',
          n8nWebhookUrl: data.clinica.n8n_webhook_url || '',
          lembreteAniversarioAtivo: data.clinica.lembreteAniversarioAtivo || false,
          lembreteAniversarioHorario: data.clinica.lembreteAniversarioHorario || '08:00',
          msgLembretePresencial: data.clinica.msgLembretePresencial || defaultMsgPresencial,
          msgLembreteOnline: data.clinica.msgLembreteOnline || defaultMsgOnline,
          msgAniversario: data.clinica.msgAniversario || defaultMsgAniversario,
          lembreteAvaliacaoAtivo: data.clinica.lembreteAvaliacaoAtivo || false,
          lembreteAvaliacaoValor: data.clinica.lembreteAvaliacaoValor !== undefined ? Number(data.clinica.lembreteAvaliacaoValor) : 60,
          lembreteAvaliacaoUnidade: data.clinica.lembreteAvaliacaoUnidade || 'minutos',
          linkAvaliacaoGoogle: data.clinica.linkAvaliacaoGoogle || '',
          linkInstagram: data.clinica.linkInstagram || '',
          msgAvaliacao: data.clinica.msgAvaliacao || defaultMsgAvaliacao,
        });

        if (data.clinica.horarioFuncionamento) {
          try {
            const parsed = typeof data.clinica.horarioFuncionamento === 'string'
              ? JSON.parse(data.clinica.horarioFuncionamento)
              : data.clinica.horarioFuncionamento;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHorarios(parsed);
            }
          } catch (e) {
            console.error('Erro ao converter horarioFuncionamento', e);
          }
        }
      }
      
      if (data.lembretes) {
        const lembs = data.lembretes;
        setLembretes({
          h24: lembs.some((l: any) => l.antecedencia === '24h' && l.ativo),
          h2: lembs.some((l: any) => l.antecedencia === '2h' && l.ativo),
          h1: lembs.some((l: any) => l.antecedencia === '1h' && l.ativo),
        });

        const customs = lembs
          .filter((l: any) => !['24h', '2h', '1h'].includes(l.antecedencia))
          .map((l: any) => {
            let val = parseInt(l.antecedencia);
            let unit: 'minutos' | 'horas' | 'dias' = 'horas';
            if (l.antecedencia.endsWith('m')) unit = 'minutos';
            else if (l.antecedencia.endsWith('d')) unit = 'dias';
            return {
              id: l.id,
              valor: val,
              unidade: unit,
              ativo: l.ativo,
            };
          });
        setCustomLembretes(customs);
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const lembretesData = [];
      if (lembretes.h24) lembretesData.push({ antecedencia: '24h', ativo: true });
      if (lembretes.h2) lembretesData.push({ antecedencia: '2h', ativo: true });
      if (lembretes.h1) lembretesData.push({ antecedencia: '1h', ativo: true });

      for (const custom of customLembretes) {
        let ant = `${custom.valor}h`;
        if (custom.unidade === 'minutos') ant = `${custom.valor}m`;
        if (custom.unidade === 'dias') ant = `${custom.valor}d`;
        lembretesData.push({ antecedencia: ant, ativo: custom.ativo });
      }

      await api.put('/configuracoes', {
        clinica: {
          ...clinica,
          horarioFuncionamento: horarios,
        },
        lembretes: lembretesData,
      });

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1 text-sm">Gerencie as configurações da sua clínica</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-52 shrink-0 overflow-x-auto">
          <nav className="flex flex-row md:flex-col gap-2 space-y-0 md:space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Clinic Settings */}
          {activeTab === 'clinica' && (
            <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-900">Informações da Clínica</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nome da Clínica', key: 'nome', type: 'text' },
                  { label: 'CNPJ', key: 'cnpj', type: 'text' },
                  { label: 'Telefone', key: 'telefone', type: 'tel' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={clinica[f.key as keyof typeof clinica] as any}
                      onChange={e => {
                        let v = e.target.value;
                        if (f.key === 'telefone') {
                          v = v.replace(/\D/g, '');
                          if (v.length > 11) v = v.slice(0, 11);
                          if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                          if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                        } else if (f.key === 'cnpj') {
                          v = v.replace(/\D/g, '');
                          if (v.length > 14) v = v.slice(0, 14);
                          v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                          v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                          v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                          v = v.replace(/(\d{4})(\d)/, '$1-$2');
                        }
                        setClinica(prev => ({ ...prev, [f.key]: v }));
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Endereço</label>
                  <input
                    type="text"
                    value={clinica.endereco}
                    onChange={e => setClinica(prev => ({ ...prev, endereco: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end">
                <button disabled={saving} onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* Horarios Settings */}
          {activeTab === 'horarios' && (
            <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Horário de Funcionamento</h2>
              <p className="text-sm text-slate-500">Configure os dias e horários padrão de atendimento da clínica.</p>
              <div className="space-y-2 mt-4">
                {diasSemana.map((dia, i) => (
                  <div key={dia} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${
                    horarios[i].ativo ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleHorario(i)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        horarios[i].ativo ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        horarios[i].ativo ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                      </button>
                      <span className={`w-32 text-sm font-medium ${horarios[i].ativo ? 'text-slate-800' : 'text-slate-400'}`}>
                        {dia}
                      </span>
                    </div>
                    {horarios[i].ativo ? (
                      <div className="flex flex-wrap items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={horarios[i].inicio}
                          onChange={e => setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, inicio: e.target.value } : h))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-400 text-sm">até</span>
                        <input
                          type="time"
                          value={horarios[i].fim}
                          onChange={e => setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, fim: e.target.value } : h))}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all hover:-translate-y-0.5">
                  <Save className="w-4 h-4" />
                  Salvar Horários
                </button>
              </div>
            </div>
          )}

          {/* Lembretes Settings */}
          {activeTab === 'lembretes' && (
            <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-900">Lembretes Automáticos</h2>
              <p className="text-sm text-slate-500">Configure quando os lembretes serão enviados automaticamente via WhatsApp.</p>
              <div className="space-y-3 mt-4">
                {[
                  { key: 'h24' as const, label: 'Lembrete 24 horas antes', desc: 'Enviado um dia antes da consulta' },
                  { key: 'h2' as const, label: 'Lembrete 2 horas antes', desc: 'Enviado 2 horas antes da consulta' },
                  { key: 'h1' as const, label: 'Lembrete 1 hora antes', desc: 'Enviado 1 hora antes da consulta' },
                ].map(l => (
                  <div key={l.key} className={`flex items-center gap-4 p-5 rounded-xl border transition-colors ${
                    lembretes[l.key] ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <button
                      onClick={() => setLembretes(prev => ({ ...prev, [l.key]: !prev[l.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        lembretes[l.key] ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        lembretes[l.key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <div>
                      <div className={`text-sm font-semibold ${lembretes[l.key] ? 'text-slate-800' : 'text-slate-400'}`}>{l.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lembretes Personalizados */}
              <div className="border-t pt-5 mt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Lembretes Personalizados</h3>
                <p className="text-xs text-slate-500">Crie regras adicionais de envio conforme a antecedência desejada.</p>
                
                {/* Form para adicionar novo */}
                <div className="bg-slate-50 border rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Antecedência</span>
                    <input
                      type="number"
                      min="1"
                      value={newCustomVal}
                      onChange={e => setNewCustomVal(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Unidade</span>
                    <select
                      value={newCustomUnit}
                      onChange={e => setNewCustomUnit(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="minutos">Minutos antes</option>
                      <option value="horas">Horas antes</option>
                      <option value="dias">Dias antes</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const id = Math.random().toString(36).substring(2, 9);
                      setCustomLembretes(prev => [...prev, { id, valor: newCustomVal, unidade: newCustomUnit, ativo: true }]);
                      toast.success('Regra de lembrete adicionada!');
                    }}
                    className="self-end px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar Regra
                  </button>
                </div>

                {/* Lista de regras customizadas */}
                <div className="space-y-2">
                  {customLembretes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum lembrete personalizado criado.</p>
                  ) : (
                    customLembretes.map(cl => (
                      <div key={cl.id} className="flex items-center justify-between p-3 border rounded-xl bg-white hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCustomLembretes(prev => prev.map(item => item.id === cl.id ? { ...item, ativo: !item.ativo } : item))}
                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                              cl.ativo ? 'bg-green-500' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                              cl.ativo ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </button>
                          <span className="text-xs font-medium text-slate-700">
                            Enviar lembrete <strong>{cl.valor} {cl.unidade}</strong> antes do agendamento
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomLembretes(prev => prev.filter(item => item.id !== cl.id));
                            toast.success('Lembrete personalizado removido');
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lembretes de Aniversário */}
              <div className="border-t pt-5 mt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Lembretes de Aniversário</h3>
                <p className="text-xs text-slate-500">Envie mensagens automáticas de felicitações para os pacientes no dia do aniversário.</p>
                
                <div className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border transition-colors ${
                  clinica.lembreteAniversarioAtivo ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setClinica(prev => ({ ...prev, lembreteAniversarioAtivo: !prev.lembreteAniversarioAtivo }))}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      clinica.lembreteAniversarioAtivo ? 'bg-indigo-500' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      clinica.lembreteAniversarioAtivo ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${clinica.lembreteAniversarioAtivo ? 'text-slate-800' : 'text-slate-400'}`}>
                        Ativar Lembrete de Aniversário
                      </div>
                    </div>
                  </div>
                  {clinica.lembreteAniversarioAtivo && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-xs font-semibold text-slate-600">Horário:</span>
                      <input
                        type="time"
                        value={clinica.lembreteAniversarioHorario}
                        onChange={e => setClinica(prev => ({ ...prev, lembreteAniversarioHorario: e.target.value }))}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Lembretes de Avaliação */}
              <div className="border-t pt-5 mt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Lembrete de Avaliação da Clínica</h3>
                <p className="text-xs text-slate-500">Envie mensagens automáticas convidando os pacientes a avaliarem o atendimento no Google e seguirem o Instagram pós-consulta.</p>
                
                <div className={`flex flex-col gap-4 p-5 rounded-xl border transition-colors ${
                  clinica.lembreteAvaliacaoAtivo ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setClinica(prev => ({ ...prev, lembreteAvaliacaoAtivo: !prev.lembreteAvaliacaoAtivo }))}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        clinica.lembreteAvaliacaoAtivo ? 'bg-indigo-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        clinica.lembreteAvaliacaoAtivo ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${clinica.lembreteAvaliacaoAtivo ? 'text-slate-800' : 'text-slate-400'}`}>
                        Ativar Lembrete de Avaliação pós-consulta
                      </div>
                    </div>
                  </div>

                  {clinica.lembreteAvaliacaoAtivo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t pt-4 border-slate-200/60">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">Enviar quanto tempo após a consulta?</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={clinica.lembreteAvaliacaoValor}
                            onChange={e => setClinica(prev => ({ ...prev, lembreteAvaliacaoValor: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={clinica.lembreteAvaliacaoUnidade}
                            onChange={e => setClinica(prev => ({ ...prev, lembreteAvaliacaoUnidade: e.target.value }))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="minutos">Minuto(s)</option>
                            <option value="horas">Hora(s)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">Link de Avaliação do Google</label>
                        <input
                          type="text"
                          value={clinica.linkAvaliacaoGoogle}
                          onChange={e => setClinica(prev => ({ ...prev, linkAvaliacaoGoogle: e.target.value }))}
                          placeholder="Ex: https://g.page/r/sua-clinica/review"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600">Link do Instagram</label>
                        <input
                          type="text"
                          value={clinica.linkInstagram}
                          onChange={e => setClinica(prev => ({ ...prev, linkInstagram: e.target.value }))}
                          placeholder="Ex: https://instagram.com/suaclinica"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modelos de Mensagem Customizados */}
              <div className="border-t pt-5 mt-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800">Modelos de Mensagens (WhatsApp)</h3>
                <p className="text-xs text-slate-500">Configure as mensagens automáticas enviadas para os seus pacientes. Use as variáveis dinâmicas disponíveis.</p>
                
                <div className="space-y-4">
                  {/* Lembrete Presencial */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Mensagem de Lembrete Presencial</label>
                    <textarea
                      value={clinica.msgLembretePresencial}
                      onChange={e => setClinica(prev => ({ ...prev, msgLembretePresencial: e.target.value }))}
                      rows={7}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">Variáveis: <code>{"{{nome_paciente}}"}</code>, <code>{"{{data_consulta}}"}</code>, <code>{"{{horario_consulta}}"}</code>, <code>{"{{nome_profissional}}"}</code>, <code>{"{{endereco_consultorio}}"}</code>, <code>{"{{nome_clinica}}"}</code></p>
                  </div>

                  {/* Lembrete Online */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Mensagem de Lembrete Online</label>
                    <textarea
                      value={clinica.msgLembreteOnline}
                      onChange={e => setClinica(prev => ({ ...prev, msgLembreteOnline: e.target.value }))}
                      rows={7}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">Variáveis: <code>{"{{nome_paciente}}"}</code>, <code>{"{{data_consulta}}"}</code>, <code>{"{{horario_consulta}}"}</code>, <code>{"{{nome_profissional}}"}</code>, <code>{"{{link_reuniao}}"}</code>, <code>{"{{nome_clinica}}"}</code></p>
                  </div>

                  {/* Mensagem de Aniversário */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Mensagem de Aniversário</label>
                    <textarea
                      value={clinica.msgAniversario}
                      onChange={e => setClinica(prev => ({ ...prev, msgAniversario: e.target.value }))}
                      rows={5}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">Variáveis: <code>{"{{nome_paciente}}"}</code>, <code>{"{{nome_clinica}}"}</code></p>
                  </div>

                  {/* Mensagem de Avaliação */}
                  {clinica.lembreteAvaliacaoAtivo && (
                    <div className="space-y-1.5 border-t pt-4">
                      <label className="block text-xs font-semibold text-slate-600">Mensagem de Avaliação da Clínica</label>
                      <textarea
                        value={clinica.msgAvaliacao}
                        onChange={e => setClinica(prev => ({ ...prev, msgAvaliacao: e.target.value }))}
                        rows={9}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Variáveis: <code>{"{{nome_paciente}}"}</code>, <code>{"{{nome_clinica}}"}</code>, <code>{"{{link_avaliacao_google}}"}</code>, <code>{"{{link_instagram}}"}</code></p>
                    </div>
                  )}
                </div>
              </div>

                <div className="pt-4 border-t flex justify-end">
                  <button disabled={saving} onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Configurações
                  </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
