# 🚀 Deploy do CRM Sucata no Railway

## O que é o Railway?
O Railway é uma plataforma que hospeda sua aplicação na nuvem de forma simples. Ele cuida de:
- ✅ Servidor para rodar seu backend
- ✅ Banco de dados PostgreSQL
- ✅ Frontend (site)
- ✅ Certificado SSL (HTTPS seguro)
- ✅ Backup automático

---

## 📋 Passo a Passo (Muito Simples!)

### **ETAPA 1: Criar Conta no Railway** (5 minutos)

1. Acesse: https://railway.app
2. Clique em **"Start for Free"**
3. Faça login com sua conta do **GitHub** (mais fácil)
4. Confirme seu email

---

### **ETAPA 2: Instalar Railway no Seu Computador** (2 minutos)

**No Windows:**
1. Abra o Prompt de Comando (CMD) ou PowerShell
2. Cole este comando e aperte Enter:
```bash
npm install -g @railway/cli
```

**No Mac:**
1. Abra o Terminal
2. Cole este comando:
```bash
npm install -g @railway/cli
```

**Verificar se instalou:**
```bash
railway --version
```

---

### **ETAPA 3: Fazer Login** (1 minuto)

No terminal, execute:
```bash
railway login
```

Isso vai abrir o navegador. Clique em **"Authorize"**.

---

### **ETAPA 4: Preparar o Projeto** (Você já tem!)

Eu já criei todos os arquivos necessários. Eles estão na pasta `crm-portal/`.

---

### **ETAPA 5: Deploy (A Parte Mágica!)** ⭐

#### Opção A: Usando o Script Automático (Recomendado)

1. Abra o terminal na pasta `crm-portal/`
2. Execute:
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

3. Escolha a opção **1** (Deploy completo)
4. Aguarde... ⏰ (pode levar 5-10 minutos na primeira vez)

#### Opção B: Passo a Passo Manual

Se preferir fazer manualmente:

**1. Inicializar projeto:**
```bash
cd crm-portal
railway init --name "crm-sucata"
```

**2. Adicionar banco de dados PostgreSQL:**
```bash
railway add --database postgres
```

**3. Configurar variáveis de ambiente:**
```bash
railway variables set JWT_SECRET=sua_chave_secreta_aqui_123456789
railway variables set NODE_ENV=production
```

**4. Deploy do Backend:**
```bash
cd backend
railway up
cd ..
```

**5. Deploy do Frontend:**
```bash
cd frontend
railway up
cd ..
```

---

## 🔧 Configurações Importantes

### Variáveis de Ambiente Obrigatórias

Após o deploy, configure estas variáveis no Railway:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `JWT_SECRET` | Chave secreta para segurança | `minha_chave_super_secreta_123` |
| `FRONTEND_URL` | URL do seu frontend | `https://meu-crm.up.railway.app` |

**Como configurar:**
1. Acesse o dashboard do Railway
2. Clique no seu projeto
3. Vá em **"Variables"**
4. Clique **"New Variable"**
5. Adicione cada variável

---

## 🌐 Acessando sua Aplicação

Após o deploy, o Railway vai te dar URLs:

- **Frontend:** https://seu-app-frontend.up.railway.app
- **Backend API:** https://seu-app-backend.up.railway.app/api

Você pode ver as URLs no dashboard do Railway.

---

## 💰 Custo

O Railway tem plano gratuito com:
- ✅ 500 horas de execução/mês
- ✅ Banco PostgreSQL gratuito
- ✅ Certificado SSL
- ✅ Até 3 projetos

**Se precisar de mais:** Plano paga a partir de $5/mês

---

## 🆘 Solução de Problemas

### Erro: "railway command not found"
**Solução:** Reinstale o Railway CLI:
```bash
npm install -g @railway/cli
```

### Erro: "Database connection failed"
**Solução:** Verifique se o PostgreSQL foi adicionado:
```bash
railway add --database postgres
```

### Erro: "JWT_SECRET is required"
**Solução:** Configure a variável:
```bash
railway variables set JWT_SECRET=sua_chave_aqui
```

### Ver logs do servidor:
```bash
railway logs
```

### Abrir dashboard:
```bash
railway open
```

---

## 📱 Configurar PWA no Celular

Depois do deploy, você pode instalar o app no celular:

1. Acesse a URL do frontend no celular
2. No Chrome/Safari, clique em **"Adicionar à Tela Inicial"**
3. Pronto! O app vai funcionar como aplicativo nativo

---

## 🔄 Atualizar a Aplicação

Quando fizer alterações no código:

```bash
cd crm-portal/backend
railway up

cd ../frontend
railway up
```

---

## ✅ Checklist Final

- [ ] Conta criada no Railway
- [ ] Railway CLI instalado
- [ ] Login realizado
- [ ] Projeto inicializado
- [ ] PostgreSQL adicionado
- [ ] Variáveis configuradas
- [ ] Deploy do backend feito
- [ ] Deploy do frontend feito
- [ ] URLs anotadas
- [ ] Testado no navegador

---

## 📞 Precisa de Ajuda?

Se tiver qualquer problema:
1. Execute: `railway logs` (mostra os erros)
2. Acesse o dashboard: `railway open`
3. Ou me chame que ajudo! 😊

---

**🎉 Parabéns! Seu CRM Sucata vai estar online na nuvem!**
