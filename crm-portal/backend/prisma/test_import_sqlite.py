#!/usr/bin/env python3
"""
TESTE LOCAL - Importa dados em SQLite para validar o script
"""

import sqlite3
import json
import os
import bcrypt
from datetime import datetime

DEFAULT_PASSWORD = "sucata2026"
ADMIN_PASSWORD = "admin123456"

COMPRADORES = [
    {"nome": "Jonathas", "email": "jonathas@crm-sucata.com.br"},
    {"nome": "Daniel", "email": "daniel@crm-sucata.com.br"},
    {"nome": "Pedro", "email": "pedro@crm-sucata.com.br"},
    {"nome": "Helvio", "email": "helvio@crm-sucata.com.br"},
    {"nome": "Bruno", "email": "bruno@crm-sucata.com.br"},
    {"nome": "Carlos", "email": "carlos@crm-sucata.com.br"},
    {"nome": "Rafael", "email": "rafael@crm-sucata.com.br"},
    {"nome": "Fernando", "email": "fernando@crm-sucata.com.br"},
]

def criar_tabelas(conn):
    cur = conn.cursor()
    
    cur.executescript("""
        DROP TABLE IF EXISTS activities;
        DROP TABLE IF EXISTS contacts;
        DROP TABLE IF EXISTS opportunities;
        DROP TABLE IF EXISTS users;
        
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            cpf TEXT,
            "forcePasswordChange" INTEGER DEFAULT 1,
            "createdAt" TEXT,
            "updatedAt" TEXT
        );
        
        CREATE TABLE opportunities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            "documentType" TEXT,
            "documentNumber" TEXT UNIQUE,
            stage TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            "assignedTo" TEXT NOT NULL,
            "razaoSocial" TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            "zipCode" TEXT,
            "quantityGenerated" REAL,
            "competitorName" TEXT,
            observations TEXT,
            "leadDate" TEXT,
            "lastContactDate" TEXT,
            "expectedCloseDate" TEXT,
            classification TEXT,
            "createdAt" TEXT,
            "updatedAt" TEXT
        );
        
        CREATE TABLE contacts (
            id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            email TEXT,
            role TEXT,
            "opportunityId" TEXT NOT NULL,
            "createdAt" TEXT,
            "updatedAt" TEXT
        );
        
        CREATE TABLE activities (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            description TEXT,
            "userId" TEXT NOT NULL,
            "opportunityId" TEXT NOT NULL,
            metadata TEXT,
            "createdAt" TEXT
        );
    """)
    conn.commit()

def criar_usuarios(conn):
    print("\n=== CRIANDO USUARIOS ===")
    cur = conn.cursor()
    usuarios = {}
    
    admin_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
    admin_id = f"admin_{datetime.now().timestamp()}"
    cur.execute("""
        INSERT INTO users (id, email, name, password, role, status, cpf, "forcePasswordChange", "createdAt", "updatedAt")
        VALUES (?, 'admin@crm-sucata.com.br', 'Administrador', ?, 'ADMIN', 'ACTIVE', '00000000000', 1, datetime('now'), datetime('now'))
    """, (admin_id, admin_hash))
    usuarios["admin@crm-sucata.com.br"] = admin_id
    print(f"  ADMIN: Administrador - senha: {ADMIN_PASSWORD}")
    
    for comp in COMPRADORES:
        user_hash = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt()).decode()
        user_id = f"user_{comp['nome'].lower()}_{datetime.now().timestamp()}"
        cur.execute("""
            INSERT INTO users (id, email, name, password, role, status, cpf, "forcePasswordChange", "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, 'BUYER', 'ACTIVE', '00000000000', 1, datetime('now'), datetime('now'))
        """, (user_id, comp["email"], comp["nome"], user_hash))
        usuarios[comp["email"]] = user_id
        print(f"  BUYER: {comp['nome']} - senha: {DEFAULT_PASSWORD}")
    
    conn.commit()
    return usuarios

