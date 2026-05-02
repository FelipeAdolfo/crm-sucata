# 🛡️ Guia de Segurança - CRM Sucata

Este documento descreve todas as medidas de segurança implementadas no CRM Sucata para proteger seus dados e garantir acesso apenas a usuários autorizados.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação e Autorização](#autenticação-e-autorização)
3. [Proteção contra Ataques](#proteção-contra-ataques)
4. [Auditoria e Logs](#auditoria-e-logs)
5. [Configurações de Deploy](#configurações-de-deploy)
6. [Checklist de Segurança](#checklist-de-segurança)

---

## Visão Geral

O CRM Sucata implementa **múltiplas camadas de segurança**:

```
┌─────────────────────────────────────────────────────────┐
│  CAMADA 1: HTTPS + SSL (Railway fornece automaticamente)│
├─────────────────────────────────────────────────────────┤
│  CAMADA 2: Headers de Segurança (Helmet)                │
├─────────────────────────────────────────────────────────┤
│  CAMADA 3: Rate Limiting (Proteção contra brute force)  │
├─────────────────────────────────────────────────────────┤
│  CAMADA 4: CORS Restrito                                │
├─────────────────────────────────────────────────────────┤
│  CAMADA 5: Autenticação JWT + Refresh Tokens            │
├─────────────────────────────────────────────────────────┤
│  CAMADA 6: Aprovação de Usuários (Admin)                │
├─────────────────────────────────────────────────────────┤
│  CAMADA 7: RBAC (Controle de Acesso por Perfil)         │
├─────────────────────────────────────────────────────────┤
│  CAMADA 8: Validação de Inputs (Zod)                    │
├─────────────────────────────────────────────────────────┤
│  CAMADA 9: Sanitização de Dados                         │
├─────────────────────────────────────────────────────────┤
│  CAMADA 10: Auditoria Completa (Logs de todas ações)    │
└─────────────────────────────────────────────────────────┘
```

---

## Autenticação e Autorização

### 🔐 Fluxo de Cadastro e Aprovação

```
1. Usuário preenche cadastro
         ↓
2. Status = PENDING (aguardando aprovação)
         ↓
3. Admin recebe notificação
         ↓
4. Admin analisa e APROVA ou REJEITA
         ↓
5. Se APROVADO → Status = ACTIVE (pode logar)
   Se REJEITADO → Status = REJECTED (acesso negado)
```

### 👤 Perfis de Usuário (Roles)

| Perfil | Acesso | Descrição |
|--------|--------|-----------|
| `ADMIN` | Total | Administrador do sistema |
| `DIRECTOR` | Total | Diretor da empresa |
| `MANAGER` | Alto | Gerente de equipe |
| `INTEL_COORDINATOR` | Médio | Coordenador de inteligência |
| `ANALYST` | Médio | Analista de negócios |
| `BUYER` | Médio | Comprador |
| `PARTNER` | Básico | Sucateiro parceiro |

### 🔑 Tokens JWT

- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 7 dias
- **Armazenamento**: Hash SHA-256 no banco de dados
- **Revogação**: Possível invalidar tokens a qualquer momento

---

## Proteção contra Ataques

### 🚫 Rate Limiting

| Rota | Limite | Janela |
|------|--------|--------|
| Login | 5 tentativas | 15 minutos |
| API Geral | 100 requisições | 15 minutos |
| Upload | 20 arquivos | 1 hora |

### 🔒 Proteção contra Brute Force

- **Máximo de tentativas**: 5
- **Bloqueio**: 30 minutos após exceder limite
- **Reset**: Contador zera após login bem-sucedido

### 🛡️ Headers de Segurança (Helmet)

```http
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 🔐 Senhas

- **Mínimo**: 12 caracteres
- **Complexidade**: Maiúscula, minúscula, número e especial
- **Hash**: bcrypt com 12 rounds de salt
- **Troca obrigatória**: A cada 90 dias

---

## Auditoria e Logs

### 📝 Tudo é Registrado

Todas as ações são registradas na tabela `AuditLog`:

- Login/Logout
- Criação/Atualização/Exclusão de registros
- Mudanças de permissão
- Tentativas de acesso negadas
- Upload de arquivos

### 🚨 Níveis de Risco

| Nível | Descrição | Exemplos |
|-------|-----------|----------|
| `LOW` | Baixo risco | Login bem-sucedido, consultas |
| `MEDIUM` | Médio risco | Atualização de dados |
| `HIGH` | Alto risco | Mudança de senha, exportação |
| `CRITICAL` | Crítico | Aprovação/rejeição de usuário |

### 📊 Campos do Log

```typescript
{
  userId: string;        // Quem fez a ação
  action: string;        // Tipo de ação
  entityType: string;    // O que foi afetado
  entityId: string;      // ID do registro
  oldValues: JSON;       // Valores antigos
  newValues: JSON;       // Valores novos
  ipAddress: string;     // IP do usuário
  userAgent: string;     // Navegador/dispositivo
  timestamp: DateTime;   // Quando ocorreu
  riskLevel: string;     // Nível de risco
}
```

---

## Configurações de Deploy

### 🔧 Variáveis de Ambiente Obrigatórias

```bash
# Segurança
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
NODE_ENV=production

# Banco de Dados (Railway fornece)
DATABASE_URL=postgresql://...

# Frontend (para CORS)
FRONTEND_URL=https://seu-app-frontend.railway.app

# Configurações
GPS_VALIDATION_ENABLED=true
GPS_MAX_DISTANCE_METERS=500
```

### ⚠️ IMPORTANTE: JWT_SECRET

**NUNCA** use valores padrão ou simples! Gere uma chave forte:

```bash
# No Linux/Mac
openssl rand -base64 64

# Ou use um gerador online seguro
# https://randomkeygen.com/
```

---

## Checklist de Segurança

### Antes do Deploy

- [ ] Gerar JWT_SECRET forte (mínimo 64 caracteres)
- [ ] Configurar FRONTEND_URL corretamente
- [ ] Verificar NODE_ENV=production
- [ ] Confirmar HTTPS ativo (Railway faz isso)
- [ ] Testar rate limiting
- [ ] Verificar CORS configurado

### Após o Deploy

- [ ] Criar primeiro usuário ADMIN
- [ ] Configurar senha forte para admin
- [ ] Testar fluxo de aprovação de usuários
- [ ] Verificar logs de auditoria
- [ ] Testar bloqueio de conta
- [ ] Testar rate limiting

### Manutenção Regular

- [ ] Revisar logs de auditoria semanalmente
- [ ] Verificar tentativas de login falhas
- [ ] Atualizar dependências mensalmente
- [ ] Backup do banco de dados diariamente
- [ ] Revisar permissões de usuários

---

## Comandos Úteis

### Ver logs de auditoria (via Prisma Studio)

```bash
npx prisma studio
# Acesse http://localhost:5555
# Navegue até a tabela AuditLog
```

### Ver sessões ativas

```sql
SELECT * FROM "user_sessions" 
WHERE "isValid" = true 
ORDER BY "lastActivityAt" DESC;
```

### Suspender usuário (emergência)

```sql
UPDATE "users" 
SET "status" = 'SUSPENDED' 
WHERE "email" = 'usuario@exemplo.com';
```

---

## Contato e Suporte

Em caso de problemas de segurança:

1. Verifique os logs de auditoria
2. Verifique as sessões ativas
3. Suspenda usuários suspeitos imediatamente
4. Altere o JWT_SECRET se necessário
5. Revogue todos os tokens (logout de todos)

---

**🛡️ Seu CRM está protegido com as melhores práticas de segurança!**
