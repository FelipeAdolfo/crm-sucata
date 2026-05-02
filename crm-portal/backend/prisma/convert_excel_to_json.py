#!/usr/bin/env python3
"""
Converte o Excel de base de dados para JSON formatado para importacao.

Uso:
    python3 convert_excel_to_json.py "/caminho/para/BASE DE DADOS E INDICADORES.xlsx" 
"""

import sys
import json
import pandas as pd
from datetime import datetime

def limpar_cnpj(cnpj):
    if pd.isna(cnpj):
        return ""
    return str(cnpj).replace(r"[^\d]", "").strip()[:14]

def limpar_texto(texto):
    if pd.isna(texto):
        return ""
    return str(texto).strip()

def parse_date(date_val):
    if pd.isna(date_val):
        return None
    if isinstance(date_val, datetime):
        return date_val.isoformat() if not pd.isna(date_val) else None
    try:
        d = pd.to_datetime(date_val)
        return d.isoformat()
    except:
        return None

def parse_number(val):
    if pd.isna(val) or val == "" or val == "-" or val == " ":
        return None
    try:
        return float(str(val).replace(".", "").replace(",", "."))
    except:
        return None

def limpar_telefone(tel):
    if pd.isna(tel):
        return ""
    return str(tel).replace(r"[^\d]", "").strip()

# Mapeamento de fases
FASE_MAP = {
    "LEADS": "PRIMEIRO_CONTATO",
    "CONTATO": "SEGUNDO_CONTATO",
    "CONTATO ": "SEGUNDO_CONTATO",
    "VERIFICAÇÃO FISICA": "VISITA",
    "VISITA AGENDADA": "VISITA",
    "EM NEGOCIAÇÃO": "EM_NEGOCIACAO",
    "EM NEGOCIAÇÃO ": "EM_NEGOCIACAO",
    "CONCLUIDO COM SUCESSO": "CONCLUIDA_SUCESSO",
    "FONTE NOSSA": "CONCLUIDA_SUCESSO",
    "FORA DE PERFIL": "FORA_DE_PERFIL",
    "FORA DE PERFIL ": "FORA_DE_PERFIL",
    "BAIXA GERAÇÃO DIRECIONAR": "BAIXA_GERACAO_DIR",
    "PERDIDOS CONFLITO INTELIGENCIA": "PERDIDO_CONFLITO_INTEL",
    "PERDIDOS CONFLITO INTELIGENCIA ": "PERDIDO_CONFLITO_INTEL",
    "PERDIDOS INTELIGENCIA ": "PERDIDO_CONFLITO_INTEL",
    "PERDIDOS CONFLITO COMPRADOR": "PERDIDO_CONFLITO_COMPR",
    "PERDIDOS CONFLITO ": "PERDIDO_CONFLITO_INTEL",
}

