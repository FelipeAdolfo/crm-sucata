# Integracao CRM Sucata -> Sygecom

## O que foi configurado

O CRM agora possui um **webhook automatico** que dispara quando uma fonte geradora de sucata atinge a fase **"Concluída com Sucesso"**.

### Como funciona

```
Comprador marca fonte como CONCLUIDA_COM_SUCESSO
                    |
                    v
    CRM detecta a mudanca de fase
                    |
                    v
    Dispara webhook para Sygecom (POST)
    Com todos os dados da fonte:
    - CNPJ, Razao Social, Nome Fantasia
    - Endereco completo
    - Telefone, Email
    - Geracao mensal (kg)
    - Tipo de sucata
    - Preco negociado
    - Concorrente
    - Comprador responsavel
```

### Dados enviados (formato JSON)

```json
{
  "codigo_externo": "uuid-do-crm",
  "cnpj": "12345678000195",
  "razao_social": "ACOS INDUSTRIA E COMERCIO LTDA",
  "nome_fantasia": "Acos Industria",
  "endereco": "Rua das Flores",
  "numero": "1500",
  "complemento": "Galpao 3",
  "bairro": "Jardim Industrial",
  "cidade": "Sao Paulo",
  "estado": "SP",
  "cep": "01001000",
  "telefone": "11999999999",
  "telefone_secundario": "1133334444",
  "email": "contato@acos.com.br",
  "website": "https://www.acos.com.br",
  "tipo_sucata": "ACO_FERROSO",
  "geracao_mensal_kg": 50000,
  "peso_medio_caixa_kg": 2000,
  "frequencia_troca": "SEMANAL",
  "comprador_atual": "Sucalog",
  "concorrente": "Sucata Brasil",
  "preco_proposto": 2850.00,
  "volume_negociado": 50000,
  "condicao_pagamento": "30_DIAS",
  "frequencia_coleta": "3x por semana",
  "data_cadastro": "2025-03-15T10:00:00Z",
  "data_conclusao": "2025-06-01T14:30:00Z",
  "comprador_responsavel": "Daniel",
  "origem": "FONTE",
  "latitude": -23.55052,
  "longitude": -46.63331,
  "atividade_principal": "Fabricacao de acos",
  "observacoes": "Fonte aprovada apos visita."  
}
```

## Como ativar a integracao

### 1. Configurar variaveis de ambiente no backend

No painel da Railway, no servico do backend, adicione estas variaveis:

| Variavel | Valor | Descricao |
|----------|-------|-----------|
| `SYGECOM_ENABLED` | `true` | Ativa a integracao |
| `SYGECOM_WEBHOOK_URL` | URL fornecida pelo Sygecom | Endpoint que recebe os dados |
| `SYGECOM_API_KEY` | Chave fornecida pelo Sygecom | Autenticacao |

### 2. O que voce PRECISA verificar com o Sygecom

O Sygecom (https://www.sygecom.com.br) e um ERP tradicional brasileiro. **Nao ha documentacao de API publica disponivel na internet**.

Voce PRECISA entrar em contato com o suporte deles e perguntar:

1. **Eles tem webhook/API para receber cadastro de fornecedores/fontes?**
   - Se SIM: peca a URL do endpoint e a chave de autenticacao
   - Se NAO: a alternativa e exportar os dados para importacao manual

2. **Qual formato de dados eles aceitam?**
   - O JSON acima e o formato padrao que configuramos
   - Eles podem precisar de campos diferentes

3. **Como eles identificam duplicatas?**
   - Por CNPJ? Por codigo interno?

### 3. Alternativas se nao houver API

Se o Sygecom nao tiver API, temos estas opcoes:

#### Opcao A: Exportacao automatica para CSV
Podemos gerar um arquivo CSV toda vez que uma fonte for concluida, para voce importar no Sygecom manualmente.

#### Opcao B: Painel de "Fontes Aprovadas"
No CRM, criamos uma tela com todas as fontes concluidas, com botao "Exportar para Sygecom" que gera um arquivo compativel.

#### Opcao C: Integracao via middleware
Usar uma ferramenta como Zapier, Make.com ou Pluga para fazer a ponte entre o CRM e o Sygecom (se o Sygecom estiver disponivel nessas plataformas).

### 4. Testar a integracao

Depois de configurar, quando um comprador mudar uma fonte para **Concluida com Sucesso**, o CRM vai:

1. Salvar a mudanca no banco
2. Registrar a atividade
3. **Disparar o webhook para o Sygecom em background** (nao bloqueia a tela)
4. Registrar o resultado (sucesso ou falha) como uma nova atividade

Voce pode verificar se funcionou em:
- CRM: Aba "Atividades" da fonte -> vai aparecer "Fonte enviada para Sygecom" ou "FALHA ao enviar para Sygecom"
- Logs do backend no Railway

### 5. Falhas e retentativas

Se o Sygecom estiver fora do ar ou retornar erro:
- O CRM **nao bloqueia** a operacao do comprador
- A falha e registrada nas atividades
- Voce pode reenviar manualmente futuramente

---

## Resumo para o suporte do Sygecom

Mande este texto para o suporte do Sygecom:

> "Tenho um CRM desenvolvido internamente que cadastra fontes geradoras de sucata. Quando uma fonte e aprovada (concluida com sucesso), preciso enviar os dados automaticamente para o Sygecom.
> 
> Meu sistema envia um POST JSON com: CNPJ, razao social, endereco, telefone, email, tipo de sucata, geracao mensal em kg, preco negociado, volume, condicao de pagamento, frequencia de coleta, e dados do comprador responsavel.
> 
> Voces tem um endpoint de webhook ou API para receber cadastro de fornecedores/fontes? Qual a URL e qual formato voces precisam?"

---

## Contato Sygecom

- Site: https://www.sygecom.com.br
- Telefone: (provavelmente na pagina de contato)
- Email: (provavelmente na pagina de contato)

Eles tem produtos: SAGI (grande porte), SGR (medio porte), Easy (pequeno porte), Cloud (nuvem). Pergunte qual versao voce usa e se ela aceita integracoes.
