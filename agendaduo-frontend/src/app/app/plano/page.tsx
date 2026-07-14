'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Calendar, CheckCircle, ShieldAlert, Loader2, ArrowUpRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function PlanoPage() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      const { data } = await api.get('/billing/status');
      setBilling(data);
    } catch (e) {
      toast.error('Erro ao carregar dados do plano.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await api.post('/billing/checkout');
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        toast.success('Redirecionando para o portal de faturamento Asaas!');
      } else {
        toast.error('Erro ao gerar checkout');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao conectar ao Asaas');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const planoStatus = billing?.clinica?.planoStatus || 'trial';
  const isTrial = planoStatus === 'trial';
  const isOverdue = planoStatus === 'atrasado';
  const isActive = planoStatus === 'ativo';

  const formattedExpiration = billing?.clinica?.planoExpiraEm
    ? new Date(billing.clinica.planoExpiraEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meu Plano</h1>
        <p className="text-slate-500 mt-1 text-sm">Gerencie sua assinatura, limites e faturamento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white border rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Plano</div>
            <div className="flex items-center gap-2">
              {isActive ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> Assinatura Ativa
                </div>
              ) : isOverdue ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200 animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5" /> Atrasada / Bloqueada
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  <Calendar className="w-3.5 h-3.5" /> Período de Teste
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">
              {isTrial ? 'Expira em' : 'Próxima renovação em'}
            </div>
            <div className="text-lg font-bold text-slate-700">{formattedExpiration}</div>
          </div>
        </div>

        {/* Professionals Card */}
        <div className="bg-white border rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profissionais</div>
            <div className="text-3xl font-black text-slate-900">
              {billing?.totalProfessionals} <span className="text-sm text-slate-500 font-medium">cadastrados</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 font-medium">Uso do limite base (3)</div>
            <div className="text-xs text-slate-500 font-bold">
              {billing?.extraProfessionals > 0 
                ? `+${billing.extraProfessionals} profissional(is) extra(s)` 
                : 'Dentro do limite básico do plano'}
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white border rounded-3xl p-6 shadow-xl shadow-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Mensal Atual</div>
            <div className="text-3xl font-black text-blue-600">
              R$ {billing?.totalPrice ? billing.totalPrice.toFixed(2).replace('.', ',') : '49,90'}
              <span className="text-xs text-slate-500 font-medium block mt-1">
                {billing?.extraProfessionals > 0 
                  ? `Inclui R$ ${(billing.extraProfessionals * 19.90).toFixed(2).replace('.', ',')} de adicionais` 
                  : 'Preço base sem adicionais'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 font-medium leading-tight">
              Base: R$ 49,90 (até 3 profs).<br/>Extra: R$ 19,90 por profissional a mais.
            </div>
          </div>
        </div>
      </div>

      {/* Main Billing Actions Box */}
      <div className="bg-white border rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-200/50">
        <div className="max-w-xl space-y-6">
          <h3 className="text-xl font-bold text-slate-900">Gerenciar Faturamento</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Nós utilizamos o **Asaas** como gateway oficial de pagamentos. Ao clicar abaixo, você será redirecionado para a nossa fatura de assinatura para escolher pagar por Cartão de Crédito, PIX ou Boleto Bancário.
          </p>

          <button
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-70 cursor-pointer"
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                Carregando Fatura...
              </>
            ) : (
              <>
                <CreditCard className="w-4.5 h-4.5" />
                {isActive ? 'Acessar Portal de Pagamento' : 'Assinar Agora'}
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
