# RELATORIO DE ALTERACOES - TIPOS DE OPORTUNIDADE
## Data: 26 de Abril de 2026
## Status: IMPLEMENTADO

---

## RESUMO

Implementados **5 tipos de oportunidades** com campos especificos para cada tipo, conforme solicitado pelo usuario.

---

## NOVOS TIPOS DE OPORTUNIDADE

| Tipo | Codigo | Descricao |
|------|--------|-----------|
| Leilao - Lote Spot | LEILAO_LOTE_SPOT | Compra por meio de leilao, material em lote unico |
| Leilao - Geracao Continua | LEILAO_GERACAO_CONTINUA | Compra por leilao, geracao continua de material |
| Fonte Geradora | FONTE | Industria geradora de sucata com fornecimento regular |
| Sucateiro | SUCATEIRO | Parceiro sucateiro que vende material |
| Lote Spot | LOTE_SPOT | Compra pontual de lote especifico |

---

## NOVOS CAMPOS ADICIONADOS

### Campos gerais (para todos os tipos)
- `website` - Site da empresa
- `responsibleName` - Nome do responsavel
- `responsibleRole` - Cargo do responsavel
- `responsiblePhone` - Celular do responsavel
- `observations` - Observacoes gerais

---

## TELAS MODIFICADAS

### 1. ModalNewOpportunity.tsx (CADASTRO)
- Adicionada **selecao de tipo** em formato de radio cards com descricao
- Campos de **Responsavel** aparecem automaticamente quando tipo = FONTE
- Campo **Website** aparece quando tipo = FONTE
- Campos de **Data e Horario da Visita** para Fonte
- Campo **Observacoes** com placeholder contextual por tipo

### 2. TabInfo.tsx (VISUALIZACAO)
- Mostra **Tipo de Oportunidade** com label completo
- Nova secao **"Informacoes da Empresa"** com:
  - Website (clicavel)
  - Nome do Responsavel + Cargo
  - Celular do Responsavel
  - Observacoes

### 3. Opportunities.tsx (LISTA)
- Atualizados labels dos tipos nos filtros e tabela

### 4. OpportunityDetail.tsx (DETALHE)
- Atualizados labels dos tipos no header

### 5. Reports.tsx (RELATORIOS)
- Atualizados labels dos tipos no grafico

---

## BACKEND MODIFICADO

### routes/opportunities.ts
- Aceita novos campos no POST (create)
- Aceita novos campos no PUT (update)
- Mantem validacao e formatacao de CPF/CNPJ

### prisma/schema.prisma
- Enum OpportunityType atualizado com 5 novos valores
- Novos campos no modelo Opportunity:
  - website (String?)
  - responsibleName (String?)
  - responsibleRole (String?)
  - responsiblePhone (String?)
  - observations (String?)

---

## TIPOS TYPESCRIPT ATUALIZADOS

### frontend/src/types/index.ts
- OpportunityType atualizado
- Interface Opportunity com novos campos opcionais

### frontend/src/services/opportunities.ts
- Interfaces CreateOpportunityData e UpdateOpportunityData atualizadas

---

## EXEMPLO DE USO - TIPO "FONTE"

Cadastro de oportunidade tipo Fonte com dados reais:

```
Tipo: Fonte Geradora (Industria)
Razao Social: TORCISAO COMERCIAL E INDUSTRIAL DE ACOS LTDA
CNPJ: XX.XXX.XXX/XXXX-XX
Website: www.torcisao.com.br
Endereco: Rua. Angela Rosalina Guimaraes, 3975 - Represa, Ribeirao Pires - SP, 09414-500

Responsavel: Andre Pini
Cargo: Gerente de Fabrica
Celular: (11) 9 4585-3404

Observacoes:
"Geramos 2 a 3 cacambas de sucata ferrosa por mes 
e 1 cacamba de carepa de aco. Combinar melhor data 
na semana que vem para visita."

Visita Agendada: [data a combinar]
```

---

## ARQUIVOS ALTERADOS

1. prisma/schema.prisma
2. backend/src/routes/opportunities.ts
3. frontend/src/types/index.ts
4. frontend/src/services/opportunities.ts
5. frontend/src/pages/Opportunities.tsx
6. frontend/src/pages/OpportunityDetail.tsx
7. frontend/src/pages/Reports.tsx
8. frontend/src/components/opportunities/ModalNewOpportunity.tsx
9. frontend/src/components/opportunities/TabInfo.tsx

---

## STATUS: PRONTO PARA DEPLOY
