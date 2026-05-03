import { Router } from 'express';
import { PrismaClient, OpportunityStage, OpportunityStatus, UserRole } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET OPPORTUNITIES REPORT
// ============================================
router.get('/opportunities', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'stage' } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    let report;

    switch (groupBy) {
      case 'stage':
        report = await prisma.opportunity.groupBy({
          by: ['stage'],
          where,
          _count: { stage: true },
          _sum: { quantityGenerated: true },
        });
        break;

      case 'type':
        report = await prisma.opportunity.groupBy({
          by: ['type'],
          where,
          _count: { type: true },
        });
        break;

      case 'month':
        const opportunities = await prisma.opportunity.findMany({
          where,
          select: {
            createdAt: true,
            stage: true,
            quantityGenerated: true,
          },
        });

        const grouped = opportunities.reduce((acc: any, opp) => {
          const month = opp.createdAt.toISOString().slice(0, 7);
          if (!acc[month]) {
            acc[month] = { month, count: 0, totalQuantity: 0 };
          }
          acc[month].count++;
          acc[month].totalQuantity += opp.quantityGenerated || 0;
          return acc;
        }, {});

        report = Object.values(grouped).sort((a: any, b: any) => a.month.localeCompare(b.month));
        break;

      case 'user':
        report = await prisma.opportunity.groupBy({
          by: ['assignedTo'],
          where,
          _count: { assignedTo: true },
        });

        const userIds = report.map((r: any) => r.assignedTo);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        });

        report = report.map((r: any) => ({
          ...r,
          user: users.find(u => u.id === r.assignedTo),
        }));
        break;

      default:
        return res.status(400).json({ error: 'Agrupamento inválido' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get opportunities report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

// ============================================
// GET CONVERSION REPORT
// ============================================
router.get('/conversions', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.convertedAt = {};
      if (startDate) where.convertedAt.gte = new Date(startDate as string);
      if (endDate) where.convertedAt.lte = new Date(endDate as string);
    }

    const [totalConverted, conversionsByMonth, avgConversionTime] = await Promise.all([
      prisma.opportunity.count({
        where: { ...where, status: OpportunityStatus.CONVERTED },
      }),

      prisma.opportunity.findMany({
        where: { ...where, status: OpportunityStatus.CONVERTED },
        select: {
          convertedAt: true,
          quantityGenerated: true,
          createdAt: true,
        },
      }),

      prisma.opportunity.findMany({
        where: { ...where, status: OpportunityStatus.CONVERTED },
        select: {
          createdAt: true,
          convertedAt: true,
        },
      }),
    ]);

    // Group by month
    const byMonth = conversionsByMonth.reduce((acc: any, conv) => {
      const month = conv.convertedAt?.toISOString().slice(0, 7) || 'unknown';
      if (!acc[month]) {
        acc[month] = { month, count: 0, totalQuantity: 0 };
      }
      acc[month].count++;
      acc[month].totalQuantity += conv.quantityGenerated || 0;
      return acc;
    }, {});

    // Calculate average conversion time (days)
    let totalDays = 0;
    avgConversionTime.forEach(c => {
      if (c.convertedAt) {
        const diff = c.convertedAt.getTime() - c.createdAt.getTime();
        totalDays += diff / (1000 * 60 * 60 * 24);
      }
    });
    const avgDays = avgConversionTime.length > 0 ? totalDays / avgConversionTime.length : 0;

    res.json({
      totalConverted,
      byMonth: Object.values(byMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      avgConversionDays: Math.round(avgDays * 100) / 100,
    });
  } catch (error) {
    console.error('Get conversion report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de conversões' });
  }
});

// ============================================
// GET VISITS REPORT
// ============================================
router.get('/visits', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate as string);
      if (endDate) where.scheduledAt.lte = new Date(endDate as string);
    }

    const [byStatus, byVisitor, total] = await Promise.all([
      prisma.visit.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),

      prisma.visit.groupBy({
        by: ['visitorId'],
        where,
        _count: { visitorId: true },
      }),

      prisma.visit.count({ where }),
    ]);

    // Add visitor details
    const visitorIds = byVisitor.map((v: any) => v.visitorId);
    const users = await prisma.user.findMany({
      where: { id: { in: visitorIds } },
      select: { id: true, name: true },
    });

    res.json({
      total,
      byStatus,
      byVisitor: byVisitor.map((v: any) => ({
        ...v,
        visitor: users.find(u => u.id === v.visitorId),
      })),
    });
  } catch (error) {
    console.error('Get visits report error:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de visitas' });
  }
});

// ============================================
// EXPORT DATA
// ============================================
router.get('/export', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    let data;

    switch (type) {
      case 'opportunities':
        data = await prisma.opportunity.findMany({
          where,
          include: {
            assignedUser: { select: { name: true, email: true } },
            contacts: true,
            _count: { select: { visits: true, photos: true } },
          },
        });
        break;

      case 'visits':
        data = await prisma.visit.findMany({
          where,
          include: {
            visitor: { select: { name: true } },
            opportunity: { select: { name: true } },
          },
        });
        break;

      case 'activities':
        data = await prisma.activity.findMany({
          where,
          include: {
            user: { select: { name: true } },
            opportunity: { select: { name: true } },
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Tipo de exportação inválido' });
    }

    res.json({
      type,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

export default router;
