#!/bin/bash
# ============================================================================
# SCRIPT DE AJUDA PARA DEPLOY NA RAILWAY - CRM SUCATA
# ============================================================================
# Este script NAO faz deploy automatico, mas guia voce pelo processo
# passo a passo com os comandos exatos para copiar e colar
# ============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[PASSO $1]${NC} $2"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

wait_for_user() {
    echo ""
    read -p "Pressione ENTER quando estiver pronto para continuar..."
    echo ""
}

# ============================================================================
# CHECAGEM INICIAL
# ============================================================================
clear
print_header "CRM SUCATA - ASSISTENTE DE DEPLOY NA RAILWAY"

echo "Este script vai te ajudar a fazer deploy passo a passo."
echo "Voce precisa ter:"
echo "  1. Conta na Railway (https://railway.app)"
echo "  2. Git instalado no computador"
echo "  3. Node.js instalado (para a CLI do Railway)"
echo ""
read -p "Voce ja tem conta na Railway? (s/n): " has_account

if [ "$has_account" != "s" ] && [ "$has_account" != "S" ]; then
    print_info "Por favor, acesse https://railway.app e crie sua conta primeiro."
    print_info "Voce pode usar sua conta do GitHub para logar."
    exit 0
fi

# ============================================================================
# PASSO 1: INSTALAR CLI DO RAILWAY
# ============================================================================
print_step "1" "Instalar a CLI do Railway"
print_info "A CLI (Command Line Interface) permite controlar a Railway pelo terminal."
echo ""
echo "Comando para instalar:"
echo ""
echo -e "${YELLOW}  npm install -g @railway/cli${NC}"
echo ""

read -p "Ja instalou a CLI? (s/n): " has_cli
if [ "$has_cli" != "s" ] && [ "$has_cli" != "S" ]; then
    print_info "Execute o comando acima no terminal."
    print_info "Depois execute este script novamente."
    exit 0
fi

# ============================================================================
# PASSO 2: LOGIN NA RAILWAY
# ============================================================================
print_step "2" "Fazer login na Railway"
print_info "Voce precisa autenticar sua conta."
echo ""
echo "Comando:"
echo -e "${YELLOW}  railway login${NC}"
echo ""
echo "Isso vai abrir o navegador para voce confirmar o login."
wait_for_user

# ============================================================================
# PASSO 3: INICIALIZAR PROJETO
# ============================================================================
print_step "3" "Criar/Linkar projeto na Railway"
print_info "Vamos criar um novo projeto na Railway."
echo ""
echo "Comandos:"
echo -e "${YELLOW}  cd $PROJECT_DIR${NC}"
echo -e "${YELLOW}  railway init${NC}"
echo ""
echo "Quando executar 'railway init':"
echo "  - Escolha 'Empty Project'"
echo "  - De um nome ao projeto (ex: crm-sucata)"
echo ""
wait_for_user

# ============================================================================
# PASSO 4: ADICIONAR BANCO DE DADOS
# ============================================================================
print_step "4" "Adicionar PostgreSQL ao projeto"
print_info "O CRM precisa de um banco de dados PostgreSQL."
echo ""
echo "Pelo site da Railway (mais facil):"
echo "  1. Acesse https://railway.app/dashboard"
echo "  2. Clique no seu projeto"
echo "  3. Clique em 'New' -> 'Database' -> 'Add PostgreSQL'"
echo "  4. Aguarde o status ficar 'Running'"
echo ""
echo "OU pelo terminal (mais avancado):"
echo -e "${YELLOW}  railway add --database postgres${NC}"
echo ""
print_warn "ANOTE A DATABASE_URL! Voce vai precisar dela depois."
echo ""
wait_for_user

