import { appConfig } from '../config';

const normalizeTopic = (topic, index) => {
  if (typeof topic === 'string') {
    return {
      title: topic || `Tema ${index + 1}`,
      explanation: '',
      example: '',
    };
  }

  return {
    title: topic?.title || topic?.name || `Tema ${index + 1}`,
    explanation: topic?.explanation || topic?.description || '',
    example: topic?.example || topic?.exemplo || '',
  };
};

const normalizeAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object') {
    return null;
  }

  const topics = Array.isArray(analysis.topics)
    ? analysis.topics.map(normalizeTopic)
    : [];

  const keyPoints = Array.isArray(analysis.key_points)
    ? analysis.key_points.filter(Boolean).map((item) => String(item))
    : [];

  const questions = Array.isArray(analysis.questions)
    ? analysis.questions.map((question) => ({
        ...question,
        question: question?.question || 'Pergunta sem enunciado.',
        type: question?.type || 'multiple_choice',
        options: Array.isArray(question?.options) ? question.options.map((option) => String(option)) : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correct_answer: question?.correct_answer || question?.options?.[0] || 'Opção A',
        explanation: question?.explanation || 'Explicação indisponível.',
      }))
    : [];

  const summary = String(analysis.summary || '').trim() || (
    (topics.length ? `Este material aborda os principais assuntos do conteúdo: ${topics.map((topic) => topic.title).join(', ')}.` : 'Resumo indisponível.')
  );

  return {
    title: String(analysis.title || 'Material de estudo').trim(),
    summary,
    topics,
    key_points: keyPoints.length ? keyPoints : ['Ideia central do conteúdo', 'Conceitos fundamentais', 'Aplicação prática', 'Pontos para revisão', 'Conexão entre ideias'],
    questions,
  };
};

const buildDemoAnalysis = ({ text, title, questionCount }) => {
  const cleanedText = (text || '').replace(/\s+/g, ' ').trim();
  const preview = cleanedText.slice(0, 1000);
  const sentences = (cleanedText.match(/[^.!?]+[.!?]?/g) || []).slice(0, 5);
  const summaryBase = sentences.join(' ').trim() || preview || 'O material apresenta os principais conceitos do tema abordado.';

  const normalizedWords = cleanedText
    .toLowerCase()
    .replace(/[^a-zà-ü0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, 6);

  const topics = normalizedWords.length
    ? normalizedWords.map((word, index) => ({
        title: word.charAt(0).toUpperCase() + word.slice(1),
        explanation: `Este tema é central para a compreensão do material e deve ser revisado com atenção.`,
        example: `Exemplo didático: use o conceito de ${word} para relacionar a ideia principal ao conteúdo estudado.`,
      }))
    : [
        { title: 'Introdução ao tema', explanation: 'Apresenta a ideia central e a organização do conteúdo.', example: 'Exemplo didático: relacionar o tema com situações simples do cotidiano para facilitar a compreensão.' },
        { title: 'Conceitos principais', explanation: 'Identifica os pontos fundamentais e mais relevantes do assunto.', example: 'Exemplo didático: comparar os conceitos com casos práticos para reforçar a aprendizagem.' },
      ];

  const summary = `Este material aborda ${title || 'o conteúdo estudado'} de forma organizada para facilitar o estudo e a revisão. O texto destaca a ideia principal do tema, apresenta os conceitos fundamentais e conecta essas informações com aplicações práticas e contextos de aprendizagem. Em outras palavras, a leitura não se limita a repetir informações, mas ajuda a compreender a lógica do assunto, reconhecer seus pontos centrais e relacionar as ideias entre si. Para estudar melhor, é importante focar nos conceitos-chave, nas relações entre eles e nos exemplos que reforçam a compreensão. Dessa forma, o conteúdo vira um guia útil para revisão, memorização e preparação para exercícios e provas.`;

  const questions = Array.from({ length: Math.min(questionCount, appConfig.maxQuestionsPerAnalysis) }, (_, index) => ({
    question: `${index + 1}. Qual é a ideia central apresentada neste material?`,
    type: 'multiple_choice',
    options: [
      'O texto destaca os conceitos fundamentais e sua organização para estudo.',
      'O texto ignora os principais conceitos do tema.',
      'O texto altera a informação para dificultar a compreensão.',
      'O texto remove a necessidade de revisão do conteúdo.',
    ],
    correct_answer: 'O texto destaca os conceitos fundamentais e sua organização para estudo.',
    explanation: `A resposta correta está alinhada com a leitura do material: ${summaryBase || 'o conteúdo foi organizado em ideias centrais e pontos de revisão para estudo.'}`,
  }));

  return {
    title: title || 'Material de estudo',
    summary,
    topics,
    key_points: [
      'Identificação das ideias centrais do texto',
      'Conceitos fundamentais organizados para revisão',
      'Aplicação prática e compreensão do tema',
      'Relação entre ideias e exemplos de estudo',
      'Pontos para reforçar na memorização',
    ],
    questions,
  };
};

export const analyzePdfWithGemini = async ({ text, title, questionCount, userToken }) => {
  const requestBody = {
    text,
    title,
    questionCount,
  };

  const demoMode = import.meta.env.VITE_ENABLE_DEMO_ANALYSIS === 'true';

  try {
    const response = await fetch('/api/analyze-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
    });

    let result = null;
    const text = await response.text();

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Resposta inválida da análise do material.');
      }
    }

    if (!response.ok) {
      throw new Error(result?.error || 'Não foi possível analisar seu material agora. Tente novamente.');
    }

    if (!result?.data) {
      throw new Error('A IA não retornou dados válidos para este material.');
    }

    return normalizeAnalysis(result?.data);
  } catch (error) {
    if (demoMode) {
      return buildDemoAnalysis({ text, title, questionCount });
    }

    const message = error instanceof Error && error.message
      ? error.message
      : 'A IA não está respondendo. Verifique a rota da API e as variáveis do Gemini/Supabase.';

    throw new Error(message.includes('Failed to fetch') || message.includes('fetch')
      ? 'A rota /api/analyze-pdf não está disponível no ambiente atual. Use o servidor Vercel local ou configure o backend antes de testar a IA.'
      : message);
  }
};
