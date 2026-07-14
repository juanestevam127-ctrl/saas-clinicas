'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, Briefcase, Activity, DollarSign, MessageCircle, Settings, LayoutDashboard, ChevronRight, CreditCard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { toast } from 'sonner';

const navItems = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Agenda', href: '/app/agenda', icon: Calendar },
  { name: 'Pacientes', href: '/app/pacientes', icon: Users },
  { name: 'Profissionais', href: '/app/profissionais', icon: Briefcase, adminOnly: true },
  { name: 'Serviços', href: '/app/servicos', icon: Activity },
  { name: 'Financeiro', href: '/app/financeiro', icon: DollarSign },
  { name: 'WhatsApp', href: '/app/whatsapp', icon: MessageCircle },
  { name: 'Assinatura', href: '/app/plano', icon: CreditCard, adminOnly: true },
  { name: 'Configurações', href: '/app/configuracoes', icon: Settings, adminOnly: true },
];

export function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [loggedRole, setLoggedRole] = useState<'admin' | 'profissional'>('admin');
  const [userRole, setUserRole] = useState<'admin' | 'profissional'>('admin');
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [adminName, setAdminName] = useState<string>('Clínica');
  const [adminSpec, setAdminSpec] = useState<string>('-');

  useEffect(() => {
    const savedLoggedRole = (localStorage.getItem('agendaduo_logged_role') as 'admin' | 'profissional') || 'admin';
    const savedRole = (localStorage.getItem('agendaduo_user_role') as 'admin' | 'profissional') || 'admin';
    let savedProfId = localStorage.getItem('agendaduo_user_profissional_id') || '';
    const savedAdminName = localStorage.getItem('agendaduo_user_name') || 'Clínica';
    const savedAdminSpec = localStorage.getItem('agendaduo_user_especialidade') || '-';
    
    if (savedRole === 'admin') {
      const adminProfId = localStorage.getItem('agendaduo_admin_profissional_id') || '';
      if (adminProfId && !savedProfId) {
        savedProfId = adminProfId;
        localStorage.setItem('agendaduo_user_profissional_id', adminProfId);
      }
    }
    
    setLoggedRole(savedLoggedRole);
    setUserRole(savedRole);
    setSelectedProfissionalId(savedProfId);
    setAdminName(savedAdminName);
    setAdminSpec(savedAdminSpec);

    // Carrega profissionais cadastrados para o seletor de perfil
    api.get('/profissionais').then(res => {
      setProfissionais(res.data);
      
      // Auto-detectar e restaurar o ID profissional do administrador se estiver faltando
      const adminProfId = localStorage.getItem('agendaduo_admin_profissional_id');
      if (!adminProfId && res.data?.length > 0) {
        const adminNameLower = savedAdminName.toLowerCase();
        // Tenta achar pelo nome correspondente, senão cai no primeiro cadastrado
        const match = res.data.find((p: any) => 
          p.nome.toLowerCase().includes(adminNameLower) || 
          adminNameLower.includes(p.nome.toLowerCase())
        );
        const bestId = match?.id || res.data[0].id;
        localStorage.setItem('agendaduo_admin_profissional_id', bestId);
        
        const currentRole = localStorage.getItem('agendaduo_user_role') || 'admin';
        if (currentRole === 'admin') {
          localStorage.setItem('agendaduo_user_profissional_id', bestId);
          setSelectedProfissionalId(bestId);
          window.dispatchEvent(new Event('auth-profile-changed'));
        }
      }
    }).catch(() => {});

    // Escuta evento de mudança de perfil externamente se houver
    const handleUpdate = () => {
      setLoggedRole((localStorage.getItem('agendaduo_logged_role') as any) || 'admin');
      setUserRole((localStorage.getItem('agendaduo_user_role') as any) || 'admin');
      setSelectedProfissionalId(localStorage.getItem('agendaduo_user_profissional_id') || '');
      setAdminName(localStorage.getItem('agendaduo_user_name') || 'Clínica');
      setAdminSpec(localStorage.getItem('agendaduo_user_especialidade') || '-');
    };

    window.addEventListener('auth-profile-changed', handleUpdate);
    return () => window.removeEventListener('auth-profile-changed', handleUpdate);
  }, []);

  const handleRoleChange = (role: 'admin' | 'profissional', profId: string = '') => {
    let targetProfId = profId;
    if (role === 'admin') {
      targetProfId = localStorage.getItem('agendaduo_admin_profissional_id') || '';
    }
    localStorage.setItem('agendaduo_user_role', role);
    localStorage.setItem('agendaduo_user_profissional_id', targetProfId);
    setUserRole(role);
    setSelectedProfissionalId(targetProfId);
    window.dispatchEvent(new Event('auth-profile-changed'));
    
    const profName = profissionais.find(p => p.id === targetProfId)?.nome || 'Profissional';
    toast.success(`Visualizando como: ${role === 'admin' ? 'Administrador' : profName}`);
  };

  return (
    <aside className={cn(
      "w-64 border-r bg-white/95 backdrop-blur-xl h-screen fixed lg:sticky top-0 flex flex-col shadow-xl lg:shadow-sm shrink-0 z-50 transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 shrink-0">
        <div className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          AgendaDuo
        </div>
      </div>

      {/* Profile Access Level Selector */}
      {loggedRole === 'admin' && (
        <div className="px-4 py-3.5 border-b bg-slate-50/50 shrink-0">
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Nível de Acesso (Perfil)
          </label>
          <select
            value={userRole === 'admin' ? 'admin' : `profissional:${selectedProfissionalId}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'admin') {
                handleRoleChange('admin');
              } else {
                const profId = val.split(':')[1];
                handleRoleChange('profissional', profId);
              }
            }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="admin">🔑 Administrador (Clínica)</option>
            {profissionais.map(p => (
              <option key={p.id} value={`profissional:${p.id}`}>
                🩺 {p.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || userRole === 'admin')
          .map((item) => {
            const isActive = item.href === '/app' 
              ? pathname === '/app' 
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <item.icon
                  className={cn(
                    'w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span className="flex-1 text-xs">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
      </nav>

      {/* Footer / Tenant info */}
      <div className="p-3 border-t shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {userRole === 'admin' ? 'A' : (profissionais.find(p => p.id === selectedProfissionalId)?.nome?.charAt(0) || 'P')}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {userRole === 'admin' ? `Adm (${adminName})` : (profissionais.find(p => p.id === selectedProfissionalId)?.nome || 'Profissional')}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {userRole === 'admin' ? adminSpec : (profissionais.find(p => p.id === selectedProfissionalId)?.especialidade || '-')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
