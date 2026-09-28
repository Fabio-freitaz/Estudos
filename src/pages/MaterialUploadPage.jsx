import { useRef, useState } from 'react';
import { FileUp, Trash2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { extractTextFromPdf, validatePdfFile } from '../lib/pdf';
import { analyzePdfWithGemini } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';

const questionOptions = [5, 10, 15, 20];

export default function MaterialUploadPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const [file, setFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleFileSelection = (nextFile) => {
    const validation = validatePdfFile(nextFile);
    if (validation) {
      setError(validation);
      setFile(null);
      return;
    }

    setError('');
    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Envie um PDF válido.');
      return;
    }

    setUploading(true);
    setError('');
    setStatus('');

    try {
      const text = await extractTextFromPdf(file);
      setStatus('✓ PDF recebido');
      const analysis = await analyzePdfWithGemini({
        text,
        title: file.name.replace(/\.pdf$/i, ''),
        questionCount,
        userToken: session?.access_token,
      });

      setStatus('✓ Texto extraído\n✓ Criando resumo\n✓ Criando questões\n✓ Salvando material');

      if (!analysis || !analysis.summary) {
        throw new Error('Não foi possível gerar o conteúdo do material.');
      }

      const payload = {
        title: analysis.title || file.name.replace(/\.pdf$/i, ''),
        summary: analysis.summary,
        extractedText: text,
        fileName: file.name,
        storagePath: 'local-upload',
        pdfSize: file.size,
        questionCount,
        topics: analysis.topics || [],
        key_points: analysis.key_points || [],
        questions: (analysis.questions || []).map((question, index) => ({
          ...question,
          id: question.id || `q-${index + 1}`,
          options: question.options || ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        })),
      };

      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const savedResult = await response.json();
      if (!response.ok) {
        throw new Error(savedResult?.error || 'Não foi possível salvar o material no banco.');
      }

      const material = savedResult?.data || payload;
      navigate(`/materials/${material.id}`, { state: { material } });
    } catch (uploadError) {
      const message = uploadError?.message || 'Não foi possível analisar seu material agora. Tente novamente.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">Novo material</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Enviar PDF</h1>
        </div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files?.[0];
            handleFileSelection(droppedFile);
          }}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        >
          <UploadCloud className="mx-auto mb-4 text-indigo-500" size={40} />
          <p className="text-lg font-semibold text-slate-700">Arraste seu PDF aqui</p>
          <p className="mt-2 text-sm text-slate-500">ou</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
          >
            Selecionar PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0])}
          />
        </div>

        {file && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <FileUp className="text-indigo-600" size={18} />
              <div>
                <p className="font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button type="button" onClick={() => setFile(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200">
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">Quantidade de questões</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {questionOptions.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setQuestionCount(value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                  questionCount === value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {uploading && (
          <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
            <div className="mb-2 font-semibold">Analisando seu material...</div>
            <div className="space-y-1 whitespace-pre-line">
              {status || 'Isso pode levar alguns segundos.'}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? 'Enviando...' : 'Enviar PDF'}
        </button>

        <div className="mt-4 text-xs text-slate-500">Aceita apenas PDF. Limite de 10 MB por arquivo.</div>
      </div>
    </div>
  );
}
