import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient, PhotoCategory } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET PHOTOS BY OPPORTUNITY
// ============================================
router.get('/opportunity/:opportunityId', authenticate, async (req, res) => {
  try {
    const { opportunityId } = req.params;
    const { category } = req.query;

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

    const where: any = { opportunityId };
    if (category) where.category = category;

    const photos = await prisma.photo.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

// ============================================
// UPLOAD PHOTO
// ============================================
router.post('/', authenticate, [
  body('opportunityId').notEmpty().withMessage('ID da oportunidade obrigatório'),
  body('url').notEmpty().withMessage('URL da foto obrigatória'),
  body('category').isIn(Object.values(PhotoCategory)).withMessage('Categoria inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      opportunityId,
      url,
      thumbnailUrl,
      category,
      description,
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

    const photo = await prisma.photo.create({
      data: {
        opportunityId,
        url,
        thumbnailUrl,
        category: category as PhotoCategory,
        description,
        uploadedBy: req.user!.id,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId,
        userId: req.user!.id,
        type: 'PHOTO_UPLOADED',
        description: `Foto adicionada: ${category}`,
      },
    });

    res.status(201).json(photo);
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
});

// ============================================
// DELETE PHOTO
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && 
        photo.uploadedBy !== req.user!.id &&
        photo.opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.photo.delete({ where: { id } });

    res.json({ message: 'Foto excluída com sucesso' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Erro ao excluir foto' });
  }
});

export default router;
