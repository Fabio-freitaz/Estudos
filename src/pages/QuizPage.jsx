import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function QuizPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const routeMaterial = location.state?.material || { id, title: 'Material', questions: [] };
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [loading, setLoading] = useState(!location.state?.questions);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (location.state?.questions?.length) {
        setQuestions(location.state.questions);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/materials/${id}`, {
          headers: {
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || 'Não foi possível carregar as questões.');
        }

        setQuestions(result?.data?.questions || []);
      } catch (fetchError) {
        setError(fetchError?.message || 'Não foi possível carregar as questões.');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestions();
    }
  }, [id, location.state?.questions, session?.access_token]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;
  const selectedAnswer = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isLast = totalQuestions > 0 && currentIndex === totalQuestions - 1;

  const correctCount = useMemo(
    () => questions.reduce((count, question) => count + (selectedAnswers[question.id] === question.correct_answer ? 1 : 0), 0),
    [questions, selectedAnswers],
  );

  const submitQuizResult = async () => {
    if (!session?.access_token || !id || totalQuestions === 0 || resultSaved) {
      return;
    }

    const answers = questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers[question.id] || null,
      correctAnswer: question.correct_answer,
      isCorrect: selectedAnswers[question.id] === question.correct_answer,
      explanation: question.explanation,
    }));

    try {
      const response = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          materialId: id,
          totalQuestions,
          correctAnswers: correctCount,
          score: totalQuestions ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0,
          answers,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Não foi possível salvar o resultado do quiz.');
      }

      setResultSaved(true);
    } catch (submitError) {
      setError(submitError?.message || 'Não foi possível salvar o resultado do quiz.');
    }
  };

  const handleAnswer = (answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setSubmitted(true);
  };

  const nextQuestion = async () => {
    if (isLast) {
      await submitQuizResult();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSubmitted(false);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
    setResultSaved(false);
    setError('');
  };

  const handleBackToMaterial = () => {
    navigate(`/materials/${id}`, { state: { material: routeMaterial } });
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Carregando quiz...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>;
  }

  if (!currentQuestion) {
    return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Nenhuma questão disponível para este material.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Quiz</p>
        <span className="text-sm text-slate-500">Questão {currentIndex + 1} de {totalQuestions}</span>
      </div>

      <h1 className="text-2xl font-black text-slate-900">{currentQuestion.question}</h1>

      <div className="mt-6 space-y-3">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuestion.correct_answer;

          return (
            <button
              key={option}
              type="button"
              disabled={submitted}
              onClick={() => handleAnswer(option)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-slate-700 transition ${
                submitted
                  ? isCorrect
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : isSelected
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white'
                  : isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span>{option}</span>
              {submitted && isCorrect && <span className="font-bold">✓</span>}
              {submitted && !isCorrect && isSelected && <span className="font-bold">✕</span>}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-lg font-bold text-slate-900">
            {selectedAnswer === currentQuestion.correct_answer ? 'Acertou!' : 'Incorreto.'}
          </div>
          <p className="text-sm text-slate-600">
            Resposta correta: <span className="font-semibold text-slate-900">{currentQuestion.correct_answer}</span>
          </p>
          <p className="mt-3 text-sm text-slate-700">{currentQuestion.explanation}</p>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3">
        {!submitted && (
          <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700" disabled>
            Responder
          </button>
        )}

        {submitted && (
          <button onClick={nextQuestion} type="button" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
            {isLast ? 'Ver resultado' : 'Próxima questão'}
          </button>
        )}
      </div>

      {isLast && submitted && (
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-300">Resultado</div>
          <div className="mt-2 text-4xl font-black">{correctCount}/{totalQuestions}</div>
          <div className="mt-2 text-lg font-medium">{Math.round((correctCount / totalQuestions) * 100)}% de acerto</div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={resetQuiz} className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-900">Refazer questões</button>
            <button type="button" onClick={handleBackToMaterial} className="rounded-xl border border-slate-700 px-4 py-2 font-semibold text-white">Voltar ao material</button>
          </div>
        </div>
      )}
    </div>
  );
}
