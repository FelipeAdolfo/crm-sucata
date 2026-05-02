# CRM Sucata - Checklist de Preparacao para Nuvem Railway

## Resumo das Correcoes Realizadas

### 1. Configuracao de Deploy para Railway Cloud

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `frontend/nginx.conf` | Reescrito | Removeu proxy `/api` para `backend:3001` que so funcionava no Docker local |
| `frontend/Dockerfile` | Atualizado | Adicionou `ARG VITE_API_URL` para receber URL do backend em tempo de build |
| `frontend/.env.production` | Criado | Template de variaveis de ambiente para producao |
| `backend/railway.toml` | Criado | Configuracao do servico backend na Railway |
| `frontend/railway.toml` | Criado | Configuracao do servico frontend na Railway |
| `docker-compose.yml` | Atualizado | Apenas para desenvolvimento local (NAO usar na Railway) |

### 2. Backend - CORS e Seguranca para Nuvem

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `backend/src/server.ts` | Atualizado | CORS agora aceita multiplas origens via `FRONTEND_URL` e permite subdominios `.railway.app` |
| `backend/src/server.ts` | Atualizado | Adicionado `serveUploads()` para arquivos estaticos apenas em desenvolvimento |

### 3. Upload de Arquivos - Suporte a Nuvem (Cloudinary)

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `backend/src/utils/upload.ts` | Criado | Utilitario que detecta ambiente e usa Cloudinary em producao ou disco local em desenvolvimento |
| `backend/src/routes/documents.ts` | Reescrito | Usa novo sistema de upload com suporte a Cloudinary |
| `backend/src/routes/photos.ts` | Verificado | Ja usa URL externa (Cloudinary), compativel com nuvem |

### 4. Banco de Dados - Schema Atualizado

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `prisma/schema.prisma` | Atualizado | Adicionado `CALL`, `CALL_COMPLETED`, `CALL_MISSED`, `DOCUMENT_UPLOADED`, `DOCUMENT_SIGNED` ao enum `ActivityType` |

### 5. Frontend - Tipos Atualizados

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `frontend/src/types/index.ts` | Atualizado | Adicionados novos tipos de atividade de chamada e documento |
| `frontend/src/types/index.ts` | Atualizado | Adicionadas interfaces `Document`, `Call`, `CallStats` |
| `frontend/src/config/api.ts` | Criado | Configuracao centralizada da API |
| `frontend/src/services/api.ts` | Atualizado | Usa configuracao centralizada com timeout e headers |

### 6. Arquivos Auxiliares

| Arquivo | Acao | Motivo |
|---------|------|--------|
| `.env.example` | Criado | Documentacao de todas as variaveis de ambiente necessarias |
| `README-DEPLOY-CLOUD.md` | Criado | Guia completo de deploy na Railway passo a passo |
| `backend/.dockerignore` | Criado | Exclui arquivos desnecessarios do build |
| `frontend/.dockerignore` | Criado | Exclui arquivos desnecessarios do build |

## Arquitetura na Nuvem Railway

```
+-----------------------------------------------------+
|                    USUARIO                          |
|              (Navegador/Celular)                     |
+--------+--------------------------------------------+
         | HTTPS
         v
+------------------+     +---------------------------+
|    FRONTEND      |     |         BACKEND           |
|   (Nginx/SPA)    |     |      (Node.js/Express)     |
|  *.railway.app   |<--->|     *.railway.app         |
|                  | API |                           |
|  - React SPA     |     |  - Prisma ORM             |
|  - Static Files  |     |  - JWT Auth               |
|  - Vite Build    |     |  - Cloudinary Uploads     |
+--------+---------+     ++--------+--------+--------+
                                  |        |
                         +--------v--+  +--v----------+
                         |PostgreSQL |  | Cloudinary  |
                         |  (Railway) |  |  (Uploads)  |
                         +------------+  +-------------+
```

## Variaveis de Ambiente - Resumo

### Backend (Railway)
| Variavel | Valor de Exemplo |
|----------|-----------------|
| `DATABASE_URL` | `postgresql://...` (fornecido pelo Railway PostgreSQL) |
| `JWT_SECRET` | `minha-chave-super-secreta-32-chars` |
| `JWT_REFRESH_SECRET` | `outra-chave-super-secreta-32-chars` |
| `FRONTEND_URL` | `https://meu-crm.railway.app` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `CLOUDINARY_CLOUD_NAME` | `meu-cloud` (opcional, para uploads) |
| `CLOUDINARY_API_KEY` | `1234567890` (opcional) |
| `CLOUDINARY_API_SECRET` | `secreto` (opcional) |

### Frontend (Railway)
| Variavel | Valor de Exemplo |
|----------|-----------------|
| `VITE_API_URL` | `https://meu-api.railway.app/api` |
| `VITE_APP_NAME` | `CRM Sucata` |
| `VITE_APP_VERSION` | `1.0.0` |

## Passos para Deploy

1. **Criar projeto** no Railway
2. **Adicionar PostgreSQL** ao projeto
3. **Deploy Backend**: New Service -> Dockerfile -> pasta `/backend` -> configurar variaveis
4. **Deploy Frontend**: New Service -> Dockerfile -> pasta `/frontend` -> configurar `VITE_API_URL`
5. **Configurar CORS**: Atualizar `FRONTEND_URL` no backend com URL real do frontend
6. **Testar**: Acessar URL do frontend e verificar funcionamento

## Diferencas: Local vs Nuvem

| Aspecto | Local (Docker) | Nuvem (Railway) |
|---------|---------------|-----------------|
| Frontend | `http://localhost` | `https://*.railway.app` |
| Backend | `http://localhost:3001` | `https://*.railway.app` |
| Comunicacao | Proxy Nginx interno | HTTPS direto entre servicos |
| Uploads | Disco local (`uploads/`) | Cloudinary (persistente) |
| Banco | Container Docker | Railway PostgreSQL |
| SSL | Nao | Sim (automatico) |
| Build | Docker Compose | Railway Dockerfile |
