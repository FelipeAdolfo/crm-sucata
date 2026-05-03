import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient, OpportunityStage, OpportunityType, DocumentType, OpportunityStatus, ScrapType, ContainerType, ExchangeFrequency, LowGenType, CompanyType, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { validateCPF, formatCPF, validateCNPJ, formatCNPJ } from '../utils/auth';
import { onOportunidadeConcluida } from '../services/sygecom';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET ALL OPPORTUNITIES
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      stage, 
      type, 
      status,
      assignedTo,
      city,
      state,
      search, 
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (stage) where.stage = stage;
    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    
    // Partners and buyers can only see their assigned opportunities
    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.assignedTo = req.user!.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo as string;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { documentNumber: { contains: search as string } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { contacts: true, visits: true, photos: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.opportunity.count({ where }),
    ]);

    res.json({
      opportunities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Erro ao buscar oportunidades' });
  }
});

// ============================================
// GET OPPORTUNITY BY ID
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, phone: true },
        },
        contacts: true,
        photos: {
          orderBy: { uploadedAt: 'desc' },
        },
        visits: {
          include: {
            visitor: {
              select: { id: true, name: true },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
        activities: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    // Check permissions
    if (['PARTNER', 'BUYER'].includes(req.user!.role) && opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Get opportunity error:', error);
    res.status(500).json({ error: 'Erro ao buscar oportunidade' });
  }
});

// ============================================
// CREATE OPPORTUNITY
// ============================================
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Nome obrigatório'),
  body('type').isIn(Object.values(OpportunityType)).withMessage('Tipo inválido'),
  body('documentType').isIn(Object.values(DocumentType)).withMessage('Tipo de documento inválido'),
  body('documentNumber').notEmpty().withMessage('Número do documento obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      type, 
      documentType, 
      documentNumber,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      responsibleName,
      responsibleRole,
      responsiblePhone,
      observations,
      source,
      assignedTo,
    } = req.body;

    // Validate document
    let formattedDoc: string;
    if (documentType === DocumentType.PF) {
      if (!validateCPF(documentNumber)) {
        return res.status(400).json({ error: 'CPF inválido' });
      }
      formattedDoc = formatCPF(documentNumber);
    } else {
      if (!validateCNPJ(documentNumber)) {
        return res.status(400).json({ error: 'CNPJ inválido' });
      }
      formattedDoc = formatCNPJ(documentNumber);
    }

    // Check if document already exists (prevents duplicate CNPJ for Fontes)
    const existing = await prisma.opportunity.findUnique({
      where: { documentNumber: formattedDoc },
    });

    if (existing) {
      const typeLabel = existing.type === 'FONTE' ? 'Fonte' : 
                        existing.type === 'SUCATEIRO' ? 'Sucateiro' :
                        existing.type === 'LEILAO_LOTE_SPOT' ? 'Leilão Lote Spot' :
                        existing.type === 'LEILAO_GERACAO_CONTINUA' ? 'Leilão Geração Contínua' :
                        existing.type === 'LOTE_SPOT' ? 'Lote Spot' : 'Oportunidade';
      
      const docLabel = documentType === DocumentType.PF ? 'CPF' : 'CNPJ';
      
      return res.status(409).json({ 
        error: `${docLabel} já cadastrado`,
        code: 'DUPLICATE_DOCUMENT',
        message: `Este ${docLabel} já está cadastrado como ${typeLabel}: "${existing.name}" (ID: ${existing.id}). Não é possível cadastrar a mesma empresa duas vezes.`,
        existing: {
          id: existing.id,
          name: existing.name,
          type: existing.type,
          stage: existing.stage,
        },
      });
    }

    // Determine assigned user
    let assignedUserId = assignedTo;
    if (!assignedUserId) {
      // If not specified, assign to current user
      assignedUserId = req.user!.id;
    }

    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        type: type as OpportunityType,
        documentType: documentType as DocumentType,
        documentNumber: formattedDoc,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        responsibleName,
        responsibleRole,
        responsiblePhone,
        observations,
        source,
        stage: OpportunityStage.PRIMEIRO_CONTATO,
        status: OpportunityStatus.ACTIVE,
        assignedTo: assignedUserId,
      },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId: opportunity.id,
        userId: req.user!.id,
        type: 'CREATED',
        description: 'Oportunidade criada',
      },
    });

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Erro ao criar oportunidade' });
  }
});

