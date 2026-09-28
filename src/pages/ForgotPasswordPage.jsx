import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      const lower = (resetError.message || '').toLowerCase();
      const friendlyMessage = lower.includes('rate limit exceeded') || lower.includes('too many requests')
        ? 'Muitas tentativas de envio foram feitas em pouco tempo. Aguarde alguns minutos antes de solicitar novamente.'
        : resetError.message || 'Não foi possível recuperar a senha.';

      setError(friendlyMessage);
      setMessage('');
      return;
    }

    setMessage('Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className="text-3xl font-black text-indigo-600">EstudaPDF</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Recuperar senha</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-indigo-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{message}</div>}

          <button type="submit" className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500">
            Enviar instruções
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          <Link to="/login" className="font-semibold text-indigo-600">Voltar para login</Link>
        </div>
      </div>
    </div>
  );
}
