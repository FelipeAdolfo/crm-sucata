#!/usr/bin/env python3
"""
IMPORTA DADOS DO EXCEL PARA O POSTGRESQL DO CRM SUCATA

Este script importa todas as fontes geradoras de sucata diretamente
no banco PostgreSQL da Railway (ou qualquer PostgreSQL).

PRE-REQUISITOS:
    pip install psycopg2-binary bcrypt

COMO USAR NA RAILWAY:
    1. Copie a DATABASE_URL do painel Railway (PostgreSQL -> Variables)
    2. Execute:
       export DATABASE_URL="postgresql://..."
       python3 import_to_postgres.py

COMO USAR LOCAL:
    export DATABASE_URL="postgresql://user:pass@localhost:5432/crm_sucata"
    python3 import_to_postgres.py
"""

import os
import sys
import json
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from urllib.parse import urlparse

# ============================================
# CONFIGURACAO
# ============================================
DEFAULT_PASSWORD = "sucata2026"
ADMIN_PASSWORD = "admin123456"

COMPRADORES = [
    {"nome": "Jonathas", "email": "jonathas@crm-sucata.com.br", "regiao": "Regiao Centro"},
    {"nome": "Daniel", "email": "daniel@crm-sucata.com.br", "regiao": "Regiao Vale + Rio de Janeiro"},
    {"nome": "Pedro", "email": "pedro@crm-sucata.com.br", "regiao": "Regiao ABC/SP"},
    {"nome": "Helvio", "email": "helvio@crm-sucata.com.br", "regiao": "Regiao Campinas"},
    {"nome": "Bruno", "email": "bruno@crm-sucata.com.br", "regiao": "Regiao Sul"},
    {"nome": "Carlos", "email": "carlos@crm-sucata.com.br", "regiao": "Minas Gerais"},
    {"nome": "Rafael", "email": "rafael@crm-sucata.com.br", "regiao": "Espirito Santo"},
    {"nome": "Fernando", "email": "fernando@crm-sucata.com.br", "regiao": "Bahia + Goias"},
]

# Mapeamento de fases do Excel → OpportunityStage do Prisma
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

ACTIVITY_TYPES = {
    "VISITA": "VISIT_SCHEDULED",
    "PERDIDO_CONFLITO_INTEL": "LOST",
    "PERDIDO_CONFLITO_COMPR": "LOST",
    "CONCLUIDA_SUCESSO": "CONVERTED",
}


# ============================================
# CONEXAO COM O BANCO
# ============================================
def get_connection():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("ERRO: Variavel DATABASE_URL nao definida!")
        print("Exemplo: export DATABASE_URL='postgresql://user:pass@host:5432/db'")
        sys.exit(1)
    
    # Converter para formato psycopg2 se necessario
    conn = psycopg2.connect(database_url)
    conn.autocommit = False
    return conn


# ============================================
# CRIAR USUARIOS
# ============================================
def criar_usuarios(conn):
    print("\n=== CRIANDO USUARIOS ===")
    cur = conn.cursor()
    usuarios = {}
    
    # Criar tabela users se nao existir (migration padrao do Prisma)
    # Mas vamos usar INSERT direto assumindo que a tabela ja existe
    
    # Admin
    admin_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
    try:
        cur.execute("""
            INSERT INTO users (id, email, name, password, role, status, cpf, "forcePasswordChange", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, %s, %s, 'ADMIN', 'ACTIVE', '00000000000', true, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id, email
        """, ("admin@crm-sucata.com.br", "Administrador", admin_hash))
        admin = cur.fetchone()
        usuarios[admin[1]] = str(admin[0])
        print(f"  ADMIN: Administrador (admin@crm-sucata.com.br) - senha: {ADMIN_PASSWORD}")
    except Exception as e:
        # Tenta buscar usuario existente
        cur.execute("SELECT id, email FROM users WHERE email = %s", ("admin@crm-sucata.com.br",))
        row = cur.fetchone()
        if row:
            usuarios[row[1]] = str(row[0])
            print(f"  ADMIN (existente): {row[1]}")
        else:
            print(f"  ERRO ao criar admin: {e}")
    
    # Compradores
    for comp in COMPRADORES:
        try:
            user_hash = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt()).decode()
            cur.execute("""
                INSERT INTO users (id, email, name, password, role, status, cpf, "forcePasswordChange", "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), %s, %s, %s, 'BUYER', 'ACTIVE', '00000000000', true, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, email
            """, (comp["email"], comp["nome"], user_hash))
            user = cur.fetchone()
            usuarios[user[1]] = str(user[0])
            print(f"  BUYER: {comp['nome']} ({comp['email']}) - regiao: {comp['regiao']} - senha: {DEFAULT_PASSWORD}")
        except Exception as e:
            cur.execute("SELECT id, email FROM users WHERE email = %s", (comp["email"],))
            row = cur.fetchone()
            if row:
                usuarios[row[1]] = str(row[0])
                print(f"  BUYER (existente): {comp['nome']}")
            else:
                print(f"  ERRO ao criar {comp['nome']}: {e}")
    
    conn.commit()
    cur.close()
    return usuarios


