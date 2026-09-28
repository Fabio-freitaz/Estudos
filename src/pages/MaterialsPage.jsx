import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const mockMaterials = [
  {
    id: '1',
    title: 'Biologia - Membranas',
    created_at: '2026-09-28',
    question_count: 10,
    last_result: '80%',
  },
  {
    id: '2',
    title: 'História - Revolução Industrial',
    created_at: '2026-09-27',
    question_count: 15,
    last_result: '73%',
  },
];

export default function MaterialsPage() {
  const [query, setQuery] = useState('');

  const materials = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return mockMaterials;

    return mockMaterials.filter((material) => material.title.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Meus materiais</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Todos os PDFs</h1>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar material"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 sm:max-w-xs"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {materials.map((material) => (
          <article key={material.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{material.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{material.created_at}</p>
              </div>
              <button type="button" className="text-sm font-medium text-red-500">Excluir</button>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
              <span>{material.question_count} questões</span>
              <span>Último resultado: {material.last_result}</span>
            </div>

            <div className="mt-6 flex gap-3">
              <Link to={`/materials/${material.id}`} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-center font-semibold text-white hover:bg-indigo-500">
                Estudar
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
