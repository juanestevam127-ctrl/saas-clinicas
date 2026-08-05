'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Informe o e-mail cadastrado.');

    setLoading(true);
    try {
      await api.post('/auth/recuperar-senha', { email });
      setSucesso(true);
      toast.success('E-mail de recuperação enviado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ocorreu um erro ao tentar recuperar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
        
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Recuperar Senha</h2>
          <p className="text-xs text-slate-500">
            {sucesso 
              ? 'Verifique a sua caixa de entrada e spam.' 
              : 'Informe seu e-mail para receber o link de redefinição.'}
          </p>
        </div>

        {sucesso ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm text-center font-medium">
              Enviamos um e-mail para <br/><span className="font-bold">{email}</span><br/> com as instruções para redefinir sua senha.
            </div>
            <Link 
              href="/login" 
              className="w-full py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
            </Link>
          </div>
        ) : (
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
                  placeholder="nome@email.com.br"
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <>Enviar link de recuperação <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>
        )}

        {!sucesso && (
          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