COMPRADORES = {
    "JONATHAS": {"nome": "Jonathas", "email": "jonathas@crm-sucata.com.br", "regiao": "Regiao Centro"},
    "DANIEL": {"nome": "Daniel", "email": "daniel@crm-sucata.com.br", "regiao": "Regiao Vale"},
    "PEDRO": {"nome": "Pedro", "email": "pedro@crm-sucata.com.br", "regiao": "Regiao ABC/SP"},
    "HELVIO": {"nome": "Helvio", "email": "helvio@crm-sucata.com.br", "regiao": "Regiao Campinas"},
    "BRUNO": {"nome": "Bruno", "email": "bruno@crm-sucata.com.br", "regiao": "Regiao Sul"},
}

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 convert_excel_to_json.py \"/caminho/para/BASE DE DADOS E INDICADORES.xlsx\"")
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"Abrindo arquivo: {file_path}")

    xls = pd.ExcelFile(file_path)
    resultado = []

    for sheet_name in xls.sheet_names:
        if "BASE DE DADOS" not in sheet_name.upper():
            continue

        # Identificar comprador
        comprador_nome = sheet_name.upper().replace("BASE DE DADOS REGIÃO", "").replace("BASE DE DADOS REGIAO", "").replace("BASE DE DADOS", "").strip()
        comprador = COMPRADORES.get(comprador_nome)

        if not comprador:
            print(f"  AVISO: Comprador '{comprador_nome}' nao mapeado. Pulando {sheet_name}.")
            continue

        print(f"  Processando: {sheet_name} -> Comprador: {comprador['nome']}")

        df = pd.read_excel(file_path, sheet_name=sheet_name)

        # Encontrar nomes exatos das colunas
        cols = {c.upper().strip(): c for c in df.columns}

        def get_col(*alternativas):
            for alt in alternativas:
                if alt.upper() in cols:
                    return df[cols[alt.upper()]]
            return pd.Series([None] * len(df))

        cnpj_col = get_col("CNPJ")
        razao_col = get_col("RAZÃO SOCIAL", "RAZÃO", "RAZAO SOCIAL")
        fantasia_col = get_col("FANTASIA", "NOME FANTASIA")
        fase_col = get_col("FASE DO FUNIL")
        relato_col = get_col("RELATO")
        qtd_col = get_col("QTD (TONS\\MÊS)", "QTD (TON\\MÊS)", "QTD TONS\\MES", "QTD TONS\\MÊS", "GERAÇÃO MÊS")
        concorrente_col = get_col("CONCORRENTE")
        data_lead_col = get_col("DATA LEAD")
        data_contato_col = get_col("DATA CONTATO")
        data_final_col = get_col("DATA FINAL", "DATA FINAL ", "data final ")
        contato_col = get_col("CONTATO")
        tel1_col = get_col("TELEFONE 1", "TELEFONE 1 ", "TELEFONE PRINCIPAL")
        tel2_col = get_col("TELEFONE 2", "TELEFONE SECUNDÁRIO", "TELEFONE SECUNDARIO")
        email_col = get_col("E-MAIL", "EMAIL")
        logradouro_col = get_col("LOGRADOURO", "ENDEREÇO", "ENDEREÇO ")
        numero_col = get_col("NÚMERO", "NUMERO")
        complemento_col = get_col("COMPLEMENTO")
        bairro_col = get_col("BAIRRO")
        cidade_col = get_col("CIDADE")
        estado_col = get_col("ESTADO")
        cep_col = get_col("CEP")
        atividade_col = get_col("ATIVIDADE PRINCIPAL", "ATIVIDADEPRINCIPAL")
        capital_col = get_col("CAPITALSOCIAL", "CAPITAL SOCIAL", "CAPITAL SOCIAL ")

        for idx in range(len(df)):
            cnpj = limpar_cnpj(cnpj_col.iloc[idx])
            razao = limpar_texto(razao_col.iloc[idx])
            fantasia = limpar_texto(fantasia_col.iloc[idx])

            if not cnpj and not razao:
                continue

            fase = limpar_texto(fase_col.iloc[idx])
            stage = FASE_MAP.get(fase, "PRIMEIRO_CONTATO")

            tel1 = limpar_telefone(tel1_col.iloc[idx])
            tel2 = limpar_telefone(tel2_col.iloc[idx])
            principal_phone = tel1 or tel2
            secondary_phone = tel2 if (tel1 and tel2 and tel1 != tel2) else ""

            address_parts = [
                limpar_texto(logradouro_col.iloc[idx]),
                f"Nº {limpar_texto(numero_col.iloc[idx])}" if limpar_texto(numero_col.iloc[idx]) else "",
                limpar_texto(complemento_col.iloc[idx]),
                limpar_texto(bairro_col.iloc[idx]),
            ]
            address = ", ".join([p for p in address_parts if p])

            relato = limpar_texto(relato_col.iloc[idx])
            contato_nome = limpar_texto(contato_col.iloc[idx])
            email = limpar_texto(email_col.iloc[idx])
            opp_name = fantasia or razao or "Fonte Geradora"
            qtd = parse_number(qtd_col.iloc[idx])
            capital = parse_number(capital_col.iloc[idx])

            obs_parts = []
            if razao and fantasia and razao != fantasia:
                obs_parts.append(f"Razão Social: {razao}")
            atv = limpar_texto(atividade_col.iloc[idx])
            if atv:
                obs_parts.append(f"Atividade: {atv}")
            if contato_nome:
                obs_parts.append(f"Contato: {contato_nome}")
            if capital:
                obs_parts.append(f"Capital Social: R$ {capital:,.2f}")
            observations = "\n".join(obs_parts) or None

            fonte = {
                "name": opp_name,
                "documentNumber": cnpj,
                "razaoSocial": razao or None,
                "phone": principal_phone or None,
                "email": email or None,
                "address": address or None,
                "city": limpar_texto(cidade_col.iloc[idx]) or None,
                "state": limpar_texto(estado_col.iloc[idx]) or None,
                "zipCode": limpar_cnpj(cep_col.iloc[idx]) or None,
                "quantityGenerated": qtd * 1000 if qtd else None,  # ton -> kg
                "competitorName": limpar_texto(concorrente_col.iloc[idx]) or None,
                "stage": stage,
                "leadDate": parse_date(data_lead_col.iloc[idx]),
                "lastContactDate": parse_date(data_contato_col.iloc[idx]),
                "expectedCloseDate": parse_date(data_final_col.iloc[idx]),
                "classification": "FORA_DE_PERFIL" if stage == "FORA_DE_PERFIL" else ("BAIXA_GERACAO" if stage == "BAIXA_GERACAO_DIR" else None),
                "observations": observations,
                "contatoNome": contato_nome or None,
                "contatoPhone": secondary_phone or None,
                "relato": relato or None,
                "compradorEmail": comprador["email"],
                "compradorNome": comprador["nome"],
            }

            resultado.append(fonte)

    # Salvar JSON
    output_path = "prisma/dados_importacao.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=None)

    print(f"\n{'='*60}")
    print(f"CONCLUIDO!")
    print(f"  Total de fontes: {len(resultado)}")
    print(f"  Arquivo salvo: {output_path}")
    print(f"{'='*60}")

    # Resumo por comprador
    from collections import Counter
    emails = Counter(f["compradorEmail"] for f in resultado)
    print("\nResumo por comprador:")
    for email, count in emails.items():
        nome = next((c["nome"] for c in COMPRADORES.values() if c["email"] == email), email)
        print(f"  {nome}: {count} fontes")

    # Resumo por fase
    fases = Counter(f["stage"] for f in resultado)
    print("\nResumo por fase:")
    for fase, count in fases.items():
        print(f"  {fase}: {count}")

if __name__ == "__main__":
    main()
