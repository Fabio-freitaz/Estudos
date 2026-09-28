import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

const mockMaterial = {
  id: 'material-demo',
  title: 'Biologia - Membranas',
  summary: 'As membranas celulares são estruturas fundamentais para a proteção, transporte e comunicação entre o ambiente interno e externo da célula. Elas permitem o controle seletivo do que entra e sai, mantendo a homeostase e favorecendo processos vitais como a absorção e a eliminação de substâncias.',
  topics: [
    { title: 'Estrutura da membrana', explanation: 'A membrana é uma camada seletiva que delimita a célula e regula as trocas com o ambiente.', example: 'Exemplo didático: pense na membrana como uma porta seletiva que deixa entrar o que é necessário.' },
    { title: 'Transporte celular', explanation: 'A célula movimenta substâncias por processos como difusão, osmose e transporte ativo.', example: 'Exemplo didático: quando se coloca sal em uma solução, a água se desloca para manter o equilíbrio.' },
    { title: 'Comunicação celular', explanation: 'A membrana também participa da resposta da célula ao ambiente e da interação com outras células.', example: 'Exemplo didático: uma célula recebe sinais e responde de acordo com o que precisa.' },
  ],
  key_points: ['Membrana é seletivamente permeável', 'Proteínas desempenham funções diversas', 'Difusão e osmose são processos importantes'],
  questions: [],
};

export default function MaterialDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [expandedTopic, setExpandedTopic] = useState(0);
  const material = useMemo(() => {
    const stateMaterial = location.state?.material || mockMaterial;
    const normalizedTopics = (stateMaterial.topics || []).map((topic, index) => {
      if (typeof topic === 'string') {
        return {
          title: topic,
          explanation: 'Resumo do tema principal do material.',
          example: 'Exemplo didático: relacionada ao conteúdo do material para facilitar a memorização.',
        };
      }

      return {
        title: topic?.title || `Tema ${index + 1}`,
        explanation: topic?.explanation || '',
        example: topic?.example || '',
      };
    });

    return {
      ...stateMaterial,
      summary: stateMaterial.summary || 'Resumo do material não disponível.',
      topics: normalizedTopics,
      key_points: stateMaterial.key_points || ['Principais pontos do conteúdo'],
    };
  }, [location.state]);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Material</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">{material.title}</h1>

        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Resumo</h2>
            <p className="mt-3 leading-7 text-slate-700">{material.summary}</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-slate-900">Principais assuntos</h3>
            <div className="mt-4 space-y-3">
              {(material.topics || []).map((topic, index) => {
                const isOpen = expandedTopic === index;

                return (
                  <div key={`${material.id}-topic-${index}`} className="overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40">
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
              {(material.key_points || []).map((point, index) => (
                <li key={`${material.id}-point-${index}`}>{point}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            to={`/materials/${id}/quiz`}
            state={{ material, questions: material.questions || [] }}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500"
          >
            Começar questões
          </Link>
        </div>
      </div>
    </div>
  );
}
