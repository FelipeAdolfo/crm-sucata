import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET USER NOTIFICATIONS
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { unreadOnly = 'false', limit = '20' } = req.query;
    const limitNum = parseInt(limit as string);

    const where: any = {
      userId: req.user!.id,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limitNum,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
  }
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações' });
  }
});

// ============================================
// DELETE NOTIFICATION
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notificação excluída' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Erro ao excluir notificação' });
  }
});

export default router;
