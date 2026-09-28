const mockHistory = [
  { id: '1', material: 'Biologia - Membranas', date: '28/09/2026', total: 10, correct: 8, percentage: '80%' },
  { id: '2', material: 'História - Revolução Industrial', date: '27/09/2026', total: 15, correct: 11, percentage: '73%' },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Histórico</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Tentativas anteriores</h1>
      </div>

      <div className="space-y-4">
        {mockHistory.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{item.material}</h2>
                <p className="text-sm text-slate-500">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">{item.total} questões</p>
                <p className="text-lg font-black text-indigo-600">{item.correct}/{item.total}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>{item.percentage} de acerto</span>
              <button type="button" className="font-semibold text-indigo-600">Abrir resultado</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