# ============================================
# IMPORTAR DADOS
# ============================================
def importar_dados(conn, usuarios):
    print("\n=== IMPORTANDO FONTES GERADORAS ===")
    
    json_path = os.path.join(os.path.dirname(__file__), "dados_importacao.json")
    if not os.path.exists(json_path):
        print(f"ERRO: Arquivo nao encontrado: {json_path}")
        print("Execute primeiro: python3 convert_excel_to_json.py \"BASE DE DADOS E INDICADORES.xlsx\"")
        sys.exit(1)
    
    with open(json_path, "r", encoding="utf-8") as f:
        dados = json.load(f)
    
    print(f"  Total de fontes no JSON: {len(dados)}")
    
    cur = conn.cursor()
    
    total_importadas = 0
    total_relatos = 0
    total_contatos = 0
    total_puladas = 0
    
    # Cache de CNPJs para evitar duplicatas na mesma execucao
    cnpjs_vistos = set()
    
    for i, f in enumerate(dados):
        comprador_id = usuarios.get(f["compradorEmail"])
        if not comprador_id:
            total_puladas += 1
            continue
        
        # Evitar CNPJ duplicado na mesma execucao
        if f["documentNumber"] and f["documentNumber"] in cnpjs_vistos:
            total_puladas += 1
            continue
        if f["documentNumber"]:
            cnpjs_vistos.add(f["documentNumber"])
        
        try:
            # Criar oportunidade
            cur.execute("""
                INSERT INTO opportunities (
                    id, name, type, "documentType", "documentNumber", stage, status,
                    "assignedTo", "razaoSocial", phone, email, address, city, state,
                    "zipCode", "quantityGenerated", "competitorName", observations,
                    "leadDate", "lastContactDate", "expectedCloseDate", classification,
                    "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid(), %s, 'FONTE', 'CNPJ', %s, %s, 'ACTIVE',
                    %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    COALESCE(%s::timestamp, '2025-01-01'::timestamp), NOW()
                )
                ON CONFLICT ("documentNumber") DO NOTHING
                RETURNING id
            """, (
                f["name"][:200],
                f["documentNumber"] or f"TEMP_{datetime.now().timestamp()}_{i}",
                f["stage"],
                comprador_id,
                f["razaoSocial"],
                f["phone"],
                f["email"],
                f["address"],
                f["city"],
                f["state"],
                f["zipCode"],
                f["quantityGenerated"],
                f["competitorName"],
                f["observations"],
                f["leadDate"],
                f["lastContactDate"],
                f["expectedCloseDate"],
                f["classification"],
                f["leadDate"] or '2025-01-01'
            ))
            
            result = cur.fetchone()
            if not result:
                total_puladas += 1
                continue
            
            opp_id = str(result[0])
            total_importadas += 1
            
            # Contato principal
            if f["contatoNome"]:
                try:
                    cur.execute("""
                        INSERT INTO contacts (id, name, phone, email, role, "opportunityId", "createdAt", "updatedAt")
                        VALUES (gen_random_uuid(), %s, %s, %s, 'Contato Principal', %s, NOW(), NOW())
                    """, (f["contatoNome"], f["contatoPhone"], f["email"], opp_id))
                    total_contatos += 1
                except Exception:
                    pass  # Contato pode ter sido criado automaticamente
            
            # Relato como atividade
            if f["relato"]:
                activity_type = ACTIVITY_TYPES.get(f["stage"], "NOTE_ADDED")
                created_at = f["lastContactDate"] or f["leadDate"] or "2025-01-01"
                try:
                    cur.execute("""
                        INSERT INTO activities (id, type, description, "userId", "opportunityId", metadata, "createdAt")
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s)
                    """, (
                        activity_type,
                        f["relato"][:500],
                        comprador_id,
                        opp_id,
                        json.dumps({"source": "importacao_excel", "comprador": f["compradorNome"]}),
                        created_at
                    ))
                    total_relatos += 1
                except Exception:
                    pass
            
            # Commit a cada 100 para nao acumular muita memoria
            if (i + 1) % 100 == 0:
                conn.commit()
            
        except Exception as e:
            if "duplicate" in str(e).lower() or "violates unique" in str(e).lower():
                total_puladas += 1
            else:
                print(f"    Erro linha {i+1}: {str(e)[:80]}")
        
        if (i + 1) % 500 == 0:
            print(f"  {i+1}/{len(dados)} processadas ({total_importadas} OK, {total_puladas} puladas)...")
    
    conn.commit()
    cur.close()
    
    return {
        "total_importadas": total_importadas,
        "total_relatos": total_relatos,
        "total_contatos": total_contatos,
        "total_puladas": total_puladas
    }


