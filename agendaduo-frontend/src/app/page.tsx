'use client';

import Link from 'next/link';
import { Calendar, Users, Activity, MessageCircle, DollarSign, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona se já estiver logado
    const role = localStorage.getItem('agendaduo_user_role');
    if (role) {
      router.push('/app');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-black tracking-tight text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            AgendaDuo
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              Entrar
            </Link>
            <Link href="/register" className="text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
              Registrar-se
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-slate-50 -z-10" />
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Sistema de Gestão Completo
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            A gestão da sua clínica,<br className="hidden md:block" /> simples e <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">eficiente.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Tenha as funcionalidades essenciais para organizar sua agenda, pacientes e financeiro.
            Criado para diversos nichos da saúde, sem complicações.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              Teste Grátis por 7 Dias <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-slate-400 font-medium">Após o período de teste, apenas R$ 49,90 por mês. Sem fidelidade.</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white border-y">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black tracking-tight">Tudo o que você precisa</h2>
            <p className="text-slate-500">Sem funções inúteis. Apenas as ferramentas certas para impulsionar seu negócio.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Users} 
              title="Pacientes Ilimitados" 
              desc="Cadastre quantos pacientes quiser sem pagar a mais por isso." 
            />
            <FeatureCard 
              icon={Calendar} 
              title="Até 5 Profissionais" 
              desc="Gerencie agendas simultâneas com perfis individuais de acesso." 
            />
            <FeatureCard 
              icon={Activity} 
              title="Catálogo de Serviços" 
              desc="Padronize seus atendimentos, duração e valores personalizados." 
            />
            <FeatureCard 
              icon={DollarSign} 
              title="Controle Financeiro" 
              desc="Acompanhe pagamentos pendentes, lançamentos e fluxo de caixa." 
            />
            <FeatureCard 
              icon={MessageCircle} 
              title="Integração WhatsApp" 
              desc="Conecte seu próprio número escaneando um QR Code, sem custos extras." 
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title="Lembretes Automáticos" 
              desc="Reduza as faltas com lembretes automáticos personalizáveis via WhatsApp." 
            />
          </div>
        </div>
      </section>

      {/* Modules Sections */}
      <section className="py-24 px-6 bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto space-y-24">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Tudo integrado em módulos inteligentes</h2>
            <p className="text-lg text-slate-500">Conheça cada parte do sistema projetado para facilitar o seu dia a dia.</p>
          </div>

          <div className="space-y-32">
            
            {/* Dashboard */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Dashboard Inteligente</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Tenha uma visão geral da sua clínica em tempo real. Acompanhe os próximos agendamentos, consultas do dia, faturamento do mês, cancelamentos, total de pacientes ativos e até mesmo o status de conexão do seu WhatsApp.
                </p>
              </div>
              <div className="flex-1 w-full bg-white rounded-3xl p-6 border shadow-2xl shadow-slate-200/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-sm text-slate-500 mb-1">Consultas Hoje</div><div className="text-2xl font-bold text-blue-600">12</div></div>
                  <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-sm text-slate-500 mb-1">Receita do Mês</div><div className="text-2xl font-bold text-emerald-600">R$ 8.450</div></div>
                  <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-sm text-slate-500 mb-1">Status WhatsApp</div><div className="text-sm font-bold text-emerald-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Conectado</div></div>
                  <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-sm text-slate-500 mb-1">Pacientes Ativos</div><div className="text-2xl font-bold text-slate-800">145</div></div>
                </div>
              </div>
            </div>

            {/* Agenda & Horários */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Agenda e Horários</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Visualização prática de todos os atendimentos e consultas do dia. Configure os horários de funcionamento da clínica com limites precisos para que o agendamento seja organizado e sem conflitos.
                </p>
              </div>
              <div className="flex-1 w-full bg-white rounded-3xl p-6 border shadow-2xl shadow-slate-200/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="font-semibold text-indigo-900">09:00 - Consulta Avaliação</div>
                    <div className="text-sm text-indigo-600 font-medium">Dra. Joelma</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
                    <div className="font-semibold text-slate-700">10:00 - Retorno</div>
                    <div className="text-sm text-slate-500 font-medium">Dra. Joelma</div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl">
                    <div className="font-semibold text-slate-700">11:30 - Procedimento</div>
                    <div className="text-sm text-slate-500 font-medium">Dra. Joelma</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financeiro */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Gestão Financeira</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Controle total sobre o financeiro. Acompanhe clientes em aberto, aplique filtros de datas, gerencie métodos de pagamento e exporte todos os dados facilmente para relatórios em CSV.
                </p>
              </div>
              <div className="flex-1 w-full bg-white rounded-3xl p-6 border shadow-2xl shadow-slate-200/50">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div className="font-bold text-slate-800">Lançamentos Recentes</div>
                  <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Exportar CSV</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">João Silva</span><span className="text-emerald-600 font-bold">R$ 150,00</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">Maria Souza</span><span className="text-amber-500 font-bold">R$ 200,00 (Pendente)</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600 text-sm">Carlos Lima</span><span className="text-emerald-600 font-bold">R$ 350,00</span></div>
                </div>
              </div>
            </div>

            {/* Profissionais & Pacientes */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Profissionais e Pacientes</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  O sistema atende perfeitamente sua clínica: cadastre até 5 profissionais (cada um com visão independente de agendas e financeiro) e pacientes ilimitados com todos os dados essenciais armazenados de forma segura.
                </p>
              </div>
              <div className="flex-1 w-full flex gap-4">
                <div className="flex-1 bg-white rounded-3xl p-6 border shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center gap-2">
                  <div className="text-4xl font-black text-purple-600">5</div>
                  <div className="text-sm font-semibold text-slate-600">Vagas de Profissionais</div>
                </div>
                <div className="flex-1 bg-white rounded-3xl p-6 border shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center gap-2">
                  <div className="text-4xl font-black text-blue-600">∞</div>
                  <div className="text-sm font-semibold text-slate-600">Pacientes Ilimitados</div>
                </div>
              </div>
            </div>

            {/* WhatsApp Individual */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">WhatsApp Individualizado</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Cada profissional da clínica conecta seu próprio WhatsApp de forma independente! Os lembretes são enviados diretamente do número do profissional que fará o atendimento. Tudo 100% personalizável e automático.
                </p>
              </div>
              <div className="flex-1 w-full bg-white rounded-3xl p-6 border shadow-2xl shadow-slate-200/50">
                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">DJ</div>
                      <div>
                        <div className="font-bold text-slate-900">Dra. Joelma</div>
                        <div className="text-xs text-slate-500">Nutricionista</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Conectado
                    </div>
                  </div>
                  <div className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-4">
                    <div className="w-16 h-16 border-4 border-slate-100 border-dashed rounded-lg flex items-center justify-center text-slate-300">
                      QR
                    </div>
                    <div className="text-sm font-medium text-slate-600 flex-1">
                      Instância: <span className="font-bold text-slate-900">Teste</span><br/>
                      <span className="text-xs text-slate-400">Pronto para enviar lembretes personalizados.</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Desconectar
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lembretes e Aniversários */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900">Lembretes e Aniversários</h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Evite faltas com lembretes de consultas pré-configurados ou personalizados do seu jeito. Além disso, colete a data de nascimento e envie felicitações automáticas para que o paciente se sinta especial e lembrado.
                </p>
              </div>
              <div className="flex-1 w-full bg-white rounded-3xl p-6 border shadow-2xl shadow-slate-200/50 space-y-6">
                
                {/* Mockup de Configurações */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Lembrete de Consulta</div>
                      <div className="text-xs text-slate-500">Personalize a antecedência do envio</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                        24 Horas <span className="opacity-50">▼</span>
                      </div>
                      <div className="w-10 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow"></div></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Lembrete de Aniversário</div>
                      <div className="text-xs text-slate-500">Escolha o horário para parabenizar</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                        09:00 <span className="opacity-50">▼</span>
                      </div>
                      <div className="w-10 h-6 bg-blue-600 rounded-full relative shadow-inner cursor-pointer"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow"></div></div>
                    </div>
                  </div>
                </div>

                {/* Exemplo de Mensagem */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 relative mt-2">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-green-50 border border-green-200 rounded-sm rotate-45"></div>
                  <div className="w-8 h-8 rounded-full bg-green-500 shrink-0"></div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">Dra. Joelma (Nutricionista)</div>
                    <div className="text-slate-600 text-sm mt-1 leading-snug">Olá João! Tudo bem? Passando para lembrar da sua consulta de avaliação amanhã às 14:00. Caso precise remarcar, me avise!</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border shadow-xl shadow-slate-200/50 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
            Preço Único
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-black">Plano Essencial</h3>
            <p className="text-slate-500 text-sm">O sistema completo para organizar a sua clínica desde o primeiro dia.</p>
          </div>
          
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-slate-400">R$</span>
            <span className="text-6xl font-black text-slate-900 tracking-tighter">49,90</span>
            <span className="text-slate-500 font-medium">/mês</span>
          </div>

          <ul className="space-y-4 text-left pt-4 border-t border-slate-100">
            <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Acesso total a todas as funcionalidades
            </li>
            <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Integração com WhatsApp
            </li>
            <li className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Suporte via chat
            </li>
          </ul>

          <Link href="/register" className="block w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors">
            Começar 7 dias de graça
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t py-12 text-center text-sm text-slate-500">
        <p>© 2026 AgendaDuo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white border p-6 rounded-2xl space-y-4 hover:shadow-lg transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
