import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';
import axios from 'axios';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

const headers = {
  access_token: ASAAS_API_KEY || '',
  'Content-Type': 'application/json',
};

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// POST /api/billing/checkout
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    if (!ASAAS_API_KEY) return err('Chave de API do Asaas não configurada no servidor', 500);

    const { cnpj } = await req.json().catch(() => ({}));

    const db = getSupabase();

    // 1. Obter clínica e dados do plano
    const { data: clinica, error: clinicaError } = await db
      .from(TABLES.clinicas as any)
      .select('nome, cnpj, plano_status, plano_expira_em, asaas_customer_id, asaas_subscription_id')
      .eq('id', cid)
      .single();

    if (clinicaError || !clinica) return err('Clínica não encontrada', 404);

    // Se veio CNPJ no payload, salvar no banco e atualizar variável local
    if (cnpj) {
      await db.from(TABLES.clinicas as any).update({ cnpj }).eq('id', cid);
      (clinica as any).cnpj = cnpj;
    }

    const finalCnpj = (clinica as any).cnpj;
    if (!finalCnpj) {
      return err('CPF ou CNPJ é obrigatório para gerar a assinatura. Por favor, informe-o.');
    }

    // 2. Obter profissionais e email do admin
    const { data: profissionais } = await db
      .from(TABLES.profissionais as any)
      .select('*')
      .eq('clinica_id', cid);

    const adminProf = (profissionais || []).find((p: any) => {
      try {
        const meta = JSON.parse(p.bio || '{}');
        return meta.role === 'admin';
      } catch { return false; }
    });

    let adminEmail = 'admin@agendaduo.com';
    if (adminProf?.bio) {
      try {
        const meta = JSON.parse(adminProf.bio);
        adminEmail = meta.adminEmail || meta.emailInvite || adminEmail;
      } catch {}
    }

    const profCount = profissionais?.length || 0;
    const baseLimit = 3;
    const extraProfs = Math.max(0, profCount - baseLimit);
    const totalPrice = 49.90 + (extraProfs * 19.90);

    // 3. Criar ou obter Cliente Asaas
    let asaasCustomerId = clinica.asaas_customer_id;
    if (!asaasCustomerId) {
      try {
        const customerResp = await axios.post(`${ASAAS_API_URL}/customers`, {
          name: clinica.nome,
          email: adminEmail,
          cpfCnpj: finalCnpj.replace(/\D/g, ''), // Enviar apenas números
        }, { headers });
        asaasCustomerId = customerResp.data.id;

        // Salvar no banco
        await db.from(TABLES.clinicas as any).update({ asaas_customer_id: asaasCustomerId }).eq('id', cid);
      } catch (e: any) {
        const msg = e.response?.data?.errors?.[0]?.description || e.message;
        return err('Erro ao criar cliente no Asaas: ' + msg, 500);
      }
    } else {
      // Atualizar o cliente no Asaas para garantir que ele tem o CPF/CNPJ
      try {
        await axios.post(`${ASAAS_API_URL}/customers/${asaasCustomerId}`, {
          name: clinica.nome,
          email: adminEmail,
          cpfCnpj: finalCnpj.replace(/\D/g, ''),
        }, { headers });
      } catch (e: any) {
        console.error('Erro ao atualizar cliente no Asaas:', e.response?.data || e.message);
      }
    }

    // 4. Criar Assinatura no Asaas se não existir ou atualizar se o preço mudou
    let asaasSubscriptionId = clinica.asaas_subscription_id;
    let checkoutUrl = '';

    const today = new Date();
    const expDate = clinica.plano_expira_em ? new Date(clinica.plano_expira_em) : today;
    const nextDueDate = expDate > today 
      ? expDate.toISOString().split('T')[0] 
      : new Date(today.setDate(today.getDate() + 1)).toISOString().split('T')[0];

    if (!asaasSubscriptionId) {
      try {
        const subResp = await axios.post(`${ASAAS_API_URL}/subscriptions`, {
          customer: asaasCustomerId,
          billingType: 'UNDEFINED',
          value: totalPrice,
          nextDueDate: nextDueDate,
          cycle: 'MONTHLY',
          description: `Assinatura Mensal AgendaDuo - ${profCount} profissionais`,
        }, { headers });
        
        asaasSubscriptionId = subResp.data.id;
        
        // Salvar ID no banco
        await db.from(TABLES.clinicas as any).update({ asaas_subscription_id: asaasSubscriptionId }).eq('id', cid);
      } catch (e: any) {
        const msg = e.response?.data?.errors?.[0]?.description || e.message;
        return err('Erro ao criar assinatura no Asaas: ' + msg, 500);
      }
    } else {
      // Atualizar o valor se mudou por conta do número de profissionais
      try {
        await axios.post(`${ASAAS_API_URL}/subscriptions/${asaasSubscriptionId}`, {
          value: totalPrice,
          description: `Assinatura Mensal AgendaDuo - ${profCount} profissionais`,
        }, { headers });
      } catch {}
    }

    // 5. Buscar a fatura/pagamento pendente para esta assinatura para obter o link de checkout
    try {
      // Pequeno delay para garantir que o Asaas gerou a fatura da assinatura em segundo plano
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentsResp = await axios.get(`${ASAAS_API_URL}/payments?subscription=${asaasSubscriptionId}`, { headers });
      const payments = paymentsResp.data?.data || [];
      const pendingPayment = payments.find((p: any) => p.status === 'PENDING');
      if (pendingPayment) {
        checkoutUrl = pendingPayment.invoiceUrl;
      } else if (payments.length > 0) {
        checkoutUrl = payments[0].invoiceUrl;
      }
    } catch (e: any) {
      // Se falhar em buscar faturas, pegamos o checkoutUrl direto da assinatura (se disponível) ou criamos um fallback
    }

    if (!checkoutUrl) {
      return err('Nenhuma fatura pendente foi encontrada para esta assinatura no Asaas no momento. Aguarde alguns segundos para o processamento e clique em Assinar Novamente.');
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      subscriptionId: asaasSubscriptionId,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