# ============================================================================
# PASSO 5: DEPLOY DO BACKEND
# ============================================================================
print_step "5" "Fazer deploy do Backend"
print_info "O backend e a API do CRM (Node.js + Express + Prisma)."
echo ""
echo "PELO SITE DA RAILWAY (recomendado para iniciantes):"
echo ""
echo "  1. No seu projeto Railway, clique em 'New' -> 'Service'"
echo "  2. Escolha 'Deploy from GitHub repo' (se repo esta no GitHub)"
echo "     OU 'Deploy from Local' (se quer subir da pasta local)"
echo "  3. Se escolher 'Deploy from Local':"
echo "     - Selecione a pasta: ${YELLOW}$PROJECT_DIR${NC}"
echo "     - Escolha 'Dockerfile' como metodo de build"
echo "     - Selecione: ${YELLOW}backend/Dockerfile${NC}"
echo "  4. Configure as variaveis de ambiente (ver proxima secao)"
echo "  5. Clique 'Deploy'"
echo ""
echo "PELO TERMINAL (para usuarios avancados):"
echo -e "${YELLOW}  cd $PROJECT_DIR/backend${NC}"
echo -e "${YELLOW}  railway up${NC}"
echo ""
wait_for_user

# ============================================================================
# PASSO 5b: CONFIGURAR VARIAVEIS DO BACKEND
# ============================================================================
print_header "VARIAVEIS DE AMBIENTE DO BACKEND"
print_warn "Configure estas variaveis no painel da Railway (aba 'Variables'):"
echo ""
echo -e "${CYAN}DATABASE_URL${NC}"
echo "  -> Copie do servico PostgreSQL (aba Variables do banco)"
echo "  -> Exemplo: postgresql://user:pass@host:port/dbname"
echo ""
echo -e "${CYAN}JWT_SECRET${NC}"
echo "  -> Digite uma senha forte (minimo 32 caracteres)"
echo "  -> Exemplo: crm-sucata-jwt-super-secreto-2026"
echo ""
echo -e "${CYAN}JWT_REFRESH_SECRET${NC}"
echo "  -> Outra senha forte diferente da anterior"
echo "  -> Exemplo: crm-sucata-refresh-super-secreto-2026"
echo ""
echo -e "${CYAN}FRONTEND_URL${NC}"
echo "  -> Por enquanto deixe em branco (vamos voltar aqui depois)"
echo "  -> Depois voce coloca a URL real do frontend"
echo ""
echo -e "${CYAN}NODE_ENV${NC}"
echo "  -> production"
echo ""
echo -e "${CYAN}PORT${NC}"
echo "  -> 3001"
echo ""
print_info "IMPORTANTE: A Railway fornece automaticamente a DATABASE_URL"
print_info "quando voce cria o PostgreSQL dentro do mesmo projeto."
echo ""
wait_for_user

# ============================================================================
# PASSO 6: ANOTAR URL DO BACKEND
# ============================================================================
print_step "6" "Anotar URL publica do Backend"
print_info "Depois do deploy do backend, a Railway gera uma URL publica."
echo ""
echo "Onde encontrar:"
echo "  1. No painel Railway, clique no servico do backend"
echo "  2. Na aba 'Settings' ou 'Deployments', procure o campo 'Domain'"
echo "  3. Anote a URL (ex: https://crm-sucata-api.up.railway.app)"
echo ""
print_warn "Voce PRECISA desta URL para configurar o frontend!"
echo ""
wait_for_user

# ============================================================================
# PASSO 7: DEPLOY DO FRONTEND
# ============================================================================
print_step "7" "Fazer deploy do Frontend"
print_info "O frontend e a interface web do CRM (React + Vite + Nginx)."
echo ""
echo "PELO SITE DA RAILWAY:"
echo ""
echo "  1. No projeto, clique em 'New' -> 'Service'"
echo "  2. Escolha 'Deploy from GitHub repo' ou 'Deploy from Local'"
echo "  3. Se 'Deploy from Local':"
echo "     - Selecione a pasta: ${YELLOW}$PROJECT_DIR${NC}"
echo "     - Escolha 'Dockerfile' como metodo de build"
echo "     - Selecione: ${YELLOW}frontend/Dockerfile${NC}"
echo "  4. Configure a variavel VITE_API_URL"
echo "  5. Clique 'Deploy'"
echo ""
print_header "VARIAVEIS DO FRONTEND"
print_warn "Configure no painel Railway (aba 'Variables'):"
echo ""
echo -e "${CYAN}VITE_API_URL${NC}"
echo "  -> URL do backend + /api"
echo "  -> Exemplo: https://seu-backend.up.railway.app/api"
echo "  -> Use a URL que voce anotou no passo anterior!"
echo ""
echo -e "${CYAN}VITE_APP_NAME${NC}"
echo "  -> CRM Sucata"
echo ""
echo -e "${CYAN}VITE_APP_VERSION${NC}"
echo "  -> 1.0.0"
echo ""
wait_for_user

