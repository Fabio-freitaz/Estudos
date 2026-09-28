import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  frontendUrl,
]);

const isAllowedLocalOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }
  } catch {
    return false;
  }

  return allowedOrigins.has(origin);
};

const getEnvValue = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const isPlaceholderValue = (value) => typeof value === 'string' && /(^your-|placeholder|example|changeme|replace-me|replace me|insert)/i.test(value.trim());

app.use(cors({
  origin(origin, callback) {
    if (isAllowedLocalOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options(/(.*)/, cors());
app.use(express.json({ limit: '10mb' }));

const getSupabaseAdmin = () => {
  const supabaseUrl = getEnvValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceRoleKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or service role key is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(serviceRoleKey)) {
    throw new Error('Supabase credentials are still placeholders. Configure real values for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const getAuthenticatedUser = async (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
};

const parseJsonBody = async (req) => {
  try {
    const payload = await req.json();
    return payload;
  } catch {
    return null;
  }
};

const buildPrompt = ({ text, title, questionCount }) => ({
  system_instruction: `
Você é um professor especialista...`,
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

const validateNormalizedAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object') {
    throw new Error('Formato inválido da resposta da IA.');
  }

  if (!analysis.title || !analysis.summary) {
    throw new Error('A resposta gerada pela IA não contém título ou resumo válidos.');
  }

  if (!Array.isArray(analysis.topics) || analysis.topics.length < 1) {
    throw new Error('A resposta gerada pela IA não contém tópicos válidos.');
  }

  if (!Array.isArray(analysis.key_points) || analysis.key_points.length < 1) {
    throw new Error('A resposta gerada pela IA não contém pontos-chave válidos.');
  }

  if (!Array.isArray(analysis.questions) || analysis.questions.length < 1) {
    throw new Error('A resposta gerada pela IA não contém questões válidas.');
  }

  const questions = analysis.questions.map((question, index) => {
    if (!question || typeof question !== 'object') {
      throw new Error(`Questão ${index + 1} inválida.`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`A questão ${index + 1} deve ter exatamente 4 alternativas.`);
    }

    if (!question.correct_answer || !question.options.includes(question.correct_answer)) {
      throw new Error(`A questão ${index + 1} não possui resposta correta válida.`);
    }

    if (!question.question || !question.explanation) {
      throw new Error(`A questão ${index + 1} está incompleta.`);
    }

    return question;
  });

  return { ...analysis, questions };
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
    await supabase.from('daily_usage').upsert({ user_id: userId, usage_date: today, analyses_used: 1 });
    return 1;
  }

  const next = current + 1;
  await supabase.from('daily_usage').update({ analyses_used: next }).eq('user_id', userId).eq('usage_date', today);
  return next;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'ok' });
});

app.post('/api/analyze-pdf', async (req, res) => {
  try {
    const payload = req.body || {};
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const questionCount = Number(payload.questionCount || 10);

    if (!text || text.length < 50) {
      return res.status(400).json({ error: 'Não conseguimos encontrar texto neste PDF.' });
    }

    if (!Number.isInteger(questionCount) || questionCount < 5 || questionCount > 20) {
      return res.status(400).json({ error: 'Selecione entre 5 e 20 questões.' });
    }

    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const geminiApiKey = getEnvValue('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no backend.' });
    }

    if (isPlaceholderValue(geminiApiKey)) {
      return res.status(500).json({ error: 'GEMINI_API_KEY está com valor de placeholder. Configure uma chave real no backend.' });
    }

    const supabase = getSupabaseAdmin();
    const used = await getDailyUsage(supabase, user.id);
    if (used >= 3) {
      return res.status(429).json({ error: 'Você atingiu o limite diário de análises.' });
    }

    const prompt = buildPrompt({ text, title, questionCount });
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(errorBody || 'Erro ao consultar Gemini API.');
    }

    const geminiJson = await geminiResponse.json();
    const analysis = validateNormalizedAnalysis(normalizeGeminiResponse(geminiJson));
    const nextUsage = await incrementDailyUsage(supabase, user.id);

    return res.json({
      ok: true,
      data: analysis,
      usage: { used: nextUsage, limit: 3 },
    });
  } catch (error) {
    const message = error?.message || 'Não foi possível analisar seu material agora.';
    return res.status(500).json({ error: message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ ok: true, data: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Não foi possível carregar materiais.' });
  }
});

app.get('/api/materials/:id', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const supabase = getSupabaseAdmin();
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (materialError || !material) {
      return res.status(404).json({ error: 'Material não encontrado.' });
    }

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .eq('material_id', material.id)
      .order('created_at', { ascending: true });

    if (topicsError) {
      throw topicsError;
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('material_id', material.id)
      .order('created_at', { ascending: true });

    if (questionsError) {
      throw questionsError;
    }

    return res.json({
      ok: true,
      data: {
        ...material,
        topics: topics || [],
        questions: questions || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Não foi possível carregar o material.' });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const payload = req.body || {};
    const title = String(payload.title || '').trim();
    const summary = String(payload.summary || '').trim();
    const extractedText = String(payload.extractedText || '').trim();
    const topics = Array.isArray(payload.topics) ? payload.topics : [];
    const questions = Array.isArray(payload.questions) ? payload.questions : [];

    if (!title || !summary) {
      return res.status(400).json({ error: 'Dados do material incompletos.' });
    }

    const supabase = getSupabaseAdmin();
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .insert([{
        user_id: user.id,
        title,
        file_name: String(payload.fileName || `${title}.pdf`),
        storage_path: String(payload.storagePath || 'local-analysis'),
        pdf_size: Number(payload.pdfSize || 0),
        extracted_text: extractedText || null,
        summary,
        question_count: questions.length || Number(payload.questionCount || 10),
        status: 'analyzed',
      }])
      .select()
      .single();

    if (materialError) {
      throw materialError;
    }

    if (topics.length) {
      const topicRows = topics.map((topic) => ({
        material_id: material.id,
        name: String(topic.title || topic.name || 'Tema').trim(),
      }));

      const { error: topicError } = await supabase.from('topics').insert(topicRows);
      if (topicError) {
        throw topicError;
      }
    }

    if (questions.length) {
      const questionRows = questions.map((question) => ({
        material_id: material.id,
        question: question.question,
        type: question.type || 'multiple_choice',
        options: question.options || [],
        correct_answer: question.correct_answer || question.correctAnswer || null,
        explanation: question.explanation || null,
      }));

      const { error: questionError } = await supabase.from('questions').insert(questionRows);
      if (questionError) {
        throw questionError;
      }
    }

    return res.status(201).json({ ok: true, data: { ...material, topics, questions } });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Não foi possível salvar o material.' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ ok: true, data: data || [] });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Não foi possível carregar o histórico.' });
  }
});

app.post('/api/quiz-results', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const payload = req.body || {};
    const materialId = payload.materialId || payload.material_id;
    const totalQuestions = Number(payload.totalQuestions || payload.total_questions || 0);
    const correctAnswers = Number(payload.correctAnswers || payload.correct_answers || 0);
    const score = Number(payload.score || 0);
    const answers = Array.isArray(payload.answers) ? payload.answers : [];

    if (!materialId) {
      return res.status(400).json({ error: 'Material não informado.' });
    }

    const supabase = getSupabaseAdmin();
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert([{ user_id: user.id, material_id: materialId, total_questions: totalQuestions, correct_answers: correctAnswers, score }])
      .select()
      .single();

    if (attemptError) {
      throw attemptError;
    }

    if (answers.length) {
      const answerRows = answers.map((answer) => ({
        attempt_id: attempt.id,
        question_id: answer.questionId || answer.question_id,
        selected_answer: answer.selectedAnswer || answer.selected_answer || null,
        correct_answer: answer.correctAnswer || answer.correct_answer || null,
        is_correct: Boolean(answer.isCorrect ?? answer.is_correct),
        explanation: answer.explanation || null,
      }));

      const { error: answersError } = await supabase.from('quiz_answers').insert(answerRows);
      if (answersError) {
        throw answersError;
      }
    }

    return res.status(201).json({ ok: true, data: attempt });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Não foi possível salvar o resultado do quiz.' });
  }
});

app.use((error, _req, res, _next) => {
  const message = error?.message || 'Erro interno do servidor.';
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
