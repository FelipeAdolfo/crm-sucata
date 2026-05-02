# CRM Sucata - Backend

Backend do Portal de Negócios e Inteligência de Mercado para gestão de compras de sucata ferrosa.

## 🚀 Funcionalidades

- ✅ **Autenticação com 2FA** (Google Authenticator)
- ✅ **Hierarquia de usuários** (6 níveis de acesso)
- ✅ **Gestão de oportunidades** (9 fases do funil)
- ✅ **Upload de fotos**
- ✅ **Sistema de visitas agendadas**
- ✅ **Inteligência de mercado**
- ✅ **Dashboard e relatórios**
- ✅ **Notificações**

## 🛠️ Tecnologias

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT + Speakeasy (2FA)
- Bcrypt (senhas)
- Cloudinary (fotos)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate dev --name init

# (Opcional) Popular com dados de exemplo
npx prisma db seed

# Iniciar em desenvolvimento
npm run dev
```

## 🔑 Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL="postgresql://user:password@localhost:5432/crm_sucata"
JWT_SECRET=your-secret-key
SENDGRID_API_KEY=SG.xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-2fa` - Verificar código 2FA
- `POST /api/auth/register` - Registro
- `POST /api/auth/setup-2fa` - Configurar 2FA
- `POST /api/auth/confirm-2fa` - Confirmar 2FA
- `GET /api/auth/me` - Dados do usuário

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

### Oportunidades
- `GET /api/opportunities` - Listar
- `POST /api/opportunities` - Criar
- `PUT /api/opportunities/:id` - Atualizar
- `PATCH /api/opportunities/:id/stage` - Mudar fase
- `GET /api/opportunities/pipeline/overview` - Pipeline Kanban

### Visitas
- `GET /api/visits` - Listar
- `POST /api/visits` - Agendar
- `POST /api/visits/:id/complete` - Concluir
- `POST /api/visits/:id/cancel` - Cancelar

### Dashboard
- `GET /api/dashboard/metrics` - Métricas
- `GET /api/dashboard/pipeline` - Pipeline
- `GET /api/dashboard/team-performance` - Desempenho

## 👤 Usuários Padrão

| Email | Senha | Função |
|-------|-------|--------|
| admin@sucalog.com.br | Admin@2024 | Diretor |
| comprador1@sucalog.com.br | 443.222.111-00 | Comprador |

## 📄 Licença

MIT
