import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, FilePlus2, History, Home, LogOut, Menu, Moon, Sun, UserCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    document.body.style.background = darkMode ? '#020817' : '#f8fafc';
    document.body.style.color = darkMode ? '#e2e8f0' : '#0f172a';
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-sm transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white/90'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className={`rounded-lg border p-2 md:hidden ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-700'}`}
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
                    isActive
                      ? darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                      : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}
              aria-label="Alternar modo noturno"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span className="hidden sm:inline">{darkMode ? 'Claro' : 'Noturno'}</span>
            </button>

            <div className="hidden items-center gap-2 md:flex">
              <UserCircle2 size={18} className={darkMode ? 'text-slate-300' : 'text-slate-500'} />
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {user?.full_name || user?.email || 'Usuário'}
              </span>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className={`border-t md:hidden ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                        : darkMode ? 'text-slate-300' : 'text-slate-600'
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
                className={`mt-2 inline-flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
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
