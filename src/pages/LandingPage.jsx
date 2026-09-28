import { ArrowRight, BrainCircuit, CheckCircle2, FileText, NotebookPen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  { icon: FileText, title: 'Envie seu PDF' },
  { icon: BrainCircuit, title: 'A IA analisa o conteúdo' },
  { icon: NotebookPen, title: 'Estude o resumo' },
  { icon: CheckCircle2, title: 'Teste seus conhecimentos' },
];

const features = [
  'Resumos inteligentes',
  'Questões personalizadas',
  'Gabarito explicado',
  'Histórico de estudos',
  'Progresso',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="text-2xl font-black text-indigo-600">EstudaPDF</div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Login</Link>
          <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">Começar agora</Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              <Sparkles size={16} />
              Aprenda com IA
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Transforme seus PDFs em uma forma inteligente de estudar.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Envie seu material, gere resumos e pratique com questões criadas a partir do conteúdo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-500">
                Começar agora
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700">Entrar</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 p-6 text-white">
              <div className="flex items-center justify-between text-sm text-indigo-100">
                <span>Resumo gerado</span>
                <span>IA</span>
              </div>
              <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-lg font-semibold">Tema principal</p>
                <p className="mt-2 text-sm text-indigo-100">Fundamentos e aplicação do conteúdo em estudo.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-100">Resumo</p>
                  <p className="mt-2 text-xl font-bold">88%</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-indigo-100">Questões</p>
                  <p className="mt-2 text-xl font-bold">10</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Como funciona?</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map(({ icon: Icon, title }, index) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={24} />
                </div>
                <div className="mb-2 text-sm font-semibold text-indigo-600">0{index + 1}</div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900">Recursos que ajudam a estudar melhor</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {features.map((feature) => (
              <div key={feature} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="font-semibold text-slate-700">{feature}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
