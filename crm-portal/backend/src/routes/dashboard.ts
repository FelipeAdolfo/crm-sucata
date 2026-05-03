import { Router } from 'express';
import { PrismaClient, OpportunityStage, OpportunityStatus, VisitStatus } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET DASHBOARD METRICS
// ============================================
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    
    // Base where clause
    const oppWhere: any = {};
    const visitWhere: any = {};
    
    // Filter by assigned user for partners and buyers
    if (['PARTNER', 'BUYER'].includes(user.role)) {
      oppWhere.assignedTo = user.id;
      visitWhere.visitorId = user.id;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalOpportunities,
      opportunitiesByStage,
      opportunitiesByType,
      totalVisits,
      visitsThisMonth,
      upcomingVisits,
      convertedThisMonth,
      totalConverted,
      competitorStats,
    ] = await Promise.all([
      // Total opportunities
      prisma.opportunity.count({ where: oppWhere }),

      // Opportunities by stage
      prisma.opportunity.groupBy({
        by: ['stage'],
        where: oppWhere,
        _count: { stage: true },
      }),

      // Opportunities by type
      prisma.opportunity.groupBy({
        by: ['type'],
        where: oppWhere,
        _count: { type: true },
      }),

      // Total visits
      prisma.visit.count({ where: visitWhere }),

      // Visits this month
      prisma.visit.count({
        where: {
          ...visitWhere,
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Upcoming visits
      prisma.visit.count({
        where: {
          ...visitWhere,
          scheduledAt: { gte: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),

      // Conversions this month
      prisma.opportunity.count({
        where: {
          ...oppWhere,
          status: OpportunityStatus.CONVERTED,
          convertedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),

      // Total converted
      prisma.opportunity.count({
        where: {
          ...oppWhere,
          status: OpportunityStatus.CONVERTED,
        },
      }),

      // Top competitors
      prisma.marketIntelligence.groupBy({
        by: ['competitorName'],
        where: {
          type: 'COMPETITOR_PRICE',
          competitorName: { not: null },
        },
        _count: { competitorName: true },
        take: 5,
      }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalOpportunities > 0 
      ? (totalConverted / totalOpportunities) * 100 
      : 0;

    res.json({
      opportunities: {
        total: totalOpportunities,
        byStage: opportunitiesByStage,
        byType: opportunitiesByType,
        converted: totalConverted,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      visits: {
        total: totalVisits,
        thisMonth: visitsThisMonth,
        upcoming: upcomingVisits,
      },
      conversions: {
        thisMonth: convertedThisMonth,
        total: totalConverted,
      },
      competitors: competitorStats,
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// ============================================
// GET PIPELINE DATA (Kanban)
// ============================================
router.get('/pipeline', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    
    const where: any = {};
    
    if (['PARTNER', 'BUYER'].includes(user.role)) {
      where.assignedTo = user.id;
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      select: {
        id: true,
        name: true,
        stage: true,
        type: true,
        city: true,
        state: true,
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

    // Group by stage (new funnel stages)
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
    };

    res.json(pipeline);
  } catch (error) {
    console.error('Get pipeline error:', error);
    res.status(500).json({ error: 'Erro ao buscar pipeline' });
  }
});

// ============================================
// GET TEAM PERFORMANCE (Admin only)
// ============================================
router.get('/team-performance', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    
    // Only managers+ can see team performance
    if (!['MANAGER', 'DIRECTOR', 'INTEL_COORDINATOR'].includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: { in: ['PARTNER', 'BUYER'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const performance = await Promise.all(
      users.map(async (u) => {
        const [
          totalOpportunities,
          convertedOpportunities,
          totalVisits,
          visitsThisMonth,
        ] = await Promise.all([
          prisma.opportunity.count({
            where: { assignedTo: u.id },
          }),
          prisma.opportunity.count({
            where: { 
              assignedTo: u.id,
              status: OpportunityStatus.CONVERTED,
            },
          }),
          prisma.visit.count({
            where: { visitorId: u.id },
          }),
          prisma.visit.count({
            where: {
              visitorId: u.id,
              scheduledAt: { gte: startOfMonth },
            },
          }),
        ]);

        const conversionRate = totalOpportunities > 0
          ? (convertedOpportunities / totalOpportunities) * 100
          : 0;

        return {
          user: u,
          metrics: {
            totalOpportunities,
            convertedOpportunities,
            conversionRate: Math.round(conversionRate * 100) / 100,
            totalVisits,
            visitsThisMonth,
          },
        };
      })
    );

    res.json(performance);
  } catch (error) {
    console.error('Get team performance error:', error);
    res.status(500).json({ error: 'Erro ao buscar desempenho da equipe' });
  }
});

// ============================================
// GET MONTHLY TRENDS
// ============================================
router.get('/trends', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    const { months = '6' } = req.query;
    const monthsCount = parseInt(months as string);

    const trends = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const where: any = {
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      };

      if (['PARTNER', 'BUYER'].includes(user.role)) {
        where.assignedTo = user.id;
      }

      const [
        newOpportunities,
        convertedOpportunities,
        completedVisits,
      ] = await Promise.all([
        prisma.opportunity.count({ where }),
        prisma.opportunity.count({
          where: {
            ...where,
            status: OpportunityStatus.CONVERTED,
          },
        }),
        prisma.visit.count({
          where: {
            completedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
            ...(['PARTNER', 'BUYER'].includes(user.role) && { visitorId: user.id }),
          },
        }),
      ]);

      trends.push({
        month: monthStart.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        newOpportunities,
        convertedOpportunities,
        completedVisits,
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Erro ao buscar tendências' });
  }
});

// ============================================
// GET FUNNEL - INDIVIDUAL (for buyers)
// ============================================
router.get('/funnel/individual', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    const userId = req.query.userId as string || user.id;

    // Only allow viewing own funnel or managers viewing their team's
    if (user.id !== userId && !['MANAGER', 'DIRECTOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const where: any = {
      assignedTo: userId,
      status: { not: 'INACTIVE' },
    };

    const opportunities = await prisma.opportunity.findMany({
      where,
      select: {
        id: true,
        name: true,
        stage: true,
        type: true,
        city: true,
        state: true,
        quantityGenerated: true,
        responsibleName: true,
        responsiblePhone: true,
        assignedUser: {
          select: { id: true, name: true },
        },
        _count: {
          select: { contacts: true, visits: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by stage
    const funnel = {
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
    };

    res.json({
      user: { id: user.id, name: user.name },
      funnel,
      total: opportunities.length,
    });
  } catch (error) {
    console.error('Get individual funnel error:', error);
    res.status(500).json({ error: 'Erro ao buscar funil individual' });
  }
});

// ============================================
// GET FUNNEL - CONSOLIDATED (for managers+)
// ============================================
router.get('/funnel/consolidated', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    
    // Only managers+ can see consolidated funnel
    if (!['MANAGER', 'DIRECTOR', 'INTEL_COORDINATOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: {
        status: { not: 'INACTIVE' },
      },
      select: {
        id: true,
        name: true,
        stage: true,
        type: true,
        city: true,
        state: true,
        quantityGenerated: true,
        assignedTo: true,
        assignedUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by stage
    const byStage = {
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
    };

    // Group by assigned user
    const byUser: Record<string, any[]> = {};
    opportunities.forEach(o => {
      const userId = o.assignedTo;
      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push(o);
    });

    res.json({
      byStage,
      byUser,
      total: opportunities.length,
      stages: {
        active: ['PRIMEIRO_CONTATO', 'SEGUNDO_CONTATO', 'VISITA', 'EM_NEGOCIACAO', 'CONTRA_PROPOSTA', 'EM_FECHAMENTO'],
        closed: ['CONCLUIDA_SUCESSO'],
        rejected: ['FORA_DE_PERFIL', 'BAIXA_GERACAO_DIR', 'BAIXA_GERACAO_ENT'],
      },
    });
  } catch (error) {
    console.error('Get consolidated funnel error:', error);
    res.status(500).json({ error: 'Erro ao buscar funil consolidado' });
  }
});

export default router;
