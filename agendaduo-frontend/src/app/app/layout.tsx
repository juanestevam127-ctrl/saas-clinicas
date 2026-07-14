'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Loader2, DollarSign, LogOut, ArrowRight, ShieldAlert } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [billing, setBilling] = useState<any>(null);
  const [checkingBilling, setCheckingBilling] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('agendaduo_user_role');
    if (!role) {
      router.push('/login');
    } else {
      setAuthorized(true);
      fetchBillingStatus();
    }
  }, [router]);

  const fetchBillingStatus = async () => {
    try {
      const { data } = await api.get('/billing/status');
      setBilling(data);
      if (data.clinica?.planoExpiraEm) {
        localStorage.setItem('agendaduo_trial_ends_at', data.clinica.planoExpiraEm);
      }
    } catch (e) {
      console.error('Erro ao buscar status de cobrança', e);
    } finally {
      setCheckingBilling(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await api.post('/billing/checkout');
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        toast.success('Abri o link de pagamento do Asaas em uma nova guia!');
      } else {
        toast.error('Erro ao gerar checkout');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conectar ao Asaas');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!authorized || checkingBilling) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-400 mt-2 font-medium">Verificando credenciais e assinatura...</span>
      </div>
    );
  }

  const isExpired = billing?.isTrialExpired || billing?.clinica?.planoStatus === 'atrasado';

  if (isExpired) {
    const isOverdue = billing?.clinica?.planoStatus === 'atrasado';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white rounded-3xl border shadow-xl shadow-slate-200/50 p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isOverdue ? 'Mensalidade em Atraso' : 'Período de Teste Expirado'}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {isOverdue
              ? 'Identificamos que a sua assinatura mensal do AgendaDuo está vencida. Para reestabelecer o acesso aos dados da sua clínica, efetue o pagamento da fatura.'
              : 'Seus 7 dias gratuitos chegaram ao fim. Para continuar usando o AgendaDuo e gerenciar suas consultas, você precisa assinar o plano.'}
          </p>
          
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Resumo do Plano</span>
              <span>Mensal</span>
            </div>
            <div className="border-t border-slate-200/60 my-1"></div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Plano Base (3 profissionais)</span>
              <span>R$ 49,90</span>
            </div>
            {billing?.extraProfessionals > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>{billing.extraProfessionals} Profissional(is) extra(s)</span>
                <span>+ R$ {(billing.extraProfessionals * 19.90).toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="border-t border-slate-200/60 my-1"></div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-700">Valor Total</span>
              <span className="text-2xl font-black text-slate-900">
                R$ {billing?.totalPrice ? billing.totalPrice.toFixed(2).replace('.', ',') : '49,90'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando Pagamento...
              </>
            ) : (
              <>
                Efetuar Pagamento
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto mt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
