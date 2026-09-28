import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const mockQuestions = [
  {
    id: 'q1',
    question: 'Qual estrutura é responsável por controlar o que entra e sai da célula?',
    options: ['Núcleo', 'Membrana plasmática', 'Mitocôndria', 'Ribossomo'],
    correct_answer: 'Membrana plasmática',
    explanation: 'A membrana plasmática é seletivamente permeável e regula a troca de substâncias com o meio externo.',
  },
  {
    id: 'q2',
    question: 'O processo de transporte passivo de água é chamado de:',
    options: ['Difusão facilitada', 'Osmose', 'Pinocitose', 'Endocitose'],
    correct_answer: 'Osmose',
    explanation: 'A osmose é o movimento de água através de uma membrana semipermeável em resposta a gradientes osmóticos.',
  },
];

export default function QuizPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const routeMaterial = location.state?.material || { id, title: 'Material', questions: [] };
  const questions = location.state?.questions?.length ? location.state.questions : mockQuestions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  const isLast = currentIndex === totalQuestions - 1;

  const correctCount = useMemo(
    () => questions.reduce((count, question) => count + (selectedAnswers[question.id] === question.correct_answer ? 1 : 0), 0),
    [questions, selectedAnswers],
  );

  const handleAnswer = (answer) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setSubmitted(true);
  };

  const nextQuestion = () => {
    if (isLast) {
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSubmitted(false);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setSubmitted(false);
  };

  const handleBackToMaterial = () => {
    navigate(`/materials/${id}`, { state: { material: routeMaterial } });
  };

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
