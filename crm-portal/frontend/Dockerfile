# Dockerfile para Frontend React - Railway Cloud
FROM node:20-alpine AS builder

# Diretorio de trabalho
WORKDIR /app

# Argumento de build para URL da API
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copiar arquivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar codigo fonte
COPY . .

# Build da aplicacao (Vite usa VITE_API_URL automaticamente)
RUN npm run build

# Imagem final com Nginx
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracao nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expor porta
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
