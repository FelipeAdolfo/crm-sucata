import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient, VisitStatus } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET ALL VISITS
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      opportunityId,
      status,
      startDate,
      endDate,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (opportunityId) where.opportunityId = opportunityId as string;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate as string);
      if (endDate) where.scheduledAt.lte = new Date(endDate as string);
    }

    // Partners and buyers can only see their visits
    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.visitorId = req.user!.id;
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          opportunity: {
            select: { id: true, name: true, city: true, state: true },
          },
          visitor: {
            select: { id: true, name: true },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.visit.count({ where }),
    ]);

    res.json({
      visits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ error: 'Erro ao buscar visitas' });
  }
});

// ============================================
// GET UPCOMING VISITS
// ============================================
router.get('/upcoming', authenticate, async (req, res) => {
  try {
    const where: any = {
      scheduledAt: { gte: new Date() },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
    };

    if (['PARTNER', 'BUYER'].includes(req.user!.role)) {
      where.visitorId = req.user!.id;
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        opportunity: {
          select: { id: true, name: true, city: true, state: true, address: true },
        },
        visitor: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    res.json(visits);
  } catch (error) {
    console.error('Get upcoming visits error:', error);
    res.status(500).json({ error: 'Erro ao buscar visitas agendadas' });
  }
});

// ============================================
// GET VISIT BY ID
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        opportunity: {
          select: { 
            id: true, 
            name: true, 
            city: true, 
            state: true, 
            address: true,
            assignedTo: true,
          },
        },
        visitor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        checklist: true,
        photos: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    // Check permissions
    if (['PARTNER', 'BUYER'].includes(req.user!.role) && 
        visit.visitorId !== req.user!.id && 
        visit.opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(visit);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Erro ao buscar visita' });
  }
});

// ============================================
// CREATE VISIT
// ============================================
router.post('/', authenticate, [
  body('opportunityId').notEmpty().withMessage('ID da oportunidade obrigatório'),
  body('scheduledAt').isISO8601().withMessage('Data inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      opportunityId,
      scheduledAt,
      duration,
      objectives,
    } = req.body;

    // Check if user has access to this opportunity
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const visit = await prisma.visit.create({
      data: {
        opportunityId,
        scheduledAt: new Date(scheduledAt),
        duration,
        objectives,
        visitorId: req.user!.id,
        status: VisitStatus.SCHEDULED,
      },
      include: {
        opportunity: {
          select: { id: true, name: true, city: true, state: true },
        },
        visitor: {
          select: { id: true, name: true },
        },
      },
    });

    // Update opportunity stage if needed
    if (opportunity.stage !== 'VISITA') {
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { stage: 'VISITA' },
      });
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId,
        userId: req.user!.id,
        type: 'VISIT_SCHEDULED',
        description: `Visita agendada para ${new Date(scheduledAt).toLocaleDateString('pt-BR')}`,
      },
    });

    res.status(201).json(visit);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ error: 'Erro ao agendar visita' });
  }
});

// ============================================
// UPDATE VISIT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const data: any = {};
    
    if (updateData.scheduledAt) data.scheduledAt = new Date(updateData.scheduledAt);
    if (updateData.duration) data.duration = updateData.duration;
    if (updateData.objectives) data.objectives = updateData.objectives;
    if (updateData.status) data.status = updateData.status as VisitStatus;
    
    // GPS location data
    if (updateData.visitorLatitude !== undefined) data.visitorLatitude = updateData.visitorLatitude;
    if (updateData.visitorLongitude !== undefined) data.visitorLongitude = updateData.visitorLongitude;
    if (updateData.locationVerified !== undefined) data.locationVerified = updateData.locationVerified;
    if (updateData.locationDistance !== undefined) data.locationDistance = updateData.locationDistance;
    if (updateData.verifiedAt) data.verifiedAt = new Date(updateData.verifiedAt);

    const updated = await prisma.visit.update({
      where: { id },
      data,
      include: {
        opportunity: {
          select: { id: true, name: true, city: true, state: true },
        },
        visitor: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ error: 'Erro ao atualizar visita' });
  }
});