# ============================================================================
# PASSO 8: CONFIGURAR CORS
# ============================================================================
print_step "8" "Configurar CORS no Backend"
print_info "O backend precisa saber qual e o endereco do frontend."
echo ""
echo "  1. Va no servico do backend no painel Railway"
echo "  2. Na aba 'Variables', atualize FRONTEND_URL"
echo "  3. Coloque a URL publica do frontend"
echo "  4. Exemplo: https://crm-sucata-web.up.railway.app"
echo ""
echo "Se quiser permitir varias origens, separe por virgula:"
echo "  Exemplo: https://app1.up.railway.app, https://app2.up.railway.app"
echo ""
print_info "O backend reinicia automaticamente quando voce muda variaveis."
echo ""
wait_for_user

# ============================================================================
# PASSO 9: VERIFICAR HEALTH CHECKS
# ============================================================================
print_step "9" "Verificar se tudo esta funcionando"
print_info "Teste as URLs para confirmar que os servicos estao no ar."
echo ""
echo "Teste o backend (cole no navegador):"
echo -e "${YELLOW}  https://SUA-URL-BACKEND.up.railway.app/health${NC}"
echo ""
echo "Deve retornar algo como:"
echo '  {"status":"OK","version":"1.0.0"}'
echo ""
echo "Teste o frontend (cole no navegador):"
echo -e "${YELLOW}  https://SUA-URL-FRONTEND.up.railway.app${NC}"
echo ""
echo "Deve mostrar a tela de login do CRM."
echo ""
wait_for_user

# ============================================================================
# PASSO 10: PRIMEIRO ACESSO
# ============================================================================
print_step "10" "Primeiro acesso e criar usuario ADMIN"
print_info "O CRM precisa de um usuario administrador inicial."
echo ""
echo "  1. Acesse o frontend pela URL publica"
echo "  2. Clique em 'Cadastrar' e crie um usuario"
echo "  3. Por padrao, novos usuarios ficam com status PENDING (pendente)"
echo "  4. Voce precisa aprovar o usuario como ADMIN"
echo ""
print_warn "APROVACAO MANUAL NO BANCO (provisoria):"
echo ""
echo "Como ainda nao ha usuario ADMIN aprovado, voce precisa aprovar"
echo "direto no banco de dados. Pela Railway:"
echo ""
echo "  1. No painel Railway, va no servico PostgreSQL"
echo "  2. Clique em 'Data' ou 'Query'"
echo "  3. Execute este SQL:"
echo ""
echo -e "${YELLOW}     UPDATE users${NC}"
echo -e "${YELLOW}     SET status = 'ACTIVE', role = 'ADMIN'${NC}"
echo -e "${YELLOW}     WHERE email = 'SEU_EMAIL@gmail.com';${NC}"
echo ""
print_info "Depois disso, faca login normalmente."
echo ""
wait_for_user

# ============================================================================
# RESUMO FINAL
# ============================================================================
print_header "RESUMO DO DEPLOY"

echo -e "${GREEN}PARABENS!${NC} Se voce chegou ate aqui, seu CRM esta no ar!"
echo ""
echo "Links importantes:"
echo "  - Frontend: https://SUA-URL-FRONTEND.up.railway.app"
echo "  - Backend API: https://SUA-URL-BACKEND.up.railway.app/api"
echo "  - Health Check: https://SUA-URL-BACKEND.up.railway.app/health"
echo ""
echo "Proximos passos:"
echo "  1. Acesse o frontend e faca login como ADMIN"
echo "  2. Aprove os usuarios pendentes em 'Usuarios > Aprovacoes'"
echo "  3. Configure precos e parametros no sistema"
echo "  4. Cadastre oportunidades"
echo ""
echo "Para atualizar o deploy depois:"
echo "  - Railway faz deploy automatico quando voce sobe codigo novo no GitHub"
echo "  - Ou use: railway up (na pasta do servico)"
echo ""
echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  BOM TRABALHO! CRM SUCATA NA NUVEM!${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
