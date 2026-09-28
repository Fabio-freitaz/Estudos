import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, FilePlus2, Home, History, LogOut, Menu, UserCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Meus materiais', to: '/materials', icon: BookOpen },
  { label: 'Novo PDF', to: '/materials/new', icon: FilePlus2 },
  { label: 'Histórico', to: '/history', icon: History },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-slate-200 p-2 md:hidden"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label="Abrir menu"
              type="button"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Link to="/dashboard" className="text-xl font-bold text-indigo-600">EstudaPDF</Link>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <UserCircle2 size={18} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{user?.full_name || user?.email || 'Usuário'}</span>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="mt-2 inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
              >
                <LogOut size={16} />
                Sair
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