// ============================================
// UPDATE OPPORTUNITY
// ============================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    // Check permissions
    if (['PARTNER', 'BUYER'].includes(req.user!.role) && opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Build update object
    const data: any = {};
    
    // Basic fields
    if (updateData.name) data.name = updateData.name;
    if (updateData.address) data.address = updateData.address;
    if (updateData.city) data.city = updateData.city;
    if (updateData.state) data.state = updateData.state;
    if (updateData.zipCode) data.zipCode = updateData.zipCode;
    if (updateData.phone) data.phone = updateData.phone;
    if (updateData.email) data.email = updateData.email;
    if (updateData.website) data.website = updateData.website;
    if (updateData.responsibleName !== undefined) data.responsibleName = updateData.responsibleName;
    if (updateData.responsibleRole !== undefined) data.responsibleRole = updateData.responsibleRole;
    if (updateData.responsiblePhone !== undefined) data.responsiblePhone = updateData.responsiblePhone;
    if (updateData.observations !== undefined) data.observations = updateData.observations;
    if (updateData.source) data.source = updateData.source;
    
    // Company type
    if (updateData.companyType) data.companyType = updateData.companyType as CompanyType;
    
    // Geolocation
    if (updateData.latitude !== undefined) data.latitude = updateData.latitude;
    if (updateData.longitude !== undefined) data.longitude = updateData.longitude;
    if (updateData.geofenceRadius !== undefined) data.geofenceRadius = updateData.geofenceRadius;
    
    // Scrap data (filled in CONTACT stage)
    if (updateData.scrapType) data.scrapType = updateData.scrapType as ScrapType;
    if (updateData.quantityGenerated) data.quantityGenerated = updateData.quantityGenerated;
    if (updateData.containerWeight) data.containerWeight = updateData.containerWeight;
    if (updateData.containerType) data.containerType = updateData.containerType as ContainerType;
    if (updateData.exchangeFrequency) data.exchangeFrequency = updateData.exchangeFrequency as ExchangeFrequency;
    if (updateData.currentBuyer) data.currentBuyer = updateData.currentBuyer;
    
    // Competition data
    if (updateData.competitorPrice) data.competitorPrice = updateData.competitorPrice;
    if (updateData.competitorName) data.competitorName = updateData.competitorName;
    
    // Negotiation data
    if (updateData.proposedPrice) data.proposedPrice = updateData.proposedPrice;
    if (updateData.negotiatedVolume) data.negotiatedVolume = updateData.negotiatedVolume;
    if (updateData.paymentTerms) data.paymentTerms = updateData.paymentTerms;
    if (updateData.collectionFrequency) data.collectionFrequency = updateData.collectionFrequency;

    // Only managers+ can reassign
    if (updateData.assignedTo && ['MANAGER', 'DIRECTOR', 'INTEL_COORDINATOR'].includes(req.user!.role)) {
      data.assignedTo = updateData.assignedTo;
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId: id,
        userId: req.user!.id,
        type: 'UPDATED',
        description: 'Dados da oportunidade atualizados',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Erro ao atualizar oportunidade' });
  }
});