// ============================================
// VERIFY VISIT LOCATION (GPS)
// ============================================
router.post('/:id/verify-location', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórios' });
    }

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { 
        opportunity: {
          select: { 
            id: true, 
            name: true, 
            latitude: true, 
            longitude: true, 
            geofenceRadius 
          },
        },
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Check if opportunity has geolocation
    if (!visit.opportunity.latitude || !visit.opportunity.longitude) {
      return res.status(400).json({ 
        error: 'Oportunidade não possui coordenadas cadastradas',
        needsLocation: true,
      });
    }

    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (visit.opportunity.latitude * Math.PI) / 180;
    const φ2 = (latitude * Math.PI) / 180;
    const Δφ = ((latitude - visit.opportunity.latitude) * Math.PI) / 180;
    const Δλ = ((longitude - visit.opportunity.longitude) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Default geofence radius is 100 meters if not set
    const geofenceRadius = visit.opportunity.geofenceRadius || 100;
    const isVerified = distance <= geofenceRadius;

    // Update visit with location data
    const updated = await prisma.visit.update({
      where: { id },
      data: {
        visitorLatitude: latitude,
        visitorLongitude: longitude,
        locationVerified: isVerified,
        locationDistance: distance,
        verifiedAt: isVerified ? new Date() : null,
      },
      include: {
        opportunity: {
          select: { id: true, name: true, city: true, state: true },
        },
        visitor: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      visit: updated,
      verification: {
        distance: Math.round(distance),
        geofenceRadius,
        isVerified,
        opportunityLocation: {
          latitude: visit.opportunity.latitude,
          longitude: visit.opportunity.longitude,
        },
      },
    });
  } catch (error) {
    console.error('Verify location error:', error);
    res.status(500).json({ error: 'Erro ao verificar localização' });
  }
});

// ============================================
// PATCH VISIT (Partial Update)
// ============================================
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const data: any = {};
    
    if (updateData.scheduledAt) data.scheduledAt = new Date(updateData.scheduledAt);
    if (updateData.duration) data.duration = updateData.duration;
    if (updateData.objectives) data.objectives = updateData.objectives;
    if (updateData.status) data.status = updateData.status as VisitStatus;
    if (updateData.result) data.result = updateData.result;
    if (updateData.observations) data.observations = updateData.observations;
    
    // GPS location data
    if (updateData.visitorLatitude !== undefined) data.visitorLatitude = updateData.visitorLatitude;
    if (updateData.visitorLongitude !== undefined) data.visitorLongitude = updateData.visitorLongitude;
    if (updateData.locationVerified !== undefined) data.locationVerified = updateData.locationVerified;
    if (updateData.locationDistance !== undefined) data.locationDistance = updateData.locationDistance;
    if (updateData.verifiedAt) data.verifiedAt = new Date(updateData.verifiedAt);

    const updated = await prisma.visit.update({
      where: { id },
      data,
      include: {
        opportunity: {
          select: { id: true, name: true, city: true, state: true },
        },
        visitor: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Patch visit error:', error);
    res.status(500).json({ error: 'Erro ao atualizar visita' });
  }
});

// ============================================
// COMPLETE VISIT
// ============================================
router.post('/:id/complete', authenticate, [
  body('result').notEmpty().withMessage('Resultado obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { result, observations, checklist } = req.body;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Update visit
    const updated = await prisma.visit.update({
      where: { id },
      data: {
        status: VisitStatus.COMPLETED,
        result,
        observations,
        completedAt: new Date(),
        checklist: checklist ? {
          create: {
            ...checklist,
          },
        } : undefined,
      },
      include: {
        opportunity: {
          select: { id: true, name: true },
        },
        checklist: true,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId: visit.opportunityId,
        userId: req.user!.id,
        type: 'VISIT_COMPLETED',
        description: `Visita concluída. Resultado: ${result}`,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Complete visit error:', error);
    res.status(500).json({ error: 'Erro ao concluir visita' });
  }
});

// ============================================
// CANCEL VISIT
// ============================================
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        status: VisitStatus.CANCELLED,
        observations: reason,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Cancel visit error:', error);
    res.status(500).json({ error: 'Erro ao cancelar visita' });
  }
});

// ============================================
// DELETE VISIT
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visita não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && visit.visitorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.visit.delete({ where: { id } });

    res.json({ message: 'Visita excluída com sucesso' });
  } catch (error) {
    console.error('Delete visit error:', error);
    res.status(500).json({ error: 'Erro ao excluir visita' });
  }
});

export default router;
