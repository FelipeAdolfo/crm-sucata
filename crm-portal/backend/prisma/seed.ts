/**
 * SEED SCRIPT - Importa base de dados real do Excel
 * 
 * Este script importa todas as fontes geradoras de sucata do arquivo
 * "BASE DE DADOS E INDICADORES.xlsx" para o CRM Sucata.
 * 
 * Como executar:
 *   npx ts-node prisma/seed.ts /caminho/para/BASE\ DE\ DADOS\ E\ INDICADORES.xlsx
 * 
 * O script:
 *   1. Cria os compradores como usuarios (Jonathas, Daniel, Pedro, Helvio, Bruno)
 *   2. Importa cada fonte como Opportunity do tipo FONTE
 *   3. Importa relatos como Activity
 *   4. Extrai contatos quando possivel do campo relato
 */

import { PrismaClient, OpportunityStage, OpportunityType, UserRole, UserStatus, ActivityType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ============================================
// CONFIGURACAO
// ============================================
const DEFAULT_PASSWORD = 'sucata2026';
const ADMIN_PASSWORD = 'admin123456';

// Mapeamento de fases do Excel → OpportunityStage do Prisma
const FASE_MAP: Record<string, OpportunityStage> = {
  'LEADS': 'PRIMEIRO_CONTATO',
  'CONTATO': 'SEGUNDO_CONTATO',
  'CONTATO ': 'SEGUNDO_CONTATO',
  'VERIFICAÇÃO FISICA': 'VISITA',
  'VISITA AGENDADA': 'VISITA',
  'EM NEGOCIAÇÃO': 'EM_NEGOCIACAO',
  'EM NEGOCIAÇÃO ': 'EM_NEGOCIACAO',
  'CONCLUIDO COM SUCESSO': 'CONCLUIDA_SUCESSO',
  'FONTE NOSSA': 'CONCLUIDA_SUCESSO',
  'FORA DE PERFIL': 'FORA_DE_PERFIL',
  'FORA DE PERFIL ': 'FORA_DE_PERFIL',
  'BAIXA GERAÇÃO DIRECIONAR': 'BAIXA_GERACAO_DIR',
  'PERDIDOS CONFLITO INTELIGENCIA': 'PERDIDO_CONFLITO_INTEL',
  'PERDIDOS CONFLITO INTELIGENCIA ': 'PERDIDO_CONFLITO_INTEL',
  'PERDIDOS INTELIGENCIA ': 'PERDIDO_CONFLITO_INTEL',
  'PERDIDOS CONFLITO COMPRADOR': 'PERDIDO_CONFLITO_COMPR',
  'PERDIDOS CONFLITO ': 'PERDIDO_CONFLITO_INTEL',
};

// Compradores (ordem deve bater com nomes das abas)
const COMPRADORES: { nome: string; email: string; regiao: string }[] = [
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
// HELPERS
// ============================================

function limparCnpj(cnpj: any): string {
  if (!cnpj) return '';
  const str = String(cnpj).replace(/[^\d]/g, '');
  return str.length <= 14 ? str : str.substring(0, 14);
}

function formatarCnpj(cnpj: string): string {
  if (!cnpj || cnpj.length < 14) return cnpj;
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function limparTelefone(tel: any): string {
  if (!tel) return '';
  const str = String(tel).replace(/[^\d]/g, '');
  return str;
}

function limparTexto(texto: any): string {
  if (!texto) return '';
  return String(texto).trim();
}

function parseDate(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '' || val === '-' || val === ' ') return null;
  const n = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

// Extrair nomes e emails do relato
function extrairContatosDoRelato(relato: string): Array<{nome: string; telefone: string; email: string}> {
  const contatos: Array<{nome: string; telefone: string; email: string}> = [];
  if (!relato) return contatos;

  // Padrao: email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = relato.match(emailRegex) || [];

  // Padrao: telefone (11 dígitos)
  const telRegex = /(\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4})/g;
  const telefones = relato.match(telRegex) || [];

  // Tentar extrair nomes (padroes comuns)
  const nomeRegex = /(?:falei com|conversamos com|falamos com|contato com|passamos contato do|entrou em contato com|receptivo|secretaria deles|informou que|encaminhamos email para|atendimento da)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:que|para|e|sobre|so|informou|disse|pediu|ficou)|[,.;]|$)/gi;
  const nomesMatch = [...relato.matchAll(nomeRegex)];

  for (let i = 0; i < Math.max(emails.length, telefones.length, nomesMatch.length); i++) {
    contatos.push({
      nome: nomesMatch[i]?.[1]?.trim() || '',
      telefone: limparTelefone(telefones[i] || ''),
      email: emails[i] || '',
    });
  }

  return contatos.filter(c => c.nome || c.email || c.telefone);
}