// ============================================
// CHANGE STAGE
// ============================================
router.patch('/:id/stage', authenticate, [
  body('stage').isIn(Object.values(OpportunityStage)).withMessage('Fase inválida'),
  body('lowGenType').optional().isIn(Object.values(LowGenType)),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { stage, lowGenType, reason } = req.body;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    // Check permissions
    if (['PARTNER', 'BUYER'].includes(req.user!.role) && opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const oldStage = opportunity.stage;
    const data: any = { stage: stage as OpportunityStage };

    // Handle low generation sub-type
    if (stage === OpportunityStage.BAIXA_GERACAO_DIR || stage === OpportunityStage.BAIXA_GERACAO_ENT) {
      if (lowGenType) {
        data.lowGenType = lowGenType as LowGenType;
      }
    }

    // Handle conversion (Concluida com Sucesso)
    if (stage === OpportunityStage.CONCLUIDA_SUCESSO) {
      data.convertedAt = new Date();
      data.status = OpportunityStatus.CONVERTED;
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create activity log
    const stageLabels: Record<string, string> = {
      PRIMEIRO_CONTATO: 'Primeiro Contato',
      SEGUNDO_CONTATO: 'Segundo Contato',
      VISITA: 'Visita',
      EM_NEGOCIACAO: 'Em Negociação',
      CONTRA_PROPOSTA: 'Contra Proposta',
      EM_FECHAMENTO: 'Em Fechamento',
      CONCLUIDA_SUCESSO: 'Concluída com Sucesso',
      FORA_DE_PERFIL: 'Fora de Perfil',
      BAIXA_GERACAO_DIR: 'Baixa Geração - Direcionar',
      BAIXA_GERACAO_ENT: 'Baixa Geração - Entrega',
      LEAD: 'Lead',
      CONTACT: 'Contato',
      VISIT_SCHEDULED: 'Visita Agendada',
      IN_NEGOTIATION: 'Em Negociação (legado)',
      CLOSED_DEAL: 'Negócio Fechado',
      COMMERCIAL_RELATION: 'Relação Comercial',
    };

    await prisma.activity.create({
      data: {
        opportunityId: id,
        userId: req.user!.id,
        type: 'STAGE_CHANGED',
        description: `Fase alterada de "${stageLabels[oldStage]}" para "${stageLabels[stage]}"${reason ? `. Motivo: ${reason}` : ''}`,
        oldStage,
        newStage: stage as OpportunityStage,
      },
    });

    // TRIGGER SYGECOM: Quando fonte for concluida com sucesso, enviar dados ao Sygecom
    if (stage === OpportunityStage.CONCLUIDA_SUCESSO) {
      // Executa em background (nao bloqueia a resposta ao usuario)
      onOportunidadeConcluida(id).catch(err => {
        console.error('[Sygecom] Falha no envio em background:', err);
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Change stage error:', error);
    res.status(500).json({ error: 'Erro ao alterar fase' });
  }
});

// ============================================
// DELETE OPPORTUNITY (Admin only)
// ============================================
router.delete('/:id', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { id } = req.params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    await prisma.opportunity.delete({ where: { id } });

    res.json({ message: 'Oportunidade excluída com sucesso' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Erro ao excluir oportunidade' });
  }
});

// ============================================
// GET PIPELINE (Kanban data)
// ============================================
router.get('/pipeline/overview', authenticate, async (req, res) => {
  try {
    const where: any = {};
    
    // Filter by assigned user for partners and buyers
    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.assignedTo = req.user!.id;
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      select: {
        id: true,
        name: true,
        stage: true,
        type: true,
        city: true,
        quantityGenerated: true,
        competitorPrice: true,
        assignedTo: true,
        assignedUser: {
          select: { id: true, name: true },
        },
        _count: {
          select: { contacts: true, visits: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by stage (novas fases)
    const pipeline = {
      PRIMEIRO_CONTATO: opportunities.filter(o => o.stage === 'PRIMEIRO_CONTATO'),
      SEGUNDO_CONTATO: opportunities.filter(o => o.stage === 'SEGUNDO_CONTATO'),
      VISITA: opportunities.filter(o => o.stage === 'VISITA'),
      EM_NEGOCIACAO: opportunities.filter(o => o.stage === 'EM_NEGOCIACAO'),
      CONTRA_PROPOSTA: opportunities.filter(o => o.stage === 'CONTRA_PROPOSTA'),
      EM_FECHAMENTO: opportunities.filter(o => o.stage === 'EM_FECHAMENTO'),
      CONCLUIDA_SUCESSO: opportunities.filter(o => o.stage === 'CONCLUIDA_SUCESSO'),
      FORA_DE_PERFIL: opportunities.filter(o => o.stage === 'FORA_DE_PERFIL'),
      BAIXA_GERACAO_DIR: opportunities.filter(o => o.stage === 'BAIXA_GERACAO_DIR'),
      BAIXA_GERACAO_ENT: opportunities.filter(o => o.stage === 'BAIXA_GERACAO_ENT'),
      // Fases legadas para compatibilidade
      LEAD: opportunities.filter(o => o.stage === 'LEAD'),
      CONTACT: opportunities.filter(o => o.stage === 'CONTACT'),
      VISIT_SCHEDULED: opportunities.filter(o => o.stage === 'VISIT_SCHEDULED'),
      IN_NEGOTIATION: opportunities.filter(o => o.stage === 'IN_NEGOTIATION'),
      CLOSED_DEAL: opportunities.filter(o => o.stage === 'CLOSED_DEAL'),
      COMMERCIAL_RELATION: opportunities.filter(o => o.stage === 'COMMERCIAL_RELATION'),
    };

    res.json(pipeline);
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ error: 'Erro ao buscar pipeline' });
  }
});

// ============================================
// GET OPPORTUNITY STATS
// ============================================
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const where: any = {};
    
    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.assignedTo = req.user!.id;
    }

    const [byStage, byType, byStatus, total, converted] = await Promise.all([
      prisma.opportunity.groupBy({
        by: ['stage'],
        where,
        _count: { stage: true },
      }),
      prisma.opportunity.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      prisma.opportunity.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.opportunity.count({ where }),
      prisma.opportunity.count({ 
        where: { ...where, status: OpportunityStatus.CONVERTED } 
      }),
    ]);

    res.json({
      total,
      converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      byStage,
      byType,
      byStatus,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;