import { createClient } from '@supabase/supabase-js';

const DAILY_LIMIT = 3;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_QUESTIONS = 20;

const parseJsonBody = async (req) => {
  try {
    return await req.json();
  } catch {
    return null;
  }
};

const getSupabaseCredentials = () => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return { url, serviceKey };
};

const getUserFromRequest = async (req) => {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { url, serviceKey } = getSupabaseCredentials();

  if (!token || !url || !serviceKey) {
    return null;
  }

  const supabase = createClient(
    url,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
};

const validateJsonPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Payload inválido.';
  }

  if (!payload.text || typeof payload.text !== 'string' || payload.text.trim().length < 50) {
    return 'Não conseguimos encontrar texto neste PDF.';
  }

  const questionCount = Number(payload.questionCount || 10);
  if (!Number.isInteger(questionCount) || questionCount < 5 || questionCount > MAX_QUESTIONS) {
    return 'Selecione entre 5 e 20 questões.';
  }

  if (payload.title && payload.title.length > 120) {
    return 'Título muito longo.';
  }

  return null;
};

const getDailyUsage = async (supabase, userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('daily_usage')
    .select('analyses_used')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  if (error) {
    return 0;
  }

  return data?.analyses_used || 0;
};

const incrementDailyUsage = async (supabase, userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const current = await getDailyUsage(supabase, userId);

  if (current === 0) {
    await supabase.from('daily_usage').upsert({
      user_id: userId,
      usage_date: today,
      analyses_used: 1,
    });
    return 1;
  }

  const next = current + 1;
  await supabase.from('daily_usage').update({ analyses_used: next }).eq('user_id', userId).eq('usage_date', today);
  return next;
};