def importar_dados(conn, usuarios):
    print("\n=== IMPORTANDO DADOS ===")
    
    json_path = os.path.join(os.path.dirname(__file__), "dados_importacao.json")
    with open(json_path, "r", encoding="utf-8") as f:
        dados = json.load(f)
    
    print(f"  Total no JSON: {len(dados)}")
    
    cur = conn.cursor()
    total_ok = 0
    total_relatos = 0
    total_contatos = 0
    
    for i, f in enumerate(dados):
        comprador_id = usuarios.get(f["compradorEmail"])
        if not comprador_id:
            continue
        
        opp_id = f"opp_{i}_{datetime.now().timestamp()}"
        doc_num = f["documentNumber"] or f"TEMP_{i}"
        
        try:
            cur.execute("""
                INSERT INTO opportunities (
                    id, name, type, "documentType", "documentNumber", stage, status,
                    "assignedTo", "razaoSocial", phone, email, address, city, state,
                    "zipCode", "quantityGenerated", "competitorName", observations,
                    "leadDate", "lastContactDate", "expectedCloseDate", classification,
                    "createdAt", "updatedAt"
                ) VALUES (?, ?, 'FONTE', 'CNPJ', ?, ?, 'ACTIVE',
                    ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    COALESCE(?, '2025-01-01'), datetime('now'))
            """, (
                opp_id, f["name"][:200], doc_num, f["stage"],
                comprador_id, f["razaoSocial"], f["phone"], f["email"], f["address"],
                f["city"], f["state"], f["zipCode"],
                f["quantityGenerated"], f["competitorName"], f["observations"],
                f["leadDate"], f["lastContactDate"], f["expectedCloseDate"], f["classification"],
                f["leadDate"]
            ))
            total_ok += 1
            
            if f["contatoNome"]:
                cur.execute("""
                    INSERT INTO contacts (id, name, phone, email, role, "opportunityId", "createdAt", "updatedAt")
                    VALUES (?, ?, ?, ?, 'Contato Principal', ?, datetime('now'), datetime('now'))
                """, (f"contact_{i}", f["contatoNome"], f["contatoPhone"], f["email"], opp_id))
                total_contatos += 1
            
            if f["relato"]:
                activity_type = "VISIT_SCHEDULED" if "visita" in f["relato"].lower() else "NOTE_ADDED"
                created_at = f["lastContactDate"] or f["leadDate"] or "2025-01-01"
                cur.execute("""
                    INSERT INTO activities (id, type, description, "userId", "opportunityId", metadata, "createdAt")
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (f"act_{i}", activity_type, f["relato"][:500], comprador_id, opp_id,
                       json.dumps({"source": "importacao"}), created_at))
                total_relatos += 1
            
            if (i + 1) % 100 == 0:
                conn.commit()
                
        except Exception as e:
            pass  # ignore duplicates for test
        
        if (i + 1) % 500 == 0:
            print(f"  {i+1}/{len(dados)} processadas ({total_ok} OK)...")
    
    conn.commit()
    
    # Verificar
    cur.execute("SELECT COUNT(*) FROM opportunities")
    opp_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM contacts")
    contact_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM activities")
    act_count = cur.fetchone()[0]
    cur.execute("SELECT stage, COUNT(*) FROM opportunities GROUP BY stage")
    fases = cur.fetchall()
    
    print(f"\n=== RESULTADO ===")
    print(f"  Oportunidades: {opp_count}")
    print(f"  Contatos: {contact_count}")
    print(f"  Atividades: {act_count}")
    print(f"  Distribuicao por fase:")
    for fase, count in sorted(fases, key=lambda x: -x[1]):
        print(f"    {fase}: {count}")
    
    # Amostra
    cur.execute('SELECT name, city, state, stage, "razaoSocial" FROM opportunities LIMIT 5')
    print(f"\n  Amostra de fontes importadas:")
    for row in cur.fetchall():
        print(f"    - {row[0]} | {row[1]}/{row[2]} | {row[3]} | {row[4]}")

def main():
    db_path = "/tmp/crm_sucata_test.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    criar_tabelas(conn)
    usuarios = criar_usuarios(conn)
    importar_dados(conn, usuarios)
    conn.close()
    print(f"\nBanco de teste salvo em: {db_path}")

if __name__ == "__main__":
    main()
