FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar arquivos do backend (está em crm-portal/backend/ na raiz do repo)
COPY crm-portal/backend/package*.json ./
COPY crm-portal/backend/prisma ./prisma/
COPY crm-portal/backend/tsconfig.json ./
COPY crm-portal/backend/src ./src/

# Instalar dependências
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npx tsc --noCheck

# Expor porta
EXPOSE 3001

# Iniciar
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
