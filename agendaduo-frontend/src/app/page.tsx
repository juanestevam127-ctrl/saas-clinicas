'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Users, MessageCircle, DollarSign, Clock, CheckCircle2, 
  ArrowRight, ShieldCheck, X, Check, HelpCircle, Plus, Star, Gift, 
  MessageSquare, Settings, Sparkles, UserCheck, Heart, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// Custom SVG Logo for MarcAI matching the uploaded identity
function MarcAiLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5 font-sans">
      <div className="relative shrink-0 select-none">
        {/* Main Logo Icon (Calendar outline + Checkmark) */}
        <svg className={`${className}`} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="26" height="23" rx="6" stroke="url(#logoGrad)" strokeWidth="2.8" />
          <path d="M9 3V7" stroke="url(#logoGrad)" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M23 3V7" stroke="url(#logoGrad)" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M3 13H29" stroke="url(#logoGrad)" strokeWidth="2.8" />
          <path d="M10 20.5L14 24.5L22 16.5" stroke="url(#logoGrad)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="logoGrad" x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Floating Chat Bubble Icon */}
        <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-gradient-to-br from-blue-600 to-violet-600 rounded-full border border-white flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll for navbar styles
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect to dashboard if session exists
  useEffect(() => {
    const role = localStorage.getItem('agendaduo_user_role');
    if (role) {
      router.push('/app');
    }
  }, [router]);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-700 selection:bg-blue-600 selection:text-white">
      
      {/* ---------------- NAVBAR ---------------- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3.5 shadow-sm shadow-slate-100/50' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/">
            <MarcAiLogo className="w-7 h-7" />
          </Link>

          {/* Center navigation */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#produto" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Produto</a>
            <a href="#recursos" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Recursos</a>
            <a href="#como-funciona" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Como funciona</a>
            <a href="#para-quem-e" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Público</a>
            <a href="#precos" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Preços</a>
            <a href="#faq" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">FAQ</a>
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider px-3 py-2">
              Entrar
            </Link>
            <Link href="/register" className="text-xs font-bold text-white bg-blue-600 px-4.5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 hover:shadow-lg uppercase tracking-wider">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------------- SEÇÃO 01: HERO ---------------- */}
      <section id="hero" className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-50">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              ✨ Atendimento inteligente para o seu negócio
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Seu negócio agendado.<br />
              Seu cliente lembrado.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Tudo no automático.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              O MarcAI organiza seus clientes e agendamentos e automatiza o relacionamento pelo WhatsApp, para você economizar tempo e não perder oportunidades.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
              <Link href="/register" className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:shadow-2xl transition-all text-sm flex items-center justify-center gap-2">
                Começar grátis <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#como-funciona" className="w-full sm:w-auto px-7 py-4 bg-white border hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-colors text-sm flex items-center justify-center gap-2">
                Conhecer o MarcAI
              </a>
            </div>

            <p className="text-xs text-slate-400 font-bold pt-1.5 flex items-center justify-center lg:justify-start gap-1.5">
              <span>7 dias grátis</span> • <span>Depois R$ 49,90/mês</span> • <span>Sem compromisso</span>
            </p>
          </div>

          {/* Right Dashboard Mockup */}
          <div className="lg:col-span-6 relative z-10 max-w-xl mx-auto lg:max-w-none">
            {/* Main Mockup Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-6 space-y-5 relative">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Painel do Meu Negócio</h4>
                    <p className="text-[9px] text-slate-400">MarcAI Dashboard</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 font-bold">WhatsApp Ativo</span>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Agenda Hoje</span>
                  <span className="text-lg font-black text-slate-800">8 Clientes</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Confirmados</span>
                  <span className="text-lg font-black text-emerald-600">92%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Lembretes</span>
                  <span className="text-lg font-black text-blue-600">14 Enviados</span>
                </div>
              </div>

              {/* Mini Calendar View */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Atendimentos do Dia</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-blue-900 truncate">Ana Paula (Drenagem Estética)</p>
                      <p className="text-[9px] text-blue-700">14:00 - Prof. Paula</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-full">Lembrete Enviado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-900 truncate">Bruno Santos (Corte & Barba)</p>
                      <p className="text-[9px] text-emerald-700">15:00 - Prof. Lucas</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">Confirmado</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl opacity-75">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">Carlos Eduardo (Personal Session)</p>
                      <p className="text-[9px] text-slate-400">16:30 - Prof. Marcelo</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-full">Aguardando</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Widgets */}
            <div className="absolute -top-5 -left-6 bg-white border rounded-xl py-2 px-3 shadow-lg flex items-center gap-2 animate-bounce duration-1000">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-3 h-3 stroke-[3]" /></div>
              <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">✓ Agendamento confirmado</span>
            </div>
            <div className="absolute top-1/2 -right-8 bg-white border rounded-xl py-2.5 px-3.5 shadow-lg flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><MessageCircle className="w-3 h-3" /></div>
              <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">💬 Lembrete enviado</span>
            </div>
            <div className="absolute -bottom-4 -left-3 bg-white border rounded-xl py-2.5 px-3.5 shadow-lg flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /></div>
              <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">⭐ Avaliação recebida</span>
            </div>
            <div className="absolute bottom-12 -right-4 bg-white border rounded-xl py-2 px-3 shadow-lg flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><Gift className="w-3 h-3" /></div>
              <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap">🎂 Aniversário hoje</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 02: SOCIAL PROOF / TRUST FAIXA ---------------- */}
      <section className="bg-white border-y py-12 px-4">
        <div className="max-w-[1200px] mx-auto space-y-6 text-center">
          <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Feito para quem vive de atender clientes.</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs font-bold text-slate-600">
            {["Barbearias", "Salões de Beleza", "Clínicas de Estética", "Dentistas", "Psicólogos", "Fisioterapeutas", "Personal Trainers", "Profissionais Autônomos", "Estúdios de Tattoo"].map((tag, idx) => (
              <span key={idx} className="bg-slate-100/80 border px-3.5 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-400 italic">Uma plataforma para negócios de todos os tamanhos.</p>
        </div>
      </section>

      {/* ---------------- SEÇÃO 03: O PROBLEMA ---------------- */}
      <section className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Você começou um negócio para atender clientes.<br />
              Não para passar o dia respondendo mensagens.
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-semibold">Enquanto você trabalha, seu celular não para.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Visual Chat Accumulator */}
            <div className="md:col-span-6 space-y-3 max-w-md mx-auto w-full">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 max-w-[80%] shadow-sm relative">
                <span className="text-xs text-slate-700 font-bold block">"Oi, tem horário amanhã?"</span>
                <span className="text-[9px] text-slate-400 block text-right mt-1">10:14 AM</span>
              </div>
              <div className="bg-white border rounded-2xl p-3.5 max-w-[80%] ml-auto shadow-sm">
                <span className="text-xs text-slate-700 font-bold block">"Pode confirmar meu horário de sexta?"</span>
                <span className="text-[9px] text-slate-400 block text-right mt-1">11:02 AM</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 max-w-[80%] shadow-sm">
                <span className="text-xs text-slate-700 font-bold block">"Qual era mesmo o horário da minha consulta?"</span>
                <span className="text-[9px] text-slate-400 block text-right mt-1">11:15 AM</span>
              </div>
              <div className="bg-white border rounded-2xl p-3.5 max-w-[80%] ml-auto shadow-sm">
                <span className="text-xs text-slate-700 font-bold block">"Me lembra amanhã por favor..."</span>
                <span className="text-[9px] text-slate-400 block text-right mt-1">11:45 AM</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 max-w-[80%] shadow-sm">
                <span className="text-xs text-slate-700 font-bold block">"Posso remarcar o sábado?"</span>
                <span className="text-[9px] text-slate-400 block text-right mt-1">12:05 PM</span>
              </div>
            </div>

            {/* Problem Bullet List */}
            <div className="md:col-span-6 space-y-6">
              <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                Quando você percebe, passou mais tempo organizando a agenda do que cuidando do seu negócio.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Horários esquecidos", desc: "Clientes que marcam e esquecem de aparecer." },
                  { title: "Mensagens repetitivas", desc: "Copiar e colar o mesmo texto de confirmação toda hora." },
                  { title: "WhatsApp lotado", desc: "Infinidade de conversas abertas pendentes de agendamento." },
                  { title: "Agenda desorganizada", desc: "Anotações espalhadas em papéis, cadernos ou blocos." },
                  { title: "Clientes que somem", desc: "Não lembrar de entrar em contato para novas sessões." },
                  { title: "Avaliações esquecidas", desc: "Seus clientes amam seu serviço mas esquecem de elogiar." },
                ].map((prob, idx) => (
                  <div key={idx} className="bg-white border rounded-2xl p-4 shadow-sm space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span className="text-red-500">⚠️</span> {prob.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{prob.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 04: A TRANSFORMAÇÃO (ANTES/DEPOIS) ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Menos atrito manual. Mais controle.</h2>
            <p className="text-slate-500 text-sm font-semibold">Compare a rotina tradicional com a produtividade do MarcAI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Antes Panel */}
            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 space-y-4">
              <span className="text-[9px] uppercase font-black tracking-wider text-rose-600 bg-rose-100/50 px-3 py-1 rounded-full">Antes</span>
              <h3 className="text-lg font-bold text-slate-800">Você fazendo tudo manualmente</h3>
              
              <ul className="space-y-3">
                {[
                  "Responder cada cliente individualmente para achar horário",
                  "Organizar a agenda manualmente em papel ou planilhas",
                  "Enviar lembretes no dia anterior um por um",
                  "Procurar histórico do cliente em anotações perdidas",
                  "Pedir avaliações de forma manual ou tímida",
                  "Esquecer de parabenizar no aniversário ou oferecer retorno",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Depois Panel */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 space-y-4 shadow-sm">
              <span className="text-[9px] uppercase font-black tracking-wider text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full">Depois</span>
              <h3 className="text-lg font-bold text-slate-800">MarcAI trabalhando por você</h3>
              
              <ul className="space-y-3">
                {[
                  "Visualização de horários limpa e sem complicação",
                  "Mensagem de aviso enviada no ato do agendamento",
                  "Lembretes automáticos que reduzem faltas em até 85%",
                  "Histórico do cliente organizado e centralizado na nuvem",
                  "Pós-atendimento com solicitação de avaliações automática",
                  "Fidelização contínua com lembrete de aniversário automático",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-bold">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 05: COMO O MARCAI FUNCIONA ---------------- */}
      <section id="como-funciona" className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Do primeiro contato ao próximo agendamento.</h2>
            <p className="text-slate-500 text-sm font-semibold">Conheça o ciclo automatizado do MarcAI que acompanha toda a jornada do seu cliente.</p>
          </div>

          {/* Timeline Process Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Agendamento Criado", desc: "Sua equipe define o dia e o horário do atendimento no painel administrativo." },
              { num: "02", title: "MarcAI Notifica", desc: "Uma mensagem com os detalhes do agendamento é enviada imediatamente via WhatsApp." },
              { num: "03", title: "MarcAI Lembra", desc: "O cliente recebe um lembrete no dia ou horas antes do atendimento." },
              { num: "04", title: "Atendimento Realizado", desc: "Você atende o cliente no horário agendado com toda a organização." },
              { num: "05", title: "Pós-Atendimento", desc: "O MarcAI envia uma mensagem de agradecimento pós-visita automaticamente." },
              { num: "06", title: "Avaliação da Empresa", desc: "O cliente recebe o link para avaliar a sua empresa de forma automatizada." },
              { num: "07", title: "Fidelização e Relacionamento", desc: "Sua empresa parabeniza o cliente no aniversário dele e mantém o relacionamento." }
            ].map((step, idx) => (
              <div key={idx} className="bg-white border rounded-2xl p-5 shadow-sm space-y-3 relative group">
                <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">{step.num}</span>
                <h4 className="text-xs font-black text-slate-800">{step.title}</h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <Link href="/register" className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-200">
              Experimentar de Graça
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 06: WHATSAPP INTEGRATION ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Left */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Seu WhatsApp trabalhando enquanto você trabalha.
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Automatize as mensagens que você envia todos os dias e economize dezenas de horas.
            </p>

            <div className="space-y-3">
              {["Aviso de novo agendamento", "Lembretes pré-atendimento", "Mensagens de pós-venda", "Pesquisas de avaliação", "Parabéns no aniversário"].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Check className="w-4.5 h-4.5 text-emerald-500 stroke-[3]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Chat Simulation Mockup */}
          <div className="lg:col-span-7 bg-slate-900 rounded-[36px] p-4 shadow-2xl relative max-w-sm mx-auto w-full">
            <div className="bg-slate-800 text-white rounded-[28px] overflow-hidden border border-slate-700">
              
              {/* Phone Header */}
              <div className="bg-emerald-800 p-3.5 flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold truncate">MarcAI Notificações</h4>
                  <p className="text-[8px] text-emerald-200">Online</p>
                </div>
              </div>

              {/* Chat Content */}
              <div className="p-4 space-y-4 min-h-[300px] bg-slate-950 font-sans">
                
                {/* Msg 1 */}
                <div className="bg-emerald-900 border border-emerald-800 text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] text-[10px] space-y-1">
                  <p className="leading-relaxed">
                    Olá, Ana! 😊<br />
                    Seu agendamento com a <strong>Marcela</strong> foi cadastrado para amanhã, às <strong>14h</strong>.
                  </p>
                  <span className="text-[7px] text-emerald-300 block text-right">Ontem 18:00</span>
                </div>

                {/* Msg 2 */}
                <div className="bg-emerald-900 border border-emerald-800 text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] text-[10px] space-y-1">
                  <p className="leading-relaxed">
                    Olá, Ana! Seu atendimento é <strong>hoje às 14h</strong>. Esperamos por você! 💙
                  </p>
                  <span className="text-[7px] text-emerald-300 block text-right">Hoje 10:00</span>
                </div>

                {/* Msg 3 */}
                <div className="bg-emerald-900 border border-emerald-800 text-white p-3 rounded-2xl rounded-tl-none max-w-[85%] text-[10px] space-y-1">
                  <p className="leading-relaxed">
                    Olá, Ana! Esperamos que tenha gostado do atendimento. Se puder, avalie nosso espaço no link a seguir: <strong>marcai.co/avaliar</strong> ⭐
                  </p>
                  <span className="text-[7px] text-emerald-300 block text-right">Hoje 16:30</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------- SEÇÃO 07: AGENDA MOCKUP ---------------- */}
      <section className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Uma agenda que entende a rotina do seu negócio.</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto">
              Tenha uma visão clara dos seus atendimentos e pare de depender de anotações espalhadas, planilhas ou conversas soltas no WhatsApp.
            </p>
          </div>

          {/* Calendar interface mockup */}
          <div className="bg-white rounded-3xl border shadow-xl overflow-hidden max-w-3xl mx-auto">
            <div className="bg-slate-50 border-b p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Julho de 2026</span>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white border rounded text-[10px] font-bold text-slate-600">Dia</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold">Semana</span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 border-b text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center bg-slate-50/50">
              <div className="py-2 border-r">Seg 20</div>
              <div className="py-2 border-r">Ter 21</div>
              <div className="py-2 border-r">Qua 22</div>
              <div className="py-2 border-r">Qui 23</div>
              <div className="py-2">Sex 24</div>
            </div>

            <div className="divide-y text-[11px] text-slate-700">
              {[
                { time: "09:00", mon: "Aline (Lash)", tue: "—", wed: "Julia (Micro)", thu: "—", fri: "Rita (Estética)" },
                { time: "11:00", mon: "—", tue: "Bruno (Corte)", wed: "—", thu: "Carla (Unhas)", fri: "—" },
                { time: "14:00", mon: "Daniel (Personal)", tue: "—", wed: "Aline (Lash)", thu: "—", fri: "Daniel (Personal)" },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-5 text-center divide-x divide-slate-100">
                  <div className="py-4 font-bold text-slate-400 bg-slate-50/20">{row.time}</div>
                  <div className={`py-4 px-1 truncate ${row.mon !== '—' ? 'bg-blue-50/70 text-blue-800 font-bold border-l-2 border-l-blue-600' : ''}`}>{row.mon}</div>
                  <div className={`py-4 px-1 truncate ${row.tue !== '—' ? 'bg-purple-50/70 text-purple-800 font-bold border-l-2 border-l-purple-600' : ''}`}>{row.tue}</div>
                  <div className={`py-4 px-1 truncate ${row.wed !== '—' ? 'bg-emerald-50/70 text-emerald-800 font-bold border-l-2 border-l-emerald-600' : ''}`}>{row.wed}</div>
                  <div className={`py-4 px-1 truncate ${row.thu !== '—' ? 'bg-amber-50/70 text-amber-800 font-bold border-l-2 border-l-amber-600' : ''}`}>{row.thu}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 08: CLIENTES (CRM) ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Card Left */}
          <div className="lg:col-span-7 bg-slate-50 border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 max-w-lg mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                JS
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">Julia Silva</h4>
                <p className="text-[10px] text-slate-400">Cliente desde Jan 2026</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="bg-white p-3 border rounded-xl">
                <span className="text-slate-400 block mb-0.5">Último Atendimento</span>
                <span className="font-bold text-slate-700">12/07/2026</span>
              </div>
              <div className="bg-white p-3 border rounded-xl">
                <span className="text-slate-400 block mb-0.5">Próximo Horário</span>
                <span className="font-bold text-blue-600">22/07/2026 às 14:30</span>
              </div>
            </div>

            <div className="bg-white p-3.5 border rounded-xl text-[11px] space-y-1">
              <span className="text-slate-400 block">Observações do Cliente</span>
              <p className="text-slate-600 leading-relaxed font-medium">
                Prefere atendimento em ambientes silenciosos. Costuma realizar serviços de Lash Design com a profissional Rita.
              </p>
            </div>
          </div>

          {/* Text Right */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Conheça melhor quem compra de você.
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Tenha o histórico dos seus clientes organizado, acessível e centralizado para tomar melhores decisões de atendimento.
            </p>
            <p className="text-xs text-slate-400 font-bold border-l-2 border-blue-600 pl-3 italic">
              "Quanto mais você conhece seu cliente, melhor você consegue se relacionar com ele."
            </p>
          </div>

        </div>
      </section>

      {/* ---------------- SEÇÃO 09: AUTOMAÇÕES (WORKFLOW) ---------------- */}
      <section id="automacoes" className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configure uma vez. O MarcAI faz o resto.</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto">
              Monte fluxos automáticos sem precisar programar nada. Veja como o relacionamento se mantém ativo sozinho.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { when: "Novo agendamento cadastrado", then: "Enviar detalhes do horário agendado via WhatsApp" },
              { when: "Faltar tempo para o atendimento", then: "Enviar lembretes automáticos configurados (ex: 24h ou 2h antes)" },
              { when: "Atendimento for finalizado", then: "Enviar convite de avaliação no Google pós-serviço" },
              { when: "Cliente fizer aniversário", then: "Enviar parabéns com mensagem carinhosa automática" },
            ].map((flow, idx) => (
              <div key={idx} className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-blue-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Regra de Automação
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-400 block font-black uppercase">Quando:</span>
                  <p className="text-xs font-extrabold text-slate-800">"{flow.when}"</p>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-black uppercase">Executar ação:</span>
                  <p className="text-xs font-bold text-slate-600">{flow.then}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ---------------- SEÇÃO 11: ANIVERSÁRIOS ---------------- */}
      <section className="py-20 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-800">Não deixe seus clientes esquecerem de você.</h3>
            <p className="text-sm font-semibold text-slate-400 max-w-md">
              Fortaleça o relacionamento com seus clientes em datas importantes mandando um parabéns atencioso no WhatsApp.
            </p>
          </div>
          <div className="md:col-span-5 bg-white border p-5 rounded-2xl shadow-sm space-y-3 max-w-sm mx-auto w-full">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-[10px] font-extrabold text-blue-600">🎂 Mensagem de Aniversário</span>
              <span className="text-[8px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Enviado</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Feliz aniversário, Ana! Toda a equipe deseja um dia incrível e cheio de realizações para você! Que tal aproveitar seu dia para se cuidar?"
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 12: PÓS-ATENDIMENTO ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900">O atendimento termina. O relacionamento não.</h2>
            <p className="text-slate-500 text-sm font-semibold">Continue presente depois que o cliente sair pela porta para garantir que ele retorne.</p>
          </div>

          {/* Sequence flowchart */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-bold text-slate-700">
            <div className="bg-slate-50 border p-4 rounded-xl w-full md:w-auto">Atendimento Finalizado</div>
            <div className="text-slate-400">➔</div>
            <div className="bg-blue-50 text-blue-700 border border-blue-100 p-4 rounded-xl w-full md:w-auto">Agradecimento Automático</div>
            <div className="text-slate-400">➔</div>
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-xl w-full md:w-auto">Pedido de Avaliação</div>
            <div className="text-slate-400">➔</div>
            <div className="bg-purple-50 text-purple-700 border border-purple-100 p-4 rounded-xl w-full md:w-auto">Incentivo a Novo Agendamento</div>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 13: AVALIAÇÕES (REPUTAÇÃO) ---------------- */}
      <section className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Transforme bons atendimentos em boas avaliações.
            </h2>
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Facilite o pedido de avaliações e ajude seu negócio a construir uma excelente reputação online sem esforço manual.
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border rounded-3xl p-6 shadow-sm space-y-4 max-w-md mx-auto w-full">
            <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <MessageSquare className="w-4 h-4 text-blue-600" /> Solicitação de feedback
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
              "Olá, João! 😊 Esperamos que tenha gostado do seu atendimento hoje com o profissional Marcos. Sua opinião é fundamental para nós. Se puder nos avaliar em 1 minuto, clique abaixo:"
            </div>
            
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-blue-200">
              ⭐ Avaliar Nosso Negócio
            </button>
          </div>

        </div>
      </section>

      {/* ---------------- SEÇÃO 14: PARA QUEM É (NICHE GRID) ---------------- */}
      <section id="para-quem-e" className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Feito para quem trabalha com clientes e horários.</h2>
            <p className="text-slate-500 text-sm font-semibold">Toda a flexibilidade que profissionais prestadores de serviços precisam no dia a dia.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { emoji: "💈", title: "Barbearias" },
              { emoji: "💅", title: "Manicures & Nails" },
              { emoji: "💇", title: "Salões de Beleza" },
              { emoji: "👁️", title: "Lash Designers" },
              { emoji: "✨", title: "Clínicas de Estética" },
              { emoji: "🦷", title: "Dentistas" },
              { emoji: "🧠", title: "Psicólogos" },
              { emoji: "🏋️", title: "Personal Trainers" },
              { emoji: "💆", title: "Massagistas" },
              { emoji: "🎨", title: "Tatuadores" },
              { emoji: "📸", title: "Fotógrafos" },
              { emoji: "🩺", title: "Profissionais de Saúde" }
            ].map((niche, idx) => (
              <div key={idx} className="border rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center gap-3">
                <span className="text-2xl">{niche.emoji}</span>
                <span className="text-xs font-black text-slate-800">{niche.title}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 text-center max-w-2xl mx-auto space-y-2">
            <h4 className="text-xs font-black text-blue-900 uppercase">E se o seu negócio não está aqui?</h4>
            <p className="text-xs font-semibold text-blue-700 leading-relaxed">
              Sem problemas! Se você atende clientes de forma individualizada ou trabalha com marcação de horários na semana, o MarcAI foi feito sob medida para você.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 15: BENEFÍCIOS ---------------- */}
      <section className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mais do que uma agenda.</h2>
            <p className="text-slate-500 text-sm font-semibold">Tudo o que você precisa para alavancar os resultados da sua prestação de serviço.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "Mais tempo livre", desc: "Passe menos tempo com tarefas operacionais e repetitivas de atendimento." },
              { icon: Calendar, title: "Mais organização", desc: "Tenha sua agenda, controle financeiro e clientes centralizados em um só lugar." },
              { icon: UserCheck, title: "Melhor atendimento", desc: "Responda e acompanhe seus clientes de forma profissional via notificações." },
              { icon: MessageCircle, title: "Menos esquecimentos", desc: "Reduza o número de faltas dos clientes enviando lembretes automatizados." },
              { icon: Star, title: "Mais avaliações", desc: "Crie um fluxo recorrente e simples para obter feedbacks e estrelas no Google." },
              { icon: DollarSign, title: "Mais faturamento", desc: "Fidelize clientes existentes para que eles retornem com maior frequência." },
            ].map((ben, idx) => (
              <div key={idx} className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <ben.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">{ben.title}</h4>
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">{ben.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 16: DASHBOARD COMPLETO (DEMO) ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tudo o que acontece no seu negócio, em um só lugar.</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-xl mx-auto">
              Tenha controle absoluto sobre a entrada de receitas, status de atendimentos, andamento da agenda e notificações ativas de WhatsApp.
            </p>
          </div>

          {/* Large Showcase Mockup */}
          <div className="border rounded-[24px] shadow-2xl bg-white overflow-hidden max-w-4xl mx-auto">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] font-mono text-slate-500">app.marcai.co/dashboard</span>
              <div className="w-10" />
            </div>

            <div className="bg-slate-50 p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Sidebar demo */}
              <div className="bg-white border rounded-2xl p-4 space-y-3 hidden md:block">
                <div className="p-2 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs">📅 Agenda</div>
                <div className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs">👥 Clientes</div>
                <div className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs">⚙️ Automação</div>
                <div className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs">💬 WhatsApp</div>
                <div className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs">📊 Indicadores</div>
              </div>

              {/* Main content area demo */}
              <div className="md:col-span-3 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border p-4 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Faturamento Mensal</span>
                    <span className="text-xl font-black text-slate-800">R$ 12.480,00</span>
                  </div>
                  <div className="bg-white border p-4 rounded-2xl">
                    <span className="text-[9px] font-black text-slate-400 block uppercase">Agendamentos Realizados</span>
                    <span className="text-xl font-black text-slate-800">142</span>
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 block uppercase">Últimos Clientes Atendidos</span>
                  <div className="divide-y text-xs text-slate-700">
                    <div className="py-2.5 flex justify-between"><span>Mariana Costa</span><span className="font-bold">R$ 120,00</span></div>
                    <div className="py-2.5 flex justify-between"><span>Pedro Rocha</span><span className="font-bold">R$ 80,00</span></div>
                    <div className="py-2.5 flex justify-between"><span>Beatriz Silva</span><span className="font-bold">R$ 150,00</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 17: ECONOMIA DE TEMPO ---------------- */}
      <section className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900">Quantas horas você perde fazendo isso manualmente?</h2>
            <p className="text-slate-500 text-sm font-semibold max-w-md mx-auto">
              Dezenas de mensagens por semana confirmando presenças, lembrando clientes, organizando reagendamentos.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white border rounded-2xl p-4"><span className="text-xl font-black text-slate-800">120+</span><p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Confirmações/mês</p></div>
            <div className="bg-white border rounded-2xl p-4"><span className="text-xl font-black text-slate-800">180+</span><p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Lembretes/mês</p></div>
            <div className="bg-white border rounded-2xl p-4"><span className="text-xl font-black text-slate-800">60+</span><p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Feedbacks/mês</p></div>
            <div className="bg-white border rounded-2xl p-4"><span className="text-xl font-black text-slate-800">30h+</span><p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Tempo Salvo/mês</p></div>
          </div>

          <p className="text-xs font-bold text-slate-400">Com o MarcAI, boa parte disso acontece automaticamente.</p>
        </div>
      </section>

      {/* ---------------- SEÇÃO 18: EXPERIÊNCIA DO CLIENTE ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900">Seu cliente percebe a diferença.</h2>
            <p className="text-slate-500 text-sm font-semibold">Ofereça uma experiência organizada e de alta qualidade.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-center text-xs font-bold text-slate-700">
            <div className="bg-slate-50 border p-4 rounded-xl">📅 Agendamento Criado</div>
            <div className="bg-slate-50 border p-4 rounded-xl">💬 Detalhes por WhatsApp</div>
            <div className="bg-slate-50 border p-4 rounded-xl">🔔 Recebe Lembrete</div>
            <div className="bg-slate-50 border p-4 rounded-xl">😊 É Atendido</div>
            <div className="bg-slate-50 border p-4 rounded-xl">⭐ Avalia o Serviço</div>
            <div className="bg-slate-50 border p-4 rounded-xl">💙 Continua Conectado</div>
          </div>

          <p className="text-center text-xs text-slate-400 font-bold italic">"Automação para você. Experiência muito melhor para o seu cliente."</p>
        </div>
      </section>

      {/* ---------------- SEÇÃO 19: PREÇO ---------------- */}
      <section id="precos" className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Comece pequeno. Cresça com o MarcAI.</h2>
            <p className="text-slate-500 text-sm sm:text-base font-semibold">
              Tenha uma plataforma completa para organizar seu negócio por menos de R$ 2 por dia.
            </p>
          </div>

          {/* Premium Pricing Card */}
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-2xl p-8 max-w-sm mx-auto text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
              7 Dias Grátis
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-800">Assinatura Profissional</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-base font-bold text-slate-400">R$</span>
                <span className="text-4xl font-black text-slate-800">49,90</span>
                <span className="text-xs font-bold text-slate-400">/mês</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">Cancele quando quiser • Sem fidelidade ou taxas ocultas</p>
            </div>

            <div className="border-t border-slate-100 pt-6 text-left space-y-3.5">
              {[
                "Agenda de atendimentos",
                "Cadastro de clientes",
                "Notificação de agendamentos",
                "Lembretes automáticos via WhatsApp",
                "Mensagens pós-atendimento",
                "Notificações de aniversários",
                "Pesquisa automática de avaliações",
                "Anotações clínicas e observações",
                "Fluxos de automações",
                "Inteligência Artificial inclusa"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link href="/register" className="block w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-95 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 transition-all text-xs uppercase tracking-wider">
              Começar meus 7 dias grátis
            </Link>

            <span className="text-[10px] text-slate-400 font-bold block">Sem compromisso.</span>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 20: COMPARAÇÃO (TABELA) ---------------- */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pare de fazer tudo sozinho.</h2>
            <p className="text-slate-500 text-sm font-semibold">Veja por que o MarcAI é o melhor investimento para sua empresa.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Funcionalidade</th>
                  <th className="py-3 px-4">Fazer Tudo Sozinho</th>
                  <th className="py-3 px-4 text-blue-600">Com o MarcAI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: "Agenda & Calendário", bad: "Manual / Papel", good: "Centralizada e Organizadora" },
                  { feature: "Lembretes de Presença", bad: "Um a um no celular", good: "Automáticos no WhatsApp" },
                  { feature: "Histórico de Clientes", bad: "Perdido em papéis/conversas", good: "Organizado no sistema" },
                  { feature: "Mensagens Pós-visita", bad: "Raramente feitas", good: "Automatizadas pós-atendimento" },
                  { feature: "Pedido de Avaliação", bad: "Esquecido", good: "Automático por link" },
                  { feature: "Notificar Aniversários", bad: "Esquecido", good: "Automático no WhatsApp" }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.feature}</td>
                    <td className="py-3.5 px-4 text-slate-400">{row.bad}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-bold">{row.good}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 21: FAQ (ACCORDION) ---------------- */}
      <section id="faq" className="py-24 px-4 bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dúvidas Frequentes</h2>
            <p className="text-slate-500 text-sm font-semibold">Tire suas principais dúvidas sobre o funcionamento do MarcAI.</p>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              {
                q: "O que é o MarcAI?",
                a: "O MarcAI é uma plataforma de gestão, agendamento, relacionamento e automações projetada para qualquer negócio ou profissional prestador de serviços que trabalha com horários de atendimento."
              },
              {
                q: "Para quais negócios o MarcAI funciona?",
                a: "Funciona para barbearias, salões de beleza, lash e nail designers, esteticistas, tatuadores, dentistas, psicólogos, fisioterapeutas, personal trainers, massagistas e qualquer negócio que atenda clientes com horários marcados."
              },
              {
                q: "O MarcAI é apenas uma agenda?",
                a: "Não! Além do calendário de organização, ele gerencia o cadastro de clientes, envia lembretes e notificações por WhatsApp, parabeniza aniversariantes no aniversário e solicita avaliações pós-atendimento automaticamente."
              },
              {
                q: "Como funcionam os lembretes?",
                a: "Assim que um atendimento é marcado, o MarcAI programa mensagens automáticas no WhatsApp do cliente com as informações do agendamento, ajudando a evitar faltas e horários esquecidos."
              },
              {
                q: "O MarcAI envia mensagens pelo WhatsApp?",
                a: "Sim, você pode conectar o seu próprio número de WhatsApp lendo um QR Code simples, de forma rápida, e deixar a plataforma enviar as notificações em segundo plano."
              },
              {
                q: "Preciso instalar algum programa?",
                a: "Não, o MarcAI é 100% online. Você pode acessar por qualquer celular, tablet ou computador diretamente pelo navegador."
              },
              {
                q: "Preciso entender de tecnologia?",
                a: "De forma alguma! A interface foi desenhada para ser simples, limpa e amigável. A configuração inicial é intuitiva e rápida."
              },

              {
                q: "Posso testar gratuitamente?",
                a: "Sim! Você tem 7 dias de teste completo gratuito, sem precisar cadastrar cartão de crédito."
              },
              {
                q: "Quanto custa após o período de teste?",
                a: "A assinatura profissional custa apenas R$ 49,90 por mês."
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim! Não há fidelidade ou prazo mínimo. Você pode cancelar sua assinatura com apenas um clique diretamente no painel do sistema."
              }
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="bg-white border rounded-2xl overflow-hidden transition-all shadow-sm">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 transition-colors uppercase tracking-wider"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-5 border-t text-xs text-slate-500 leading-relaxed font-semibold">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- SEÇÃO 22: CTA FINAL ---------------- */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-violet-600 text-white relative overflow-hidden text-center">
        
        {/* Floating background blobs */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <span className="inline-block bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full">
            7 dias grátis
          </span>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Seu negócio pode funcionar de forma mais inteligente.
          </h2>

          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed font-medium">
            Organize seus clientes, automatize seus agendamentos e deixe o MarcAI cuidar das tarefas repetitivas.
          </p>

          <div className="pt-4">
            <Link href="/register" className="inline-flex px-8 py-4 bg-white text-blue-600 font-extrabold rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 text-sm uppercase tracking-wider">
              Começar grátis
            </Link>
          </div>

          <p className="text-xs text-blue-200 font-bold">Depois, apenas R$ 49,90/mês. Cancele quando quiser.</p>
        </div>
      </section>

      {/* ---------------- SEÇÃO 23: FOOTER ---------------- */}
      <footer className="bg-white border-t py-16 px-4">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 border-b pb-12">
          
          <div className="md:col-span-4 space-y-4">
            <MarcAiLogo className="w-6 h-6" />
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Mais agendamentos, menos preocupações. A plataforma de gestão completa para profissionais prestadores de serviços.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Produto</h5>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#hero" className="hover:text-blue-600 transition-colors">Recursos</a></li>
              <li><a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como funciona</a></li>
              <li><a href="#precos" className="hover:text-blue-600 transition-colors">Preços</a></li>
              <li><a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Empresa</h5>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><span className="text-slate-400 italic">Sobre nós</span></li>
              <li><span className="text-slate-400 italic">Contato</span></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Legal</h5>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><span className="text-slate-400 italic">Termos de uso</span></li>
              <li><span className="text-slate-400 italic">Privacidade</span></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Redes Sociais</h5>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><span className="text-slate-400 italic">Instagram</span></li>
              <li><span className="text-slate-400 italic">WhatsApp</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-[1200px] mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[10px] text-slate-400 font-bold">
            © 2026 MarcAI. Todos os direitos reservados.
          </span>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-500/50 transition-colors space-y-3 shadow-sm">
      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-xs font-black text-slate-800">{title}</h3>
      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">{desc}</p>
    </div>
  );
}
