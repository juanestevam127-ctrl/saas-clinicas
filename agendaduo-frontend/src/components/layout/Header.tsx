'use client';

import { useState, useEffect } from 'react';
import { User, LogOut, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMasterPath = pathname === '/app/master-clinicas';
  const [userName, setUserName] = useState('Usuário');
  const [userRole, setUserRole] = useState('admin');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleProfileChange = () => {
      const name = localStorage.getItem('agendaduo_user_name') || 'Usuário';
      const role = localStorage.getItem('agendaduo_user_role') || 'admin';
      setUserName(name);
      setUserRole(role);
    };

    handleProfileChange();
    window.addEventListener('auth-profile-changed', handleProfileChange);
    return () => window.removeEventListener('auth-profile-changed', handleProfileChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('agendaduo_user_role');
    localStorage.removeItem('agendaduo_user_profissional_id');
    localStorage.removeItem('agendaduo_clinica_id');
    localStorage.removeItem('agendaduo_user_name');
    
    // Dispara evento para limpar os dados de escopo em outras abas
    window.dispatchEvent(new Event('auth-profile-changed'));
    
    router.push('/login');
  };

  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu (Mobile Only) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-slate-500 hidden sm:block">
          Bem-vindo de volta!
        </div>
      </div>
      <div className="flex items-center gap-4 relative">
        
        {/* User Button */}
        <div 
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-blue-50/60 hover:bg-blue-100/80 cursor-pointer transition-all border border-blue-100"
        >
          <span className="text-xs font-bold text-blue-700 hidden sm:inline">
            {isMasterPath ? 'Master Admin' : userName}
          </span>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Custom Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop click closer */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            
            <div className="absolute right-0 top-12 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {isMasterPath ? 'Master Admin' : userName}
                </p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                  {isMasterPath ? '🛡️ Painel Master' : (userRole === 'admin' ? '🔑 Administrador' : '🩺 Profissional')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 font-bold transition-all text-left border-none cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                Sair do Sistema
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