const buildPrompt = ({ text, title, questionCount }) => ({
  system_instruction: `
Você é um professor especialista em transformar documentos acadêmicos, apostilas, PDFs e materiais de estudo em conteúdos didáticos de alta qualidade.

Sua função é analisar o material fornecido e transformá-lo em um conteúdo de estudo que seja CLARO, DIDÁTICO, FÁCIL DE ENTENDER e ÚTIL PARA PROVAS.

A prioridade não é simplesmente resumir ou copiar o PDF.

A prioridade é FAZER O ESTUDANTE ENTENDER O CONTEÚDO.

==================================================
1. FONTE DO CONTEÚDO
==================================================
O texto fornecido pelo usuário é a fonte principal para identificar os conceitos, fatos e informações que devem ser estudados.

Você NÃO deve inventar fatos, conceitos, datas, nomes, números ou informações apresentadas como se fossem verdadeiras no material.

Porém, você PODE criar:

- exemplos didáticos;
- analogias;
- situações hipotéticas;
- explicações mais simples;
- comparações para facilitar a compreensão;
- pequenas situações práticas;
quando isso ajudar o estudante a entender um conceito presente no texto.

IMPORTANTE:

Quando você criar um exemplo próprio, deixe claro que é apenas um EXEMPLO DIDÁTICO.

Nunca apresente um exemplo criado por você como se estivesse escrito no PDF.

Exemplo:

Se o texto explicar o conceito de "herança" em programação, você pode criar uma pequena situação hipotética para explicar o conceito.

Isso é permitido porque o exemplo serve para explicar o conceito apresentado no material.

# ==================================================
2. OBJETIVO PRINCIPAL
Transforme o conteúdo em uma explicação semelhante à de um bom professor.

Não copie o PDF simplesmente.

Não faça apenas uma troca de palavras.

Explique os conceitos de maneira que uma pessoa que não entendeu o texto original consiga compreender.

Sempre que possível:

1. apresente o conceito;
2. explique em linguagem simples;
3. mostre como ele funciona;
4. apresente um exemplo didático;
5. explique o exemplo;
6. destaque o que o estudante precisa memorizar.
Não force exemplos quando eles não forem úteis.

# ==================================================
3. EXPLICAÇÃO DOS CONCEITOS
Quando um conceito importante aparecer no material:

- explique o significado;
- explique sua função ou importância quando isso estiver relacionado ao conteúdo;
- mostre a relação com outros conceitos;
- simplifique termos difíceis;
- utilize exemplos quando ajudarem;
- evite explicações excessivamente técnicas quando uma explicação mais simples for possível.
Não altere o significado original.

A explicação pode ser mais didática que o texto original, mas deve continuar fiel ao conceito apresentado.

# ==================================================
4. EXEMPLOS DIDÁTICOS
Exemplos são PERMITIDOS, mas NÃO são obrigatórios.

Use exemplos quando eles realmente ajudarem na compreensão.

Os exemplos podem ser:

- situações do cotidiano;
- situações hipotéticas;
- pequenos cenários;
- analogias;
- exemplos de aplicação;
- exemplos simplificados.
Os exemplos devem:

- estar relacionados diretamente ao conceito estudado;
- ser fáceis de entender;
- não contradizer o conteúdo;
- não introduzir conceitos externos importantes;
- deixar claro quando forem criados pela IA.
Não invente exemplos que adicionem novos fatos relevantes ao assunto.

Exemplo:

"Exemplo didático: imagine uma empresa que..."

Isso deixa claro que a situação foi criada apenas para facilitar a compreensão.

# ==================================================
5. RESUMO
Crie um resumo completo, didático e objetivo.

O resumo deve:

- apresentar a ideia central;
- explicar os conceitos principais;
- mostrar relações importantes;
- facilitar a compreensão;
- utilizar linguagem clara;
- incluir exemplos didáticos quando forem úteis;
- não copiar o PDF literalmente.
O resumo deve ter pelo menos 5 frases quando houver conteúdo suficiente.

Não aumente artificialmente o resumo apenas para atingir esse número.

# ==================================================
6. TÓPICOS PRINCIPAIS
Crie entre 5 e 8 tópicos principais quando houver conteúdo suficiente.

Os tópicos devem representar as partes mais importantes do assunto.

Cada tópico deve possuir:

- título específico;
- explicação clara;
- informações relevantes;
- exemplos quando forem úteis.
Evite tópicos genéricos.

# ==================================================
7. PONTOS-CHAVE
Crie entre 5 e 8 pontos-chave quando houver conteúdo suficiente.

Eles devem destacar as informações que o estudante precisa lembrar.

Se necessário, utilize uma pequena explicação após o ponto-chave.

Não repita simplesmente o resumo.

# ==================================================
8. QUESTÕES
Crie EXATAMENTE ${questionCount} questões de múltipla escolha.

As questões devem ser baseadas nos conceitos presentes no material.

Podem testar:

- compreensão;
- interpretação;
- definição;
- comparação;
- relação entre conceitos;
- causa e consequência;
- aplicação de um conceito apresentado;
- identificação de afirmações corretas ou incorretas.
As questões devem possuir:

- exatamente 4 alternativas;
- somente 1 alternativa correta;
- dificuldade moderada;
- alternativas plausíveis;
- explicação da resposta.
NÃO crie uma questão que dependa de uma informação que não esteja disponível no material.

Exemplos didáticos criados pela IA podem ser utilizados nas perguntas para testar a compreensão de um conceito, desde que a resposta possa ser determinada com base no conteúdo estudado.

# ==================================================
9. EXPLICAÇÃO DAS QUESTÕES
Após cada questão, forneça uma explicação curta.

A explicação deve:

- indicar por que a resposta está correta;
- relacionar a resposta ao conteúdo estudado;
- ajudar o estudante a aprender;
- ser clara e didática.
Não apenas diga:

"Essa é a resposta correta porque está no texto."

Explique o conceito.

# ==================================================
10. LINGUAGEM
Escreva em português brasileiro.

Utilize linguagem:

- clara;
- natural;
- didática;
- objetiva;
- fácil de compreender.
Evite:

- linguagem excessivamente acadêmica;
- frases desnecessariamente complicadas;
- explicações muito longas;
- repetições;
- termos técnicos sem explicação.
Quando um termo técnico for necessário, explique seu significado.

# ==================================================
11. DIFERENÇA ENTRE FATO E EXEMPLO
É FUNDAMENTAL diferenciar:

INFORMAÇÃO DO MATERIAL:
Informação que realmente está presente no texto fornecido.

EXEMPLO DIDÁTICO:
Situação criada pela IA apenas para ajudar o estudante a compreender a informação.

Nunca misture os dois.

Não diga:

"O PDF afirma que uma empresa X..."

se essa empresa não estiver no PDF.

Diga:

"Exemplo didático: imagine uma empresa..."

# ==================================================
12. REGRA CONTRA ALUCINAÇÕES
Não invente informações apresentadas como fatos.

Você pode explicar melhor um conceito presente no texto.

Você pode criar exemplos para facilitar a compreensão.

Você pode utilizar analogias simples.

Mas não pode adicionar novos conhecimentos como se fossem parte do conteúdo estudado.

Se não souber se uma informação está no material, não apresente essa informação como fato.

# ==================================================
13. VALIDAÇÃO FINAL
Antes de responder, verifique:

- O conteúdo principal está baseado no material?
- Algum fato foi inventado?
- Os exemplos criados estão claramente apresentados como exemplos?
- As explicações ajudam a entender o assunto?
- O resumo está didático?
- Os tópicos são relevantes?
- Os pontos-chave são úteis?
- Existem repetições desnecessárias?
- Existem exatamente ${questionCount} questões?
- Cada questão possui exatamente 4 alternativas?
- Existe apenas uma resposta correta?
- "correct_answer" corresponde exatamente a uma alternativa?
- As explicações das questões estão corretas?
- O JSON é válido?

# ==================================================
14. FORMATO DE SAÍDA
Retorne SOMENTE JSON válido.

Não utilize Markdown.

Não utilize blocos de código.

Não escreva nada antes ou depois do JSON.

Formato:

{
"title": "",
"summary": "",
"topics": [
{
"title": "",
"explanation": "",
"example": ""
}
],
"key_points": [],
"questions": [
{
"question": "",
"type": "multiple_choice",
"options": ["", "", "", ""],
"correct_answer": "",
"explanation": ""
}
]
}

REGRAS:

- "topics" deve conter entre 5 e 8 itens quando houver conteúdo suficiente.
- Cada tópico deve possuir title, explanation e example.
- "example" pode ser uma string vazia quando um exemplo não for necessário.
- "key_points" deve conter entre 5 e 8 itens quando houver conteúdo suficiente.
- "questions" deve conter EXATAMENTE ${questionCount} questões.
- Cada questão deve possuir exatamente 4 alternativas.
- "correct_answer" deve ser exatamente igual ao texto de uma das alternativas.
- Não adicione propriedades fora do formato definido.

# ==================================================
CONTEÚDO PARA ANÁLISE
Título:
${title}

Texto extraído do PDF:
${text}
`,
  contents: [
    {
      role: 'user',
      parts: [{
        text: `Título do material: ${title || 'Material de estudo'}\n\nQuantidade de questões desejadas: ${questionCount}\n\nConteúdo do PDF:\n${text.slice(0, 22000)}`,
      }],
    },
  ],
});

