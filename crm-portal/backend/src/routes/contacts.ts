import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET CONTACTS BY OPPORTUNITY
// ============================================
router.get('/opportunity/:opportunityId', authenticate, async (req, res) => {
  try {
    const { opportunityId } = req.params;

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

    const contacts = await prisma.contact.findMany({
      where: { opportunityId },
      orderBy: { isMainContact: 'desc' },
    });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// ============================================
// CREATE CONTACT
// ============================================
router.post('/', authenticate, [
  body('opportunityId').notEmpty().withMessage('ID da oportunidade obrigatório'),
  body('name').notEmpty().withMessage('Nome obrigatório'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      opportunityId,
      name,
      role,
      email,
      phoneMobile,
      phoneLandline,
      extension,
      linkedinUrl,
      facebookUrl,
      instagramUrl,
      isMainContact,
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

    // If setting as main contact, unset others
    if (isMainContact) {
      await prisma.contact.updateMany({
        where: { opportunityId },
        data: { isMainContact: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        opportunityId,
        name,
        role,
        email,
        phoneMobile,
        phoneLandline,
        extension,
        linkedinUrl,
        facebookUrl,
        instagramUrl,
        isMainContact: isMainContact || false,
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        opportunityId,
        userId: req.user!.id,
        type: 'CONTACT_ADDED',
        description: `Contato adicionado: ${name}`,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Erro ao criar contato' });
  }
});

// ============================================
// UPDATE CONTACT
// ============================================
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && contact.opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // If setting as main contact, unset others
    if (updateData.isMainContact) {
      await prisma.contact.updateMany({
        where: { opportunityId: contact.opportunityId, id: { not: id } },
        data: { isMainContact: false },
      });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        name: updateData.name || undefined,
        role: updateData.role || undefined,
        email: updateData.email || undefined,
        phoneMobile: updateData.phoneMobile || undefined,
        phoneLandline: updateData.phoneLandline || undefined,
        extension: updateData.extension || undefined,
        linkedinUrl: updateData.linkedinUrl || undefined,
        facebookUrl: updateData.facebookUrl || undefined,
        instagramUrl: updateData.instagramUrl || undefined,
        isMainContact: updateData.isMainContact !== undefined ? updateData.isMainContact : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Erro ao atualizar contato' });
  }
});

// ============================================
// DELETE CONTACT
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { opportunity: true },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    if (['PARTNER', 'BUYER'].includes(req.user!.role) && contact.opportunity.assignedTo !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.contact.delete({ where: { id } });

    res.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Erro ao excluir contato' });
  }
});

export default router;
