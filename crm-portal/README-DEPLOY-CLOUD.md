# CRM Sucata - Deploy na Nuvem (Railway)

Este guia explica como fazer deploy do CRM Sucata na Railway para rodar 100% na internet.

## Arquitetura na Nuvem

```
+------------------+         HTTPS          +------------------+
|                  |  ------------------->  |                  |
|  FRONTEND (Nginx)|                        |  BACKEND (Node)  |
|  seu-app.railway |                        |  seu-api.railway |
|  .app            |                        |  .app            |
|                  |                        |                  |
|  React SPA       |      API Calls         |  Express +       |
|  Static Files    | <--------------------- |  Prisma +        |
|                  |   (axios -> /api/*)    |  PostgreSQL      |
+------------------+                        +--------+---------+
                                                     |
                                            +--------+---------+
                                            |                  |
                                            |  PostgreSQL DB   |
                                            |  (Railway Add-on)|
                                            |                  |
                                            +------------------+
```

**Comunicacao:**
- Frontend chama Backend pela URL publica (HTTPS)
- Backend conecta no PostgreSQL (internal network)
- NAO ha proxy reverso entre frontend e backend

## Pre-requisitos

1. Conta na Railway (https://railway.app)
2. CLI do Railway instalada: `npm i -g @railway/cli`
3. Projeto criado no painel Railway

## Passo a Passo

### 1. Criar Projeto na Railway

1. Acesse https://railway.app/dashboard
2. Clique em "New Project"
3. Escolha "Empty Project"
4. Anote o nome do projeto

### 2. Banco de Dados PostgreSQL

1. No projeto, clique em "New"
2. Escolha "Database" -> "Add PostgreSQL"
3. Aguarde a criacao (status "Running")
4. Clique no banco -> "Variables"
5. Copie a `DATABASE_URL` (vamos usar no backend)

### 3. Deploy do Backend

1. No projeto, clique em "New" -> "Service"
2. Escolha "Dockerfile"
3. Selecione a pasta `/backend`
4. Configure as variaveis de ambiente:

```
DATABASE_URL=<copiar do PostgreSQL>
JWT_SECRET=<gerar-uma-chave-forte-32-caracteres>
JWT_REFRESH_SECRET=<gerar-outra-chave-forte-32-caracteres>
FRONTEND_URL=https://seu-frontend.railway.app
NODE_ENV=production
PORT=3001
```

5. Clique em "Deploy"
6. Aguarde o build e deploy
7. Anote a URL publica do backend (ex: `https://crm-sucata-api.up.railway.app`)

### 4. Deploy do Frontend

1. No projeto, clique em "New" -> "Service"
2. Escolha "Dockerfile"
3. Selecione a pasta `/frontend`
4. Configure as variaveis de ambiente:

```
VITE_API_URL=https://seu-backend.up.railway.app/api
VITE_APP_NAME=CRM Sucata
VITE_APP_VERSION=1.0.0
```

5. Clique em "Deploy"
6. Aguarde o build e deploy
7. Anote a URL publica do frontend

### 5. Configurar CORS no Backend

1. Volte no servico do Backend
2. Atualize a variavel `FRONTEND_URL` com a URL real do frontend:

```
FRONTEND_URL=https://seu-frontend.up.railway.app
```

3. Redeploy automatico

### 6. Testar

1. Acesse a URL do frontend
2. Faca login com as credenciais padrao (ADMIN)
3. Verifique se todas as funcionalidades estao funcionando

## Variaveis de Ambiente - Resumo

### Backend

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | URL do PostgreSQL |
| `JWT_SECRET` | Sim | Chave secreta JWT (min 32 chars) |
| `JWT_REFRESH_SECRET` | Sim | Chave secreta refresh token |
| `FRONTEND_URL` | Sim | URL do frontend (para CORS) |
| `NODE_ENV` | Sim | production |
| `PORT` | Nao | Padrao: 3001 |
| `UPLOAD_DIR` | Nao | Padrao: uploads |
| `MAX_FILE_SIZE` | Nao | Padrao: 10MB |

### Frontend

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| `VITE_API_URL` | Sim | URL completa do backend + /api |
| `VITE_APP_NAME` | Nao | Nome do app |
| `VITE_APP_VERSION` | Nao | Versao do app |

## Troubleshooting

### Erro CORS
- Verifique se `FRONTEND_URL` no backend esta com a URL correta do frontend
- A Railway gera URLs do tipo `*.up.railway.app` - o backend aceita automaticamente

### Frontend nao conecta na API
- Verifique `VITE_API_URL` - deve ser a URL completa com `/api` no final
- Exemplo correto: `https://meu-api.up.railway.app/api`

### Erro 500 no Backend
- Verifique os logs no painel Railway
- Confirme que `DATABASE_URL` esta correta
- Verifique se `JWT_SECRET` tem pelo menos 32 caracteres

### Banco de dados nao conecta
- Verifique se o PostgreSQL esta com status "Running"
- Copie a `DATABASE_URL` exata das variaveis do banco
- O Prisma migrate roda automaticamente no startup

### Health Check Falha
- O backend expoe `/health` para verificacao
- O frontend responde em `/` com 200 OK
- Verifique os logs se health check falha repetidamente

## Comandos Uteis (CLI Railway)

```bash
# Login
railway login

# Linkar projeto
railway link

# Ver logs
railway logs

# Redeploy
railway up

# Status
railway status
```

## Diferenca: Local vs Nuvem

| Aspecto | Local (Docker) | Nuvem (Railway) |
|---------|---------------|-----------------|
| Frontend | http://localhost | https://*.railway.app |
| Backend | http://localhost:3001 | https://*.railway.app |
| Banco | Container local | Railway PostgreSQL |
| Comunicacao | Proxy Nginx | HTTPS direto |
| SSL | Nao | Sim (automatico) |
| Arquivos | Volume Docker | Volume efemero |
