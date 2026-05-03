import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient, IntelType, ScrapType } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET ALL MARKET INTELLIGENCE
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      type,
      scrapType,
      region,
      startDate,
      endDate,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (type) where.type = type;
    if (scrapType) where.scrapType = scrapType;
    if (region) where.region = { contains: region as string, mode: 'insensitive' };
    
    if (startDate || endDate) {
      where.intelDate = {};
      if (startDate) where.intelDate.gte = new Date(startDate as string);
      if (endDate) where.intelDate.lte = new Date(endDate as string);
    }

    const [intel, total] = await Promise.all([
      prisma.marketIntelligence.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
          opportunity: {
            select: { id: true, name: true },
          },
        },
        orderBy: { intelDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.marketIntelligence.count({ where }),
    ]);

    res.json({
      intelligence: intel,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get market intel error:', error);
    res.status(500).json({ error: 'Erro ao buscar inteligência de mercado' });
  }
});

// ============================================
// GET MARKET INTELLIGENCE BY ID
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const intel = await prisma.marketIntelligence.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true },
        },
        opportunity: {
          select: { id: true, name: true },
        },
      },
    });

    if (!intel) {
      return res.status(404).json({ error: 'Informação não encontrada' });
    }

    res.json(intel);
  } catch (error) {
    console.error('Get market intel error:', error);
    res.status(500).json({ error: 'Erro ao buscar informação' });
  }
});

// ============================================
// CREATE MARKET INTELLIGENCE
// ============================================
router.post('/', authenticate, [
  body('type').isIn(Object.values(IntelType)).withMessage('Tipo inválido'),
  body('description').notEmpty().withMessage('Descrição obrigatória'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      opportunityId,
      type,
      competitorName,
      scrapType,
      price,
      region,
      description,
      source,
      intelDate,
    } = req.body;

    const intel = await prisma.marketIntelligence.create({
      data: {
        userId: req.user!.id,
        opportunityId,
        type: type as IntelType,
        competitorName,
        scrapType: scrapType as ScrapType,
        price,
        region,
        description,
        source,
        intelDate: intelDate ? new Date(intelDate) : new Date(),
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        opportunity: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json(intel);
  } catch (error) {
    console.error('Create market intel error:', error);
    res.status(500).json({ error: 'Erro ao criar informação' });
  }
});

// ============================================
// UPDATE MARKET INTELLIGENCE
// ============================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const intel = await prisma.marketIntelligence.findUnique({
      where: { id },
    });

    if (!intel) {
      return res.status(404).json({ error: 'Informação não encontrada' });
    }

    // Only creator or admin can update
    if (intel.userId !== req.user!.id && 
        !['MANAGER', 'DIRECTOR', 'INTEL_COORDINATOR'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updated = await prisma.marketIntelligence.update({
      where: { id },
      data: {
        type: updateData.type || undefined,
        competitorName: updateData.competitorName || undefined,
        scrapType: updateData.scrapType || undefined,
        price: updateData.price !== undefined ? updateData.price : undefined,
        region: updateData.region || undefined,
        description: updateData.description || undefined,
        source: updateData.source || undefined,
        intelDate: updateData.intelDate ? new Date(updateData.intelDate) : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
        opportunity: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update market intel error:', error);
    res.status(500).json({ error: 'Erro ao atualizar informação' });
  }
});

// ============================================
// DELETE MARKET INTELLIGENCE
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const intel = await prisma.marketIntelligence.findUnique({
      where: { id },
    });

    if (!intel) {
      return res.status(404).json({ error: 'Informação não encontrada' });
    }

    // Only creator or admin can delete
    if (intel.userId !== req.user!.id && 
        !['MANAGER', 'DIRECTOR', 'INTEL_COORDINATOR'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.marketIntelligence.delete({ where: { id } });

    res.json({ message: 'Informação excluída com sucesso' });
  } catch (error) {
    console.error('Delete market intel error:', error);
    res.status(500).json({ error: 'Erro ao excluir informação' });
  }
});

// ============================================
// GET COMPETITOR PRICES
// ============================================
router.get('/stats/competitor-prices', authenticate, async (req, res) => {
  try {
    const { scrapType, days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const where: any = {
      type: 'COMPETITOR_PRICE',
      intelDate: { gte: startDate },
    };

    if (scrapType) where.scrapType = scrapType;

    const prices = await prisma.marketIntelligence.findMany({
      where,
      select: {
        competitorName: true,
        scrapType: true,
        price: true,
        region: true,
        intelDate: true,
      },
      orderBy: { intelDate: 'desc' },
    });

    // Group by competitor
    const grouped = prices.reduce((acc: any, item) => {
      const key = item.competitorName || 'Desconhecido';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    res.json({
      prices,
      grouped,
      averagePrice: prices.length > 0 
        ? prices.reduce((sum, p) => sum + (p.price || 0), 0) / prices.length 
        : 0,
    });
  } catch (error) {
    console.error('Get competitor prices error:', error);
    res.status(500).json({ error: 'Erro ao buscar preços da concorrência' });
  }
});

export default router;