// ============================================
// CRIAR USUARIOS
// ============================================

async function criarUsuarios() {
  console.log('\n=== CRIANDO USUARIOS ===');
  const usuarios: Record<string, string> = {}; // email -> id

  // 1. Admin
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm-sucata.com.br' },
    update: {},
    create: {
      email: 'admin@crm-sucata.com.br',
      name: 'Administrador',
      password: adminHash,
      role: 'ADMIN' as UserRole,
      status: 'ACTIVE' as UserStatus,
      cpf: '00000000000',
      forcePasswordChange: true,
    },
  });
  usuarios[admin.email] = admin.id;
  console.log(`  ADMIN: ${admin.name} (${admin.email}) - senha: ${ADMIN_PASSWORD}`);

  // 2. Compradores
  for (const comp of COMPRADORES) {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const user = await prisma.user.upsert({
      where: { email: comp.email },
      update: {},
      create: {
        email: comp.email,
        name: comp.nome,
        password: hash,
        role: 'BUYER' as UserRole,
        status: 'ACTIVE' as UserStatus,
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
// IMPORTAR BASE DE DADOS
// ============================================

async function importarBaseDados(filePath: string, usuarios: Record<string, string>) {
  console.log(`\n=== ABRINDO ARQUIVO: ${filePath} ===`);

  if (!fs.existsSync(filePath)) {
    console.error(`  ERRO: Arquivo nao encontrado: ${filePath}`);
    console.error('  Uso: npx ts-node prisma/seed.ts /caminho/completo/BASE\ DE\ DADOS\ E\ INDICADORES.xlsx');
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath);

  let totalImportadas = 0;
  let totalRelatos = 0;
  let totalContatos = 0;

  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.toUpperCase().includes('BASE DE DADOS')) continue;

    const compradorNome = sheetName
      .replace(/BASE DE DADOS REGI[ÃA]O\s*/i, '')
      .replace(/BASE DE DADOS\s*/i, '')
      .trim();

    const comprador = COMPRADORES.find(c => 
      c.nome.toUpperCase() === compradorNome.toUpperCase()
    );

    if (!comprador) {
      console.warn(`  AVISO: Comprador "${compradorNome}" nao mapeado. Pulando aba ${sheetName}.`);
      continue;
    }

    const compradorId = usuarios[comprador.email];
    if (!compradorId) {
      console.warn(`  AVISO: ID do comprador ${comprador.nome} nao encontrado.`);
      continue;
    }

    console.log(`\n  --- ABA: ${sheetName} (Comprador: ${comprador.nome}) ---`);

    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });

    let abaImportadas = 0;
    let abaRelatos = 0;
    let abaContatos = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i];

      // Extrair colunas (com nomes variaveis)
      const cnpjRaw = row['CNPJ'] || row['cnpj'] || '';
      const razaoRaw = row['Razão Social'] || row['Razão'] || row['razao'] || row['razão social'] || '';
      const fantasiaRaw = row['FANTASIA'] || row['Fantasia'] || row['Nome Fantasia'] || row['fantasia'] || '';
      const faseRaw = row['FASE DO FUNIL'] || row['fase do funil'] || '';
      const relatoRaw = row['RELATO'] || row['relato'] || row['RELATO '] || '';
      const qtdRaw = row['QTD (TONS\\MÊS)'] || row['QTD (TON\\MÊS)'] || row['QTD TONS\\MES'] || row['QTD TONS\\MÊS'] || row['GERAÇÃO MÊS'] || row['qtd'] || '';
      const concorrenteRaw = row['CONCORRENTE'] || row['CONCORRENTE '] || row['concorrente'] || '';
      const dataLeadRaw = row['DATA LEAD'] || row['data lead'] || '';
      const dataContatoRaw = row['DATA CONTATO'] || row['data contato'] || '';
      const dataFinalRaw = row['DATA FINAL'] || row['DATA FINAL '] || row['data final'] || row['data final '] || '';
      const contatoRaw = row['Contato'] || row['contato'] || row['Contato '] || row['CONTATO'] || '';
      const tel1 = row['TELEFONE 1'] || row['TELEFONE 1 '] || row['Telefone Principal'] || row['telefone 1'] || '';
      const tel2 = row['TELEFONE 2'] || row['Telefone 2'] || row['Telefone Secundário'] || row['Telefone Secundario'] || row['telefone 2'] || '';
      const emailRaw = row['E-mail'] || row['EMAIL'] || row['email'] || row['e-mail'] || '';
      const capitalRaw = row['CapitalSocial'] || row['Capital Social'] || row['CAPITAL SOCIAL'] || row['CAPITAL SOCIAL '] || row['capital'] || '';
      const fundacaoRaw = row['FUNDAÇÃO'] || row['Data de Abertura'] || row['Data de abertura'] || '';
      const logradouroRaw = row['Logradouro'] || row['logradouro'] || row['Endereço'] || row['Endereço '] || row['ENDEREÇO'] || '';
      const numeroRaw = row['Número'] || row['número'] || row['numero'] || '';
      const complementoRaw = row['Complemento'] || row['complemento'] || '';
      const bairroRaw = row['Bairro'] || row['bairro'] || '';
      const cidadeRaw = row['Cidade'] || row['Cidade '] || row['CIDADE'] || row['cidade'] || '';
      const estadoRaw = row['Estado'] || row['estado'] || '';
      const cepRaw = row['CEP'] || row['cep'] || '';
      const atividadeRaw = row['Atividade Principal'] || row['AtividadePrincipal'] || row['atividade principal'] || '';

      // Limpar e validar
      const cnpj = limparCnpj(cnpjRaw);
      const razao = limparTexto(razaoRaw);
      const fantasia = limparTexto(fantasiaRaw);

      if (!cnpj && !razao) {
        continue; // pular linhas vazias
      }

      // Determinar fase
      const faseStr = limparTexto(faseRaw);
      const stage = FASE_MAP[faseStr] || 'PRIMEIRO_CONTATO';

      // Datas
      const leadDate = parseDate(dataLeadRaw);
      const contactDate = parseDate(dataContatoRaw);
      const finalDate = parseDate(dataFinalRaw);

      // Quantidade (tons/mes)
      const qtdTons = parseNumber(qtdRaw);

      // Telefones
      const phone1 = limparTelefone(tel1);
      const phone2 = limparTelefone(tel2);
      const principalPhone = phone1 || phone2;
      const secondaryPhone = phone1 && phone2 && phone1 !== phone2 ? phone2 : '';

      // Endereco
      const address = [
        limparTexto(logradouroRaw),
        limparTexto(numeroRaw) ? `Nº ${limparTexto(numeroRaw)}` : '',
        limparTexto(complementoRaw),
        limparTexto(bairroRaw),
      ].filter(Boolean).join(', ');

      const city = limparTexto(cidadeRaw);
      const state = limparTexto(estadoRaw);
      const cep = limparCnpj(cepRaw);
      const email = limparTexto(emailRaw);
      const relato = limparTexto(relatoRaw);
      const contatoNome = limparTexto(contatoRaw);

      // Capital social
      const capitalSocial = parseNumber(capitalRaw);
      const dataFundacao = parseDate(fundacaoRaw);

      // Atividade
      const atividade = limparTexto(atividadeRaw);

      // Montar nome da oportunidade
      const oppName = fantasia || razao || 'Fonte Geradora';

      // Montar observacoes
      const observations = [
        razao !== fantasia && fantasia ? `Razão Social: ${razao}` : '',
        atividade ? `Atividade: ${atividade}` : '',
        contatoNome ? `Contato identificado: ${contatoNome}` : '',
        capitalSocial ? `Capital Social: R$ ${capitalSocial.toLocaleString('pt-BR')}` : '',
        dataFundacao ? `Data de Fundação: ${dataFundacao.toLocaleDateString('pt-BR')}` : '',
      ].filter(Boolean).join('\n');

      try {
        // Criar oportunidade
        const opportunity = await prisma.opportunity.create({
          data: {
            name: oppName,
            type: 'FONTE' as OpportunityType,
            stage,
            documentNumber: cnpj || undefined,
            razaoSocial: razao || undefined,
            phone: principalPhone || undefined,
            email: email || undefined,
            address: address || undefined,
            city: city || undefined,
            state: state || undefined,
            zipCode: cep || undefined,
            quantityGenerated: qtdTons,
            competitorName: limparTexto(concorrenteRaw) || undefined,
            assignedToId: compradorId,
            observations: observations || undefined,
            leadDate: leadDate || new Date('2025-01-01'),
            lastContactDate: contactDate || undefined,
            expectedCloseDate: finalDate || undefined,
            classification: stage === 'FORA_DE_PERFIL' ? 'FORA_DE_PERFIL' : 
                           stage === 'BAIXA_GERACAO_DIR' ? 'BAIXA_GERACAO' : 
                           undefined,
            createdAt: leadDate || new Date('2025-01-01'),
          },
        });

        abaImportadas++;

        // Criar contato principal se tiver nome
        if (contatoNome) {
          await prisma.contact.create({
            data: {
              name: contatoNome,
              phone: secondaryPhone || undefined,
              email: email || undefined,
              role: 'Contato Principal',
              opportunityId: opportunity.id,
            },
          });
          abaContatos++;
        }

        // Criar atividade com o relato
        if (relato) {
          const extractedContatos = extrairContatosDoRelato(relato);

          // Contatos extraidos do relato
          for (const ec of extractedContatos) {
            if (ec.nome && ec.nome !== contatoNome) {
              try {
                await prisma.contact.create({
                  data: {
                    name: ec.nome,
                    phone: ec.telefone || undefined,
                    email: ec.email || undefined,
                    role: 'Contato do Relato',
                    opportunityId: opportunity.id,
                  },
                });
                abaContatos++;
              } catch (_) { /* ignore duplicate */ }
            }
          }

          // Atividade do relato
          const activityType: ActivityType = relato.toLowerCase().includes('visita') ? 'VISIT_SCHEDULED' :
                                             relato.toLowerCase().includes('perdido') || stage.startsWith('PERDIDO') ? 'LOST' :
                                             'NOTE_ADDED';

          await prisma.activity.create({
            data: {
              type: activityType,
              description: relato.substring(0, 500),
              userId: compradorId,
              opportunityId: opportunity.id,
              metadata: {
                source: 'importacao_excel',
                comprador: comprador.nome,
                dataContato: dataContatoRaw ? String(dataContatoRaw) : null,
                contatoOriginal: contatoNome,
              },
              createdAt: contactDate || leadDate || new Date('2025-01-01'),
            },
          });
          abaRelatos++;
        }

      } catch (err: any) {
        if (err.code === 'P2002') {
          console.warn(`    CNPJ duplicado pulado: ${cnpj} (${razao?.substring(0, 40)})`);
        } else {
          console.warn(`    Erro na linha ${i + 1}: ${err.message?.substring(0, 100)}`);
        }
      }

      // Progresso a cada 100
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`    ${i + 1}/${jsonData.length} processadas...\r`);
      }
    }

    console.log(`    ${abaImportadas} oportunidades | ${abaRelatos} relatos | ${abaContatos} contatos`);
    totalImportadas += abaImportadas;
    totalRelatos += abaRelatos;
    totalContatos += abaContatos;
  }

  return { totalImportadas, totalRelatos, totalContatos };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CRM SUCATA - IMPORTACAO DE BASE DE DADOS                   ║');
  console.log('║  Fontes geradoras de sucata do Excel                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const filePath = process.argv[2];
  if (!filePath) {
    console.error('\nUSO: npx ts-node prisma/seed.ts /caminho/para/BASE\ DE\ DADOS\ E\ INDICADORES.xlsx');
    console.error('\nExemplo:');
    console.error('  npx ts-node prisma/seed.ts "./BASE DE DADOS E INDICADORES.xlsx"');
    process.exit(1);
  }

  try {
    // 1. Criar usuarios
    const usuarios = await criarUsuarios();

    // 2. Importar dados
    const resultado = await importarBaseDados(filePath, usuarios);

    // 3. Resumo
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  IMPORTACAO CONCLUIDA!                                       ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Total de fontes importadas: ${String(resultado.totalImportadas).padStart(5)}                      ║`);
    console.log(`║  Total de relatos importados: ${String(resultado.totalRelatos).padStart(5)}                     ║`);
    console.log(`║  Total de contatos criados: ${String(resultado.totalContatos).padStart(5)}                       ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  USUARIOS CRIADOS:                                           ║');
    console.log(`║    admin@crm-sucata.com.br (ADMIN) - senha: ${ADMIN_PASSWORD}           ║`);
    for (const c of COMPRADORES) {
      console.log(`║    ${c.email} (BUYER) - senha: ${DEFAULT_PASSWORD}            ║`);
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
