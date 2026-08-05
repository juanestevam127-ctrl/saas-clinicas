'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Hospital, Clock, Bell, User, Smartphone, Search } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

type HorarioConfig = {
  ativo: boolean;
  inicio: string;
  fim: string;
};

const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const defaultHorarios: HorarioConfig[] = [
  { ativo: false, inicio: '08:00', fim: '18:00' }, // Dom
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Seg
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Ter
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Qua
  { ativo: true, inicio: '08:00', fim: '18:00' },  // Qui
  { ativo: true, inicio: '08:00', fim: '17:00' },  // Sex
  { ativo: false, inicio: '08:00', fim: '12:00' }, // Sab
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [clinica, setClinica] = useState({ nome: '', cnpj: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', telefone: '' });
  const [horarios, setHorarios] = useState<HorarioConfig[]>(defaultHorarios);
  const [lembretes, setLembretes] = useState({ h24: true, h2: false, h1: false });
  const [prof, setProf] = useState({ nome: '', especialidade: '' });

  const totalSteps = 5;

  useEffect(() => {
    const role = localStorage.getItem('agendaduo_user_role');
    const clinicaId = localStorage.getItem('agendaduo_clinica_id');
    
    // Se estiver com o ID de teste corrompido (bug anterior), força logout
    if (clinicaId === '00000000-0000-0000-0000-000000000000') {
      localStorage.clear();
      toast.error('Sessão expirada. Por favor, faça login ou registre-se novamente.');
      router.push('/login');
      return;
    }

    if (role !== 'admin') {
      router.push('/app');
    }
  }, []);

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleCepBlur = async () => {
    const cep = clinica.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setClinica(prev => ({
          ...prev,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf
        }));
        toast.success('Endereço preenchido com sucesso!');
      } else {
        toast.error('CEP não encontrado.');
      }
    } catch (err) {
      toast.error('Erro ao buscar o CEP.');
    }
  };

  const toggleHorario = (i: number) => {
    setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, ativo: !h.ativo } : h));
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      const profId = localStorage.getItem('agendaduo_user_profissional_id');
      
      const lembretesData = [];
      if (lembretes.h24) lembretesData.push({ antecedencia: '24h', ativo: true });
      if (lembretes.h2) lembretesData.push({ antecedencia: '2h', ativo: true });
      if (lembretes.h1) lembretesData.push({ antecedencia: '1h', ativo: true });

      const enderecoCompleto = `${clinica.endereco}${clinica.numero ? ', ' + clinica.numero : ''}${clinica.complemento ? ' - ' + clinica.complemento : ''}${clinica.bairro ? ' - ' + clinica.bairro : ''}${clinica.cidade ? ' - ' + clinica.cidade + '/' + clinica.estado : ''}`;

      // 1. Atualizar Clínica
      await api.put('/configuracoes', {
        clinica: {
          nome: clinica.nome || 'Minha Clínica',
          cnpj: clinica.cnpj,
          telefone: clinica.telefone,
          endereco: enderecoCompleto,
          horario_funcionamento: JSON.stringify(horarios)
        },
        lembretes: lembretesData
      });

      // 2. Atualizar Profissional (Admin)
      if (profId && profId !== '' && prof.nome) {
        await api.patch(`/profissionais/${profId}`, {
          nome: prof.nome,
          especialidade: prof.especialidade
        });
      }

      toast.success('Configuração finalizada com sucesso!');
      
      // Update local storage so that Sidebar shows the new name
      localStorage.setItem('agendaduo_user_name', prof.nome || 'Admin');
      localStorage.setItem('agendaduo_user_especialidade', prof.especialidade || '-');
      window.dispatchEvent(new Event('auth-profile-changed'));

      router.push('/app');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao finalizar configuração. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        {/* MarcAI Logo */}
        <div className="flex items-center gap-2.5 font-sans">
          <div className="relative shrink-0 select-none">
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="26" height="23" rx="6" stroke="url(#obGrad)" strokeWidth="2.8" />
              <path d="M9 3V7" stroke="url(#obGrad)" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M23 3V7" stroke="url(#obGrad)" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M3 13H29" stroke="url(#obGrad)" strokeWidth="2.8" />
              <path d="M10 20.5L14 24.5L22 16.5" stroke="url(#obGrad)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="obGrad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full border border-white flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 3.5C2 2.67157 2.67157 2 3.5 2H8.5C9.32843 2 10 2.67157 10 3.5V6.5C10 7.32843 9.32843 8 8.5 8H5.5L3 10V8H3.5H3C2.67157 8 2 7.32843 2 6.5V3.5Z" fill="currentColor"/>
                <circle cx="4.5" cy="5" r="0.7" fill="#2563EB" />
                <circle cx="7.5" cy="5" r="0.7" fill="#2563EB" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-800">
            Marc<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">AI</span>
          </span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className={`w-12 h-2 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border shadow-xl shadow-slate-200/50 p-8 md:p-12 space-y-8">
          
          {/* Step 1: Clinica */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Hospital className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Sobre a sua Empresa</h2>
              <p className="text-slate-500 text-sm">Como os seus clientes conhecem o seu negócio?</p>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nome da Empresa (obrigatório)</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ex: Nome da Empresa"
                    value={clinica.nome}
                    onChange={e => setClinica({...clinica, nome: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">CNPJ (Opcional)</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="00.000.000/0001-00"
                      value={clinica.cnpj}
                      onChange={e => setClinica({...clinica, cnpj: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">CEP (Opcional)</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="00000-000"
                        value={clinica.cep}
                        onBlur={handleCepBlur}
                        onChange={e => setClinica({...clinica, cep: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-8 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Endereço</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Rua / Avenida"
                      value={clinica.endereco}
                      onChange={e => setClinica({...clinica, endereco: e.target.value})}
                    />
                  </div>
                  <div className="col-span-4 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Número</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="123"
                      value={clinica.numero}
                      onChange={e => setClinica({...clinica, numero: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Complemento (Opcional)</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Sala 4B"
                      value={clinica.complemento}
                      onChange={e => setClinica({...clinica, complemento: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Telefone</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(00) 00000-0000"
                      value={clinica.telefone}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 11) v = v.slice(0, 11);
                        if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                        if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                        setClinica({...clinica, telefone: v});
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bairro</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Bairro"
                      value={clinica.bairro}
                      onChange={e => setClinica({...clinica, bairro: e.target.value})}
                    />
                  </div>
                  <div className="col-span-5 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Cidade</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Cidade"
                      value={clinica.cidade}
                      onChange={e => setClinica({...clinica, cidade: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">UF</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                      placeholder="SP"
                      maxLength={2}
                      value={clinica.estado}
                      onChange={e => setClinica({...clinica, estado: e.target.value})}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 2: Horarios */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Horário de Funcionamento</h2>
              <p className="text-slate-500 text-sm">Configure os dias e horários de atendimento da empresa.</p>
              
              <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2">
                {diasSemana.map((dia, i) => (
                  <div key={dia} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    horarios[i].ativo ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200'
                  }`}>
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
                    <span className={`w-28 text-sm font-medium ${horarios[i].ativo ? 'text-slate-800' : 'text-slate-400'}`}>
                      {dia}
                    </span>
                    {horarios[i].ativo ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={horarios[i].inicio}
                          onChange={e => setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, inicio: e.target.value } : h))}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                        <span className="text-slate-400 text-xs">até</span>
                        <input
                          type="time"
                          value={horarios[i].fim}
                          onChange={e => setHorarios(prev => prev.map((h, idx) => idx === i ? { ...h, fim: e.target.value } : h))}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 italic">Fechado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Lembretes */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Lembretes de Agendamento</h2>
              <p className="text-slate-500 text-sm">O MarcAI envia mensagens automáticas para seus clientes lembrarem do agendamento. Escolha a antecedência:</p>
              
              <div className="space-y-3 pt-4">
                {[
                  { key: 'h24' as const, label: 'Lembrete 24 horas antes', desc: 'Enviado um dia antes do agendamento' },
                  { key: 'h2' as const, label: 'Lembrete 2 horas antes', desc: 'Enviado 2 horas antes do agendamento' },
                  { key: 'h1' as const, label: 'Lembrete 1 hora antes', desc: 'Enviado 1 hora antes do agendamento' },
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
            </div>
          )}

          {/* Step 4: Profissional */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Seu Perfil Profissional</h2>
              <p className="text-slate-500 text-sm">Já vamos deixar a sua agenda pronta pra uso!</p>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Seu Nome</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Dr. João Silva"
                    value={prof.nome}
                    onChange={e => setProf({...prof, nome: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Sua Especialidade</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: Cardiologista, Nutricionista..."
                    value={prof.especialidade}
                    onChange={e => setProf({...prof, especialidade: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: WhatsApp */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Tudo Pronto!</h2>
              <p className="text-slate-500 text-sm">O último passo é conectar o WhatsApp, mas você pode fazer isso depois diretamente no painel do sistema.</p>
              
              <div className="bg-slate-50 border p-6 rounded-xl text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-800">Pronto para começar?</h3>
                <p className="text-xs text-slate-500">Ao finalizar, você será redirecionado para o Dashboard e poderá começar a usar os 7 dias grátis.</p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-8 border-t">
            {step > 1 ? (
              <button onClick={handlePrev} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            ) : <div />}

            <button 
              onClick={handleNext} 
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (step === totalSteps ? 'Ir para o Sistema' : 'Continuar')}
              {!loading && step < totalSteps && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
