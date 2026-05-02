# CRM Sucata - Frontend

Frontend do Portal de Negócios e Inteligência de Mercado para gestão de compras de sucata ferrosa.

## 🚀 Funcionalidades

- ✅ **Autenticação com 2FA** (Google Authenticator)
- ✅ **Dashboard** com métricas e pipeline
- ✅ **Kanban de Oportunidades** (9 fases)
- ✅ **Upload de Fotos**
- ✅ **Sistema de Visitas**
- ✅ **Inteligência de Mercado**
- ✅ **Relatórios**
- ✅ **Responsivo** (Mobile/Desktop)

## 🛠️ Tecnologias

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- TanStack Query (React Query)
- Zustand (estado)
- React Router
- Axios
- Recharts (gráficos)
- React Hot Toast (notificações)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Crie um arquivo .env na raiz:
VITE_API_URL=http://localhost:3001/api

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📝 Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build
- `npm run lint` - Executa linter

## 📁 Estrutura

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes base (Button, Input, etc)
│   └── Layout.tsx   # Layout principal com sidebar
├── pages/           # Páginas da aplicação
├── hooks/           # React Query hooks
├── stores/          # Zustand stores
├── services/        # API services
├── types/           # TypeScript types
├── utils/           # Utilitários
├── App.tsx          # App principal
├── main.tsx         # Entry point
└── index.css        # Estilos globais
```

## 🔑 Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3001/api
```

## 📱 Telas

1. **Login** - Autenticação com 2FA
2. **Dashboard** - Métricas e pipeline
3. **Oportunidades** - Kanban e lista
4. **Visitas** - Agendamento e checklists
5. **Inteligência** - Concorrência e preços
6. **Relatórios** - Análises e exportações
7. **Usuários** - Gestão de equipe
8. **Configurações** - Perfil e 2FA

## 📄 Licença

MIT
