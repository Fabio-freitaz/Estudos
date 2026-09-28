import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MaterialsPage() {
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/materials', {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || 'Não foi possível carregar os materiais.');
        }

        setMaterials(result?.data || []);
      } catch (fetchError) {
        setError(fetchError?.message || 'Não foi possível carregar os materiais.');
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token) {
      fetchMaterials();
      return;
    }

    setLoading(false);
    setMaterials([]);
  }, [session?.access_token]);

  const visibleMaterials = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return materials;

    return materials.filter((material) => material.title.toLowerCase().includes(normalized));
  }, [materials, query]);

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

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Carregando materiais...</div>
      ) : visibleMaterials.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">Você ainda não possui materiais.</h2>
          <p className="mt-2 text-slate-500">Adicione seu primeiro PDF para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMaterials.map((material) => (
            <article key={material.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{material.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{material.created_at ? new Date(material.created_at).toLocaleDateString('pt-BR') : 'Data indisponível'}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
                <span>{material.question_count || 0} questões</span>
                <span>{material.status || 'analisado'}</span>
              </div>

              <div className="mt-6 flex gap-3">
                <Link to={`/materials/${material.id}`} state={{ material }} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-center font-semibold text-white hover:bg-indigo-500">
                  Estudar
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
