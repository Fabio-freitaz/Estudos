import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/register';
  const { signUp, signIn, resetPassword } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const getFriendlyAuthError = (submitError) => {
    const message = submitError?.message || '';
    const lower = message.toLowerCase();

    if (lower.includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e também a pasta de spam.';
    }

    if (lower.includes('rate limit exceeded') || lower.includes('too many requests')) {
      return 'Muitas tentativas de envio foram feitas em pouco tempo. Aguarde alguns minutos e tente novamente.';
    }

    if (lower.includes('invalid login credentials')) {
      return 'E-mail ou senha inválidos. Verifique os dados e tente novamente.';
    }

    if (lower.includes('user already registered')) {
      return 'Este e-mail já está cadastrado. Tente fazer login ou recuperar a senha.';
    }

    return submitError?.message || 'Não foi possível concluir a operação.';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isRegister) {
        const { error: signUpError } = await signUp({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
        });

        if (signUpError) {
          throw signUpError;
        }

        setMessage('Conta criada com sucesso. Você pode fazer login agora.');
        navigate('/login');
      } else {
        const { error: signInError } = await signIn({
          email: form.email,
          password: form.password,
        });

        if (signInError) {
          throw signInError;
        }

        navigate('/dashboard');
      }
    } catch (submitError) {
      setError(getFriendlyAuthError(submitError));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!form.email) {
      setError('Informe seu e-mail para recuperar a senha.');
      return;
    }

    const { error } = await resetPassword(form.email);
    if (error) {
      setError(error.message || 'Não foi possível enviar o e-mail de recuperação.');
      return;
    }

    setMessage('Se o e-mail estiver cadastrado, você receberá instruções para redefinir a senha.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <div className="text-3xl font-black text-indigo-600">EstudaPDF</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{isRegister ? 'Crie sua conta' : 'Acesse sua conta'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-0 transition focus:border-indigo-500"
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-indigo-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          {message && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{message}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Carregando...' : isRegister ? 'Criar conta' : 'Entrar'}
          </button>

          {!isRegister && (
            <Link to="/forgot-password" className="block w-full text-center text-sm font-medium text-indigo-600 underline">
              Esqueci minha senha
            </Link>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
          <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-indigo-600">
            {isRegister ? 'Fazer login' : 'Criar conta'}
          </Link>
        </div>
      </div>
    </div>
  );
}
