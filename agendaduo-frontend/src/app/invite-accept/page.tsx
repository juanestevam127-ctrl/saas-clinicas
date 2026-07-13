'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Key, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function InviteAcceptForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profId = searchParams.get('profId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);
  const [clinicaId, setClinicaId] = useState('');

  useEffect(() => {
    if (!profId) {
      setError('Código do convite não informado na URL.');
      setLoading(false);
      return;
    }
    // Limpa qualquer sessão antiga persistida para evitar conflitos de papéis
    localStorage.removeItem('agendaduo_logged_role');
    localStorage.removeItem('agendaduo_user_role');
    localStorage.removeItem('agendaduo_user_profissional_id');
    localStorage.removeItem('agendaduo_user_name');
    
    fetchInviteInfo();
  }, [profId]);

  const fetchInviteInfo = async () => {
    try {
      const { data } = await api.get(`/profissionais/convite-info/${profId}`);
      
      // Tenta parsear bio para achar email
      let emailFound = '';
      try {
        const meta = JSON.parse(data.bio || '{}');
        emailFound = meta.emailInvite || '';
      } catch {}

      if (!emailFound) {
        setError('E-mail associado a este convite não foi encontrado.');
        return;
      }

      setNome(data.nome);
      setEmail(emailFound);
      setClinicaId(data.clinicaId || '00000000-0000-0000-0000-000000000000');
    } catch (err: any) {
      setError('Este convite é inválido ou já expirou.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) return toast.error('Digite a sua senha');
    if (senha.length < 6) return toast.error('A senha deve conter no mínimo 6 caracteres');
    if (senha !== confirmarSenha) return toast.error('As senhas não coincidem');

    setSaving(true);
    try {
      await api.post('/profissionais/aceitar-convite', {
        id: profId,
        senha,
      });
      setSuccess(true);
      toast.success('Senha criada e convite aceito com sucesso!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao aceitar convite.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Validando seu convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white border rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Convite Inválido</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white border rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-5">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Cadastro Concluído!</h2>
          <p className="text-sm text-slate-500">
            Parabéns, <strong>{nome}</strong>! Sua senha foi cadastrada no Supabase Auth e seu acesso está ativo.
          </p>
          <button
            onClick={() => {
              // Limpa e registra a nova sessão do profissional de forma completa
              localStorage.setItem('agendaduo_logged_role', 'profissional');
              localStorage.setItem('agendaduo_user_role', 'profissional');
              localStorage.setItem('agendaduo_user_profissional_id', profId!);
              localStorage.setItem('agendaduo_user_name', nome);
              localStorage.setItem('agendaduo_clinica_id', clinicaId);
              window.dispatchEvent(new Event('auth-profile-changed'));
              router.push('/');
            }}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:opacity-90"
          >
            Entrar no Painel Profissional
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Crie seu Acesso</h2>
          <p className="text-xs text-slate-500">
            Olá, <strong>{nome}</strong>! Defina a sua senha para ativar sua conta na clínica.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Seu E-mail</Label>
            <Input value={email} disabled className="bg-slate-50 text-slate-500" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Crie uma Senha *</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-500">Confirme a Senha *</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="password"
                required
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                className="pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Ativar Meu Cadastro'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Carregando convite...</p>
      </div>
    }>
      <InviteAcceptForm />
    </Suspense>
  );
}
