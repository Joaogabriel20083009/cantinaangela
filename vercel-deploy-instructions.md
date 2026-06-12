# Guia de Deploy na Vercel (Frontend & Backend)

Este guia explica como configurar e publicar o seu projeto unificado (Vite + Express + Prisma) na Vercel com um banco de dados PostgreSQL persistente e funcional.

---

## Passo 1: Preparar o Banco de Dados para Produção (PostgreSQL)

Como a Vercel possui um sistema de arquivos temporário e somente-leitura, o SQLite (`dev.db`) **não funcionará para gravação de novos dados** em produção. É necessário utilizar um banco de dados PostgreSQL real.

1. **Crie um banco de dados PostgreSQL gratuito**:
   - Recomendamos o **[Supabase](https://supabase.com)** ou **[Neon](https://neon.tech)**. Ambos oferecem planos gratuitos excelentes e rápidos de criar.
2. **Copie a string de conexão (Connection String)**:
   - Ela deve se parecer com: `postgresql://postgres:senha@db.host.supabase.co:5432/postgres`

---

## Passo 2: Alterar a configuração do Prisma

Criamos um script que automatiza a alteração do banco de dados no arquivo `schema.prisma`.

1. **Abra um terminal no projeto e mude para PostgreSQL**:
   ```bash
   node scripts/switch-db.js postgresql
   ```
2. **Para voltar para o SQLite local quando quiser testar offline**:
   ```bash
   node scripts/switch-db.js sqlite
   ```

---

## Passo 3: Criar as tabelas no Banco de Dados Novo

Antes de subir na Vercel, você precisa criar a estrutura de tabelas e o usuário administrador no seu banco PostgreSQL.

1. Crie ou edite o arquivo `.env` na raiz do projeto (este arquivo não deve ser enviado ao Git) e adicione a string de conexão do PostgreSQL que você copiou no Passo 1:
   ```env
   DATABASE_URL="sua_string_de_conexao_do_supabase_aqui"
   JWT_SECRET="um-segredo-super-seguro-qualquer"
   ```
2. Crie a estrutura das tabelas no PostgreSQL rodando:
   ```bash
   npx prisma db push
   ```
3. Crie o usuário Admin inicial executando o seed:
   ```bash
   node prisma/seed.js
   ```

---

## Passo 4: Fazer o Deploy na Vercel

1. Envie o seu código para o **GitHub** ou outra plataforma integrada à Vercel.
2. Acesse o painel da **[Vercel](https://vercel.com)**.
3. Clique em **Add New** -> **Project** e selecione o repositório do seu projeto.
4. O painel da Vercel detectará automaticamente que é um projeto **Vite** (Frontend).
5. Abra a seção **Environment Variables** (Variáveis de Ambiente) e adicione as seguintes variáveis:
   - **`DATABASE_URL`**: A string de conexão do seu banco PostgreSQL (Supabase/Neon).
   - **`JWT_SECRET`**: A sua chave secreta para geração de tokens JWT (pode ser a mesma definida no arquivo `.env`).
6. Clique em **Deploy**.

Pronto! A Vercel vai instalar as dependências, rodar a compilação do frontend, gerar as funções Serverless para as rotas `/api/*` e o seu site estará no ar com frontend e backend interligados perfeitamente.
