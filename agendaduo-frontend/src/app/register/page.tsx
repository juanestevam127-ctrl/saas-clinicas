'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, Mail, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('agendaduo_user_role');
    if (role) {
      router.push('/app');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return toast.error('Preencha todos os campos!');
    if (senha.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres.');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { email, senha });
      
      // Salva no localStorage as chaves de sessão simulada
      localStorage.setItem('agendaduo_logged_role', data.role);
      localStorage.setItem('agendaduo_user_role', data.role);
      localStorage.setItem('agendaduo_user_profissional_id', data.profissionalId || '');
      if (data.role === 'admin') {
        localStorage.setItem('agendaduo_admin_profissional_id', data.profissionalId || '');
      }
      localStorage.setItem('agendaduo_clinica_id', data.clinicaId);
      localStorage.setItem('agendaduo_user_name', data.nome || 'Usuário');
      if (data.trialEndsAt) localStorage.setItem('agendaduo_trial_ends_at', data.trialEndsAt);

      window.dispatchEvent(new Event('auth-profile-changed'));

      toast.success('Conta criada com sucesso! Redirecionando para a configuração inicial...');
      
      // Redireciona para o onboarding em vez do /app direto
      router.push('/onboarding');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md shadow-blue-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Criar sua conta</h2>
          <p className="text-xs text-slate-400">Teste grátis por 7 dias. Sem cartão de crédito.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@clinica.com"
                className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Senha</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Crie uma senha forte"
                className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Criando conta...
              </>
            ) : (
              <>
                Criar Minha Conta <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Já tem uma conta? Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