# ============================================
# MAIN
# ============================================
def main():
    print("=" * 60)
    print("CRM SUCATA - IMPORTACAO PARA POSTGRESQL")
    print("=" * 60)
    print("\nEste script vai:")
    print("  1. Criar usuario ADMIN e 5 compradores")
    print("  2. Importar ~8.000 fontes geradoras de sucata")
    print("  3. Importar relatos como atividades")
    print("  4. Criar contatos quando disponivel")
    
    database_url = os.environ.get("DATABASE_URL", "")
    if not database_url:
        print("\nAVISO: DATABASE_URL nao definida!")
        print("Por favor, execute:")
        print('  export DATABASE_URL="postgresql://user:pass@host:port/db"')
        print("\nPara Railway, copie a DATABASE_URL do painel:")
        print("  PostgreSQL -> Variables -> DATABASE_URL")
        return
    
    print(f"\nConectando a: {database_url[:30]}...")
    
    conn = None
    try:
        conn = get_connection()
        print("  Conectado com sucesso!")
        
        # Verificar se tabelas existem
        cur = conn.cursor()
        cur.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('users', 'opportunities', 'contacts', 'activities')
        """)
        tabelas = [row[0] for row in cur.fetchall()]
        cur.close()
        
        print(f"  Tabelas encontradas: {tabelas}")
        
        if len(tabelas) < 4:
            print("\nERRO: Tabelas do CRM nao encontradas!")
            print("Execute primeiro as migrations do Prisma:")
            print("  npx prisma migrate deploy")
            return
        
        # Criar usuarios
        usuarios = criar_usuarios(conn)
        
        # Importar dados
        resultado = importar_dados(conn, usuarios)
        
        # Resumo
        print("\n" + "=" * 60)
        print("IMPORTACAO CONCLUIDA!")
        print("=" * 60)
        print(f"  Fontes importadas:  {resultado['total_importadas']}")
        print(f"  Relatos importados: {resultado['total_relatos']}")
        print(f"  Contatos criados:   {resultado['total_contatos']}")
        print(f"  Linhas puladas:     {resultado['total_puladas']}")
        print("\nUSUARIOS CRIADOS:")
        print(f"  admin@crm-sucata.com.br (ADMIN) - senha: {ADMIN_PASSWORD}")
        for c in COMPRADORES:
            print(f"  {c['email']} (BUYER) - senha: {DEFAULT_PASSWORD}")
        
    except Exception as e:
        print(f"\nERRO FATAL: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("\nConexao fechada.")


if __name__ == "__main__":
    main()
