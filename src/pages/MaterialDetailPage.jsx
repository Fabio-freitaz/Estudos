import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MaterialDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const [expandedTopic, setExpandedTopic] = useState(0);
  const [material, setMaterial] = useState(location.state?.material || null);
  const [loading, setLoading] = useState(!location.state?.material);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaterial = async () => {
      if (location.state?.material) {
        setMaterial(location.state.material);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/materials/${id}`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || 'Material indisponível.');
        }

        setMaterial(result?.data || null);
      } catch (fetchError) {
        setError(fetchError?.message || 'Não foi possível carregar o material.');
        setMaterial(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMaterial();
    }
  }, [id, location.state?.material, session?.access_token]);

  const normalizedMaterial = useMemo(() => {
    if (!material) {
      return null;
    }

    const normalizedTopics = (material.topics || []).map((topic, index) => {
      if (typeof topic === 'string') {
        return {
          title: topic,
          explanation: 'Resumo do tema principal do material.',
          example: 'Exemplo didático: relacionado ao conteúdo do material para facilitar a memorização.',
        };
      }

      return {
        title: topic?.title || topic?.name || `Tema ${index + 1}`,
        explanation: topic?.explanation || '',
        example: topic?.example || '',
      };
    });

    return {
      ...material,
      summary: material.summary || 'Resumo do material não disponível.',
      topics: normalizedTopics,
      key_points: material.key_points || ['Principais pontos do conteúdo'],
      questions: material.questions || [],
    };
  }, [material]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Carregando material...</div>;
  }

  if (error || !normalizedMaterial) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">{error || 'Material não encontrado.'}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Material</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{normalizedMaterial.title}</h1>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Resumo</h2>
            <p className="mt-3 leading-7 text-slate-700">{normalizedMaterial.summary}</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900">Principais assuntos</h3>
            <div className="mt-4 space-y-3">
              {(normalizedMaterial.topics || []).map((topic, index) => {
                const isOpen = expandedTopic === index;

                return (
                  <div key={`${normalizedMaterial.id}-topic-${index}`} className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40">
                    <button
                      type="button"
                      onClick={() => setExpandedTopic(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Tema {index + 1}</div>
                        <div className="mt-1 text-base font-bold text-slate-900">{topic.title}</div>
                      </div>
                      <span className="rounded-full bg-white px-2 py-1 text-sm font-semibold text-indigo-600">{isOpen ? 'Fechar' : 'Ver mais'}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-indigo-100 bg-white px-4 py-3">
                        {topic.explanation && <p className="text-sm leading-6 text-slate-700">{topic.explanation}</p>}
                        {topic.example && <p className="mt-3 text-sm italic text-slate-600">Exemplo didático: {topic.example}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900">Pontos importantes</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {(normalizedMaterial.key_points || []).map((point, index) => (
                <li key={`${normalizedMaterial.id}-point-${index}`}>{point}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            to={`/materials/${id}/quiz`}
            state={{ material: normalizedMaterial, questions: normalizedMaterial.questions || [] }}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500"
          >
            Começar questões
          </Link>
        </div>
      </div>
    </div>
  );
}
