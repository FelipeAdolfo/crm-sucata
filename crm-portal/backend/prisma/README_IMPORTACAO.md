# Importacao de Dados - CRM Sucata

Este guia explica como importar sua base de dados do Excel para o CRM Sucata.

## O que sera importado

| Item | Quantidade | Descricao |
|------|-----------|-----------|
| Fontes geradoras | ~7.750 | Empresas que geram sucata, com CNPJ, endereco, telefone |
| Relatos | ~1.100 | Historico de relacionamento convertido em atividades |
| Contatos | ~20 | Pessoas de contato identificadas nas planilhas |
| Usuarios compradores | 5 | Jonathas, Daniel, Pedro, Helvio, Bruno |
| Usuario admin | 1 | Administrador do sistema |

## Arquivos necessarios

1. `dados_importacao.json` - JSON gerado a partir do Excel (ja criado)
2. `import_to_postgres.py` - Script que importa para o PostgreSQL

## Passo a passo

### Passo 1: Pre-requisitos no seu computador

Instale Python e o driver PostgreSQL:

```bash
# Verifique se tem Python
python3 --version

# Instale o driver do PostgreSQL
pip3 install psycopg2-binary bcrypt
```

### Passo 2: Copiar a DATABASE_URL da Railway

1. Acesse https://railway.app/dashboard
2. Clique no seu projeto CRM Sucata
3. Clique no servico PostgreSQL
4. Va na aba **Variables**
5. Copie o valor de `DATABASE_URL`
6. Vai ser algo como: `postgresql://postgres:senha@container.railway.app:5432/railway`

### Passo 3: Executar a importacao

No terminal do seu computador:

```bash
# Entre na pasta do backend
cd crm-portal/backend

# Defina a DATABASE_URL (cole o valor que copiou da Railway)
export DATABASE_URL="postgresql://postgres:SUA_SENHA@SEU_HOST.railway.app:5432/railway"

# Execute a importacao
python3 prisma/import_to_postgres.py
```

O script vai mostrar o progresso e criar:
- Usuario ADMIN com senha `admin123456`
- 5 compradores com senha `sucata2026`
- Todas as fontes do Excel atribuidas ao comprador correto

### Passo 4: Verificar no CRM

1. Acesse o frontend do CRM na URL da Railway
2. Faca login com: `admin@crm-sucata.com.br` / `admin123456`
3. Va em **Oportunidades** - voce deve ver todas as fontes importadas
4. Va em **Usuarios** - voce deve ver os 5 compradores

### Mapeamento de fases

As fases do seu Excel foram convertidas para o CRM:

| Sua planilha (Excel) | CRM Sucata |
|---------------------|------------|
| LEADS | PRIMEIRO_CONTATO |
| CONTATO | SEGUNDO_CONTATO |
| VERIFICACAO FISICA | VISITA |
| VISITA AGENDADA | VISITA |
| EM NEGOCIACAO | EM_NEGOCIACAO |
| CONCLUIDO COM SUCESSO | CONCLUIDA_SUCESSO |
| FONTE NOSSA | CONCLUIDA_SUCESSO |
| FORA DE PERFIL | FORA_DE_PERFIL |
| BAIXA GERACAO DIRECIONAR | BAIXA_GERACAO_DIR |
| PERDIDOS CONFLITO INTELIGENCIA | PERDIDO_CONFLITO_INTEL |
| PERDIDOS CONFLITO COMPRADOR | PERDIDO_CONFLITO_COMPR |

### Dados por comprador

| Comprador | Regiao | Fontes importadas |
|-----------|--------|------------------|
| Jonathas | Centro | 865 |
| Daniel | Vale | 1.915 |
| Pedro | ABC/SP | 2.752 |
| Helvio | Campinas | 1.741 |
| Bruno | Sul | 799 |

### Se precisar refazer a importacao

Para limpar e reimportar:

```bash
# Conecte no PostgreSQL da Railway (precisa do psql instalado)
psql $DATABASE_URL

# Execute no prompt SQL:
TRUNCATE TABLE activities, contacts, opportunities CASCADE;
DELETE FROM users WHERE email != 'admin@crm-sucata.com.br';

# Depois execute o import novamente
python3 prisma/import_to_postgres.py
```
