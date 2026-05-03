import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth';
import { hashPassword, validatePassword, validateCPF, formatCPF } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// GET ALL USERS (Admin only)
// ============================================
router.get('/', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search, 
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role) where.role = role;
    if (status) where.status = status;
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          cpf: true,
          phone: true,
          role: true,
          status: true,
          twoFactorEnabled: true,
          firstLogin: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// ============================================
// GET USER BY ID
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only see their own profile or admins can see any
    if (req.user!.id !== id && 
        ![UserRole.MANAGER, UserRole.DIRECTOR, UserRole.INTEL_COORDINATOR].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        firstLogin: true,
        createdAt: true,
        lastLoginAt: true,
        linkedinUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        deviceId: true,
        deviceModel: true,
        deviceOsVersion: true,
        deviceAppVersion: true,
        deviceLinkedAt: true,
        deviceStatus: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// ============================================
// CREATE USER (Admin only)
// ============================================
router.post('/', authenticate, requireRole(UserRole.MANAGER), [
  body('email').isEmail().withMessage('Email inválido'),
  body('name').notEmpty().withMessage('Nome obrigatório'),
  body('cpf').notEmpty().withMessage('CPF obrigatório'),
  body('role').isIn(Object.values(UserRole)).withMessage('Função inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, name, cpf, phone, role } = req.body;

    // Validate CPF
    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    const formattedCPF = formatCPF(cpf);

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Check if CPF exists
    const existingCPF = await prisma.user.findFirst({
      where: { cpf: formattedCPF },
    });

    if (existingCPF) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }

    // Generate temporary password (CPF inverted)
    const { invertCPF } = await import('../utils/auth');
    const tempPassword = invertCPF(cpf);
    const hashedPassword = await hashPassword(tempPassword);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        cpf: formattedCPF,
        phone,
        role: role as UserRole,
        status: UserStatus.ACTIVE,
        firstLogin: true, // Must change password on first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        firstLogin: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      ...user,
      tempPassword, // Send this to admin to share with user
      message: 'Usuário criado com sucesso. Senha temporária: CPF invertido',
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// ============================================
// UPDATE USER (Admin only)
// ============================================
router.put('/:id', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, phone, role, status,
      linkedinUrl, facebookUrl, instagramUrl,
      deviceId, deviceModel, deviceOsVersion, deviceAppVersion, deviceStatus,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Only directors can change roles to MANAGER or higher
    if (role && 
        [UserRole.MANAGER, UserRole.DIRECTOR, UserRole.INTEL_COORDINATOR].includes(role) &&
        req.user!.role !== UserRole.DIRECTOR) {
      return res.status(403).json({ error: 'Apenas diretores podem atribuir funções gerenciais' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        role: role || undefined,
        status: status || undefined,
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl || null) : undefined,
        facebookUrl: facebookUrl !== undefined ? (facebookUrl || null) : undefined,
        instagramUrl: instagramUrl !== undefined ? (instagramUrl || null) : undefined,
        deviceId: deviceId !== undefined ? (deviceId || null) : undefined,
        deviceModel: deviceModel !== undefined ? (deviceModel || null) : undefined,
        deviceOsVersion: deviceOsVersion !== undefined ? (deviceOsVersion || null) : undefined,
        deviceAppVersion: deviceAppVersion !== undefined ? (deviceAppVersion || null) : undefined,
        deviceStatus: deviceStatus || undefined,
        deviceLinkedAt: deviceId && !user.deviceId ? new Date() : undefined,
        deviceLinkedBy: deviceId && !user.deviceId ? req.user!.id : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        firstLogin: true,
        updatedAt: true,
        linkedinUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        deviceId: true,
        deviceModel: true,
        deviceOsVersion: true,
        deviceAppVersion: true,
        deviceLinkedAt: true,
        deviceStatus: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// ============================================
// RESET USER PASSWORD (Admin only)
// ============================================
router.post('/:id/reset-password', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Generate new password (CPF inverted)
    const { invertCPF } = await import('../utils/auth');
    const tempPassword = invertCPF(user.cpf || '00000000000');
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        firstLogin: true,
        passwordChangedAt: null,
      },
    });

    res.json({
      message: 'Senha resetada com sucesso',
      tempPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Erro ao resetar senha' });
  }
});

// ============================================
// DELETE USER (Director only)
// ============================================
router.delete('/:id', authenticate, requireRole(UserRole.DIRECTOR), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Cannot delete yourself
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// ============================================
// GET USER STATS (Admin only)
// ============================================
router.get('/stats/summary', authenticate, requireRole(UserRole.MANAGER), async (req, res) => {
  try {
    const [byRole, byStatus, total] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.user.count(),
    ]);

    res.json({
      total,
      byRole,
      byStatus,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ============================================
// UPDATE OWN PROFILE (Authenticated user)
// ============================================
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, email, phone, cpf, linkedinUrl, facebookUrl, instagramUrl } = req.body;
    const userId = req.user!.id;

    // Verificar se email já existe (exceto o próprio)
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (existing) {
        return res.status(409).json({ error: 'Email já cadastrado por outro usuário' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(cpf && { cpf: formatCPF(cpf) }),
        linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl || null) : undefined,
        facebookUrl: facebookUrl !== undefined ? (facebookUrl || null) : undefined,
        instagramUrl: instagramUrl !== undefined ? (instagramUrl || null) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        twoFactorEnabled: true,
        firstLogin: true,
        updatedAt: true,
        linkedinUrl: true,
        facebookUrl: true,
        instagramUrl: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// ============================================
// UPDATE NOTIFICATION PREFERENCES
// ============================================
router.patch('/notifications', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const settings = req.body;

    // Criar ou atualizar preferências do usuário
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationSettings: settings,
      },
      select: {
        id: true,
        notificationSettings: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências' });
  }
});

export default router;
