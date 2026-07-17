'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, Mail, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // Se o usuário já estiver logado, redireciona para o app
  useEffect(() => {
    const role = localStorage.getItem('agendaduo_user_role');
    if (role) {
      router.push('/app');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return toast.error('Preencha todos os campos!');

    setLoading(true);
    try {
      const { data } = await api.post('/profissionais/login', { email, senha });
      
      // Salva no localStorage as chaves de sessão simulada
      localStorage.setItem('agendaduo_logged_role', data.role);
      localStorage.setItem('agendaduo_user_role', data.role);
      localStorage.setItem('agendaduo_user_profissional_id', data.profissionalId || '');
      if (data.role === 'admin') {
        localStorage.setItem('agendaduo_admin_profissional_id', data.profissionalId || '');
      }
      localStorage.setItem('agendaduo_clinica_id', data.clinicaId || '00000000-0000-0000-0000-000000000000');
      localStorage.setItem('agendaduo_user_name', data.nome || 'Usuário');
      if (data.trialEndsAt) localStorage.setItem('agendaduo_trial_ends_at', data.trialEndsAt);

      if (data.isMaster) {
        localStorage.setItem('agendaduo_is_master', 'true');
        localStorage.setItem('agendaduo_master_email', email);
      } else {
        localStorage.removeItem('agendaduo_is_master');
        localStorage.removeItem('agendaduo_master_email');
      }

      // Avisa as outras abas/componentes da alteração do perfil
      window.dispatchEvent(new Event('auth-profile-changed'));

      toast.success(`Bem vindo de volta, ${data.nome}!`);
      if (data.isMaster) {
        router.push('/app/master-clinicas');
      } else {
        router.push('/app');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
        
        {/* Logo e Título */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-md shadow-blue-200">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">AgendaDuo</h2>
          <p className="text-xs text-slate-400">Acesse o painel com as suas credenciais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* E-mail */}
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

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Senha</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
              </>
            ) : (
              <>
                Entrar no Sistema <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link href="/register" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Ainda não tem uma conta? Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
