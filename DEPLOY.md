# Deploy no Vercel

## 1. Preparação do repositório

- Crie um repositório no GitHub.
- Faça o push do projeto.

## 2. Configuração no Vercel

1. Acesse https://vercel.com.
2. Clique em `Add New Project`.
3. Selecione o repositório do EstudaPDF.
4. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 3. Configuração do Supabase

- Crie projeto no Supabase.
- Ative Authentication.
- Execute `supabase/schema.sql`.
- Crie o bucket `study-pdfs`.
- Configure policies para acesso por usuário.

## 4. Testes após o deploy

- Crie uma conta.
- Faça login.
- Faça upload de um PDF válido.
- Verifique a extração de texto.
- Confirme a geração de resumo e questões.
- Responda as questões e veja o resultado.
- Confirme que o histórico foi salvo.

## 5. Importante

Nunca commite `.env`, `.env.local` ou chaves reais.
A API da Gemini deve ser consumida pelo backend/serverless, não diretamente no frontend.
