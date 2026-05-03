import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET ACTIVITIES
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      opportunityId,
      userId,
      type,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (opportunityId) where.opportunityId = opportunityId as string;
    if (userId) where.userId = userId as string;
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
          opportunity: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
});

// ============================================
// GET RECENT ACTIVITIES (Dashboard)
// ============================================
router.get('/recent', authenticate, async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    const where: any = {};
    
    // Partners and buyers only see their own activities
    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.userId = req.user!.id;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true },
        },
        opportunity: {
          select: { id: true, name: true, stage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    });

    res.json(activities);
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades recentes' });
  }
});

// ============================================
// CREATE ACTIVITY
// ============================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { opportunityId, type, description, oldStage, newStage, metadata } = req.body;

    if (!opportunityId || !type || !description) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const activity = await prisma.activity.create({
      data: {
        opportunityId,
        userId: req.user!.id,
        type,
        description,
        oldStage,
        newStage,
        metadata: metadata || {},
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

    res.status(201).json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Erro ao criar atividade' });
  }
});

export default router;