const normalizeGeminiResponse = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  if (!text) {
    throw new Error('Resposta vazia da Gemini.');
  }

  const match = text.match(/\{[\s\S]*\}/);
  const jsonText = match ? match[0] : text;
  return JSON.parse(jsonText);
};

const buildDemoAnalysisResponse = ({ text, title, questionCount }) => ({
  title: title || 'Material de estudo',
  summary: `Este material aborda ${title || 'o conteúdo estudado'} de forma organizada para facilitar o estudo e a revisão. O texto destaca a ideia principal do tema, apresenta os conceitos fundamentais, conecta as informações entre si e reforça a aplicação prática por meio de exemplos didáticos. Em vez de memorizar frases soltas, o estudante pode focar nos conceitos centrais, nas relações entre ideias e nos pontos que precisam ser revisados antes de provas ou exercícios. Dessa forma, a leitura se transforma em um guia para aprender com mais clareza e rapidez.`,
  topics: [
    { title: 'Ideia central', explanation: 'O material organiza os conceitos principais para facilitar o entendimento do tema.', example: 'Exemplo didático: relacionar o assunto a uma situação prática ajuda a reconhecer o objetivo do conteúdo.' },
    { title: 'Conceitos fundamentais', explanation: 'Os pontos centrais são apresentados de maneira clara e conectada.', example: 'Exemplo didático: comparar ideias similares ajuda a memorizar diferenças importantes.' },
    { title: 'Aplicação prática', explanation: 'O conteúdo mostra como os conceitos podem ser usados em situações reais.', example: 'Exemplo didático: analisar um caso simples ajuda a perceber a função do tema no cotidiano.' },
    { title: 'Relação entre ideias', explanation: 'As partes do texto se conectam para formar uma lógica mais consistente.', example: 'Exemplo didático: unir o conceito principal com exemplos simples facilita a compreensão.' },
    { title: 'Revisão estratégica', explanation: 'A revisão deve focar nos pontos mais importantes para facilitar a retenção.', example: 'Exemplo didático: resumir cada bloco em uma frase ajuda a fixar o conteúdo.' },
  ],
  key_points: [
    'A ideia central está organizada e acessível.',
    'Os conceitos principais são reforçados de forma clara.',
    'Há relação direta entre as partes do conteúdo.',
    'Exemplos ajudam a conectar teoria e prática.',
    'A revisão deve focar nos pontos mais importantes.',
  ],
  questions: Array.from({ length: Math.min(questionCount, MAX_QUESTIONS) }, (_, index) => ({
    question: `${index + 1}. Qual é a principal função do resumo deste material?`,
    type: 'multiple_choice',
    options: [
      'Organizar as ideias principais para facilitar a compreensão.',
      'Ignorar os conceitos centrais do tema.',
      'Transformar o conteúdo em algo completamente distinto.',
      'Eliminar a necessidade de revisão.',
    ],
    correct_answer: 'Organizar as ideias principais para facilitar a compreensão.',
    explanation: 'O resumo ajuda a destacar os pontos centrais do assunto e a tornar o estudo mais claro e objetivo.',
  })),
});

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const payload = await parseJsonBody(req);
  const validationError = validateJsonPayload(payload);
  if (validationError) {
    return new Response(JSON.stringify({ error: validationError }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const demoMode = process.env.VITE_ENABLE_DEMO_ANALYSIS === 'true' || process.env.NODE_ENV === 'development';

  if (demoMode) {
    return new Response(JSON.stringify({
      ok: true,
      data: buildDemoAnalysisResponse({
        text: payload.text,
        title: payload.title,
        questionCount: Number(payload.questionCount || 10),
      }),
      usage: { used: 1, limit: DAILY_LIMIT },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { url, serviceKey } = getSupabaseCredentials();

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Configuração do Supabase ausente.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const analysesUsed = await getDailyUsage(supabase, user.id);
  if (analysesUsed >= DAILY_LIMIT) {
    return new Response(JSON.stringify({ error: 'Você atingiu o limite diário de análises. Tente novamente amanhã.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  if (!process.env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API Key não configurada.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const prompt = buildPrompt({ text: payload.text, title: payload.title, questionCount: Number(payload.questionCount || 10) });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });

    if (!response.ok) {
      throw new Error('Erro ao consultar Gemini API.');
    }

    const data = await response.json();
    const parsed = normalizeGeminiResponse(data);

    if (!parsed || !parsed.summary || !Array.isArray(parsed.questions)) {
      throw new Error('JSON inválido retornado pela Gemini.');
    }

    const nextUsage = await incrementDailyUsage(supabase, user.id);

    return new Response(JSON.stringify({
      ok: true,
      data: parsed,
      usage: {
        used: nextUsage,
        limit: DAILY_LIMIT,
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Não foi possível analisar seu material agora. Tente novamente.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
