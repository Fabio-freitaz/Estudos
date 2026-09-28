import { FilePlus2, NotebookText, CheckCircle2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const stats = [
  { label: 'Materiais', value: '0', icon: NotebookText },
  { label: 'Questões respondidas', value: '0', icon: CheckCircle2 },
  { label: 'Média de acertos', value: '0%', icon: TrendingUp },
  { label: 'Progresso', value: '0%', icon: TrendingUp },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Olá, {user?.full_name || user?.email || 'estudante'}</h1>
          <p className="mt-2 text-slate-600">Continue seus estudos.</p>
        </div>

        <Link to="/materials/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500">
          <FilePlus2 size={18} />
          + Adicionar PDF
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon size={18} className="text-indigo-600" />
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Você ainda não possui materiais.</h2>
        <p className="mt-2 text-slate-500">Adicione seu primeiro PDF para começar.</p>
        <Link to="/materials/new" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
          Adicionar primeiro PDF
        </Link>
      </div>
    </div>
  );
}
