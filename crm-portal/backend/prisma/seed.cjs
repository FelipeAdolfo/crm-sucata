/**
 * SEED SCRIPT - Importa base de dados do JSON para o CRM Sucata
 * 
 * Pre-requisitos:
 *   1. npm install bcryptjs
 *   2. npx prisma generate
 *   3. npx prisma migrate dev (para criar as tabelas)
 * 
 * Como executar:
 *   node prisma/seed.cjs
 * 
 * O script:
 *   1. Cria os compradores como usuarios (Jonathas, Daniel, Pedro, Helvio, Bruno)
 *   2. Importa cada fonte como Opportunity do tipo FONTE
 *   3. Importa relatos como Activity
 *   4. Cria contatos quando disponivel
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ============================================
// CONFIGURACAO
// ============================================
const DEFAULT_PASSWORD = 'sucata2026';
const ADMIN_PASSWORD = 'admin123456';

const COMPRADORES = [
  { nome: 'Jonathas', email: 'jonathas@crm-sucata.com.br', regiao: 'Regiao Centro' },
  { nome: 'Daniel', email: 'daniel@crm-sucata.com.br', regiao: 'Regiao Vale + Rio de Janeiro' },
  { nome: 'Pedro', email: 'pedro@crm-sucata.com.br', regiao: 'Regiao ABC/SP' },
  { nome: 'Helvio', email: 'helvio@crm-sucata.com.br', regiao: 'Regiao Campinas' },
  { nome: 'Bruno', email: 'bruno@crm-sucata.com.br', regiao: 'Regiao Sul' },
  { nome: 'Carlos', email: 'carlos@crm-sucata.com.br', regiao: 'Minas Gerais' },
  { nome: 'Rafael', email: 'rafael@crm-sucata.com.br', regiao: 'Espirito Santo' },
  { nome: 'Fernando', email: 'fernando@crm-sucata.com.br', regiao: 'Bahia + Goias' },
];

// ============================================
// CRIAR USUARIOS
// ============================================
async function criarUsuarios() {
  console.log('\n=== CRIANDO USUARIOS ===');
  const usuarios = {};

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm-sucata.com.br' },
    update: {},
    create: {
      email: 'admin@crm-sucata.com.br',
      name: 'Administrador',
      password: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      cpf: '00000000000',
      forcePasswordChange: true,
    },
  });
  usuarios[admin.email] = admin.id;
  console.log(`  ADMIN: ${admin.name} (${admin.email}) - senha: ${ADMIN_PASSWORD}`);

  for (const comp of COMPRADORES) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: comp.email },
      update: {},
      create: {
        email: comp.email,
        name: comp.nome,
        password: hash,
        role: 'BUYER',
        status: 'ACTIVE',
        cpf: '00000000000',
        forcePasswordChange: true,
      },
    });
    usuarios[user.email] = user.id;
    console.log(`  BUYER: ${user.name} (${user.email}) - regiao: ${comp.regiao} - senha: ${DEFAULT_PASSWORD}`);
  }

  return usuarios;
}

// ============================================
// IMPORTAR DADOS DO JSON
// ============================================
async function importarDados(usuarios) {
  console.log('\n=== IMPORTANDO DADOS ===');

  const jsonPath = path.join(__dirname, 'dados_importacao.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`  ERRO: Arquivo nao encontrado: ${jsonPath}`);
    console.error('  Execute primeiro: python3 prisma/convert_excel_to_json.py \"BASE DE DADOS E INDICADORES.xlsx\"');
    process.exit(1);
  }

  const dados = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`  Total de fontes no JSON: ${dados.length}`);

  let totalImportadas = 0;
  let totalRelatos = 0;
  let totalContatos = 0;
  let totalPuladas = 0;
  let lastReport = Date.now();

  for (let i = 0; i < dados.length; i++) {
    const f = dados[i];
    const compradorId = usuarios[f.compradorEmail];

    if (!compradorId) {
      console.warn(`  AVISO: Comprador ${f.compradorEmail} nao encontrado para: ${f.name}`);
      totalPuladas++;
      continue;
    }

    try {
      // Criar oportunidade
      const opportunity = await prisma.opportunity.create({
        data: {
          name: f.name,
          type: 'FONTE',
          documentType: 'CNPJ',
          documentNumber: f.documentNumber || `TEMP_${Date.now()}_${i}`,
          stage: f.stage,
          status: 'ACTIVE',
          assignedTo: compradorId,
          razaoSocial: f.razaoSocial,
          phone: f.phone,
          email: f.email,
          address: f.address,
          city: f.city,
          state: f.state,
          zipCode: f.zipCode,
          quantityGenerated: f.quantityGenerated,
          competitorName: f.competitorName,
          observations: f.observations,
          leadDate: f.leadDate ? new Date(f.leadDate) : undefined,
          lastContactDate: f.lastContactDate ? new Date(f.lastContactDate) : undefined,
          expectedCloseDate: f.expectedCloseDate ? new Date(f.expectedCloseDate) : undefined,
          classification: f.classification,
          createdAt: f.leadDate ? new Date(f.leadDate) : new Date('2025-01-01'),
        },
      });

      totalImportadas++;

      // Contato principal
      if (f.contatoNome) {
        try {
          await prisma.contact.create({
            data: {
              name: f.contatoNome,
              phone: f.contatoPhone || undefined,
              email: f.email || undefined,
              role: 'Contato Principal',
              opportunityId: opportunity.id,
            },
          });
          totalContatos++;
        } catch (e) { /* ignore duplicate */ }
      }

      // Relato como atividade
      if (f.relato) {
        const activityType = f.relato.toLowerCase().includes('visita') ? 'VISIT_SCHEDULED' :
                             f.relato.toLowerCase().includes('perdido') || f.stage.startsWith('PERDIDO') ? 'LOST' :
                             'NOTE_ADDED';

        try {
          await prisma.activity.create({
            data: {
              type: activityType,
              description: f.relato.substring(0, 500),
              userId: compradorId,
              opportunityId: opportunity.id,
              metadata: {
                source: 'importacao_excel',
                comprador: f.compradorNome,
                contatoOriginal: f.contatoNome,
              },
              createdAt: f.lastContactDate ? new Date(f.lastContactDate) : (f.leadDate ? new Date(f.leadDate) : new Date('2025-01-01')),
            },
          });
          totalRelatos++;
        } catch (e) { /* ignore */ }
      }

    } catch (err) {
      if (err.code === 'P2002') {
        totalPuladas++;
      } else {
        console.warn(`    Erro linha ${i + 1} (${f.name?.substring(0, 30)}): ${err.message?.substring(0, 80)}`);
      }
    }

    // Progress report every 500 or 5 seconds
    if ((i + 1) % 500 === 0 || Date.now() - lastReport > 5000) {
      process.stdout.write(`  ${i + 1}/${dados.length} processadas (${totalImportadas} OK, ${totalPuladas} puladas)...\r`);
      lastReport = Date.now();
    }
  }

  return { totalImportadas, totalRelatos, totalContatos, totalPuladas };
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CRM SUCATA - IMPORTACAO DE BASE DE DADOS REAL              ║');
  console.log('║  Fontes geradoras de sucata do Excel                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    // 1. Criar usuarios
    const usuarios = await criarUsuarios();

    // 2. Importar dados
    const resultado = await importarDados(usuarios);

    // 3. Resumo
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  IMPORTACAO CONCLUIDA!                                       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Fontes importadas:  ${String(resultado.totalImportadas).padStart(5)}                                ║`);
    console.log(`║  Relatos importados: ${String(resultado.totalRelatos).padStart(5)}                                ║`);
    console.log(`║  Contatos criados:   ${String(resultado.totalContatos).padStart(5)}                                ║`);
    console.log(`║  Linhas puladas:     ${String(resultado.totalPuladas).padStart(5)}                                ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  USUARIOS CRIADOS:                                           ║');
    console.log(`║    admin@crm-sucata.com.br    (ADMIN) - senha: ${ADMIN_PASSWORD}           ║`);
    for (const c of COMPRADORES) {
      console.log(`║    ${c.email}  (BUYER) - senha: ${DEFAULT_PASSWORD}            ║`);
    }
    console.log('╚══════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\nERRO FATAL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
