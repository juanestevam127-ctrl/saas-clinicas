'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Loader2, CheckCircle2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NovaSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    // Verifica se há hash na URL (típico de recovery) ou se está logado
    const checkSession = async () => {
      const db = getSupabase();
      const { data: { session } } = await db.auth.getSession();
      
      // O Supabase Auth loga o usuário automaticamente ao clicar no link de recovery
      if (!session && !window.location.hash.includes('type=recovery')) {
        toast.error('Link de recuperação inválido ou expirado.');
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) return toast.error('A senha deve ter no mínimo 6 caracteres.');
    if (senha !== confirmaSenha) return toast.error('As senhas não coincidem.');

    setLoading(true);
    try {
      const db = getSupabase();
      const { error } = await db.auth.updateUser({ password: senha });
      
      if (error) throw error;

      setSucesso(true);
      toast.success('Senha atualizada com sucesso!');
      
      // Desloga por segurança para forçar login com a nova senha
      await db.auth.signOut();
      localStorage.clear();
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
        
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Criar Nova Senha</h2>
          <p className="text-xs text-slate-500">
            {sucesso 
              ? 'Sua senha foi redefinida com segurança.' 
              : 'Digite sua nova senha de acesso.'}
          </p>
        </div>

        {sucesso ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center text-emerald-500">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <p className="text-sm font-medium text-slate-700">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Nova Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">Confirmar Nova Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmaSenha}
                  onChange={e => setConfirmaSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="flex h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                'Salvar nova senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
