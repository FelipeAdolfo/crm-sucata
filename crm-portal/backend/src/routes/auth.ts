import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import {
  authenticate,
  requireAnyRole,
} from '../middleware/auth';
import {
  hashPassword,
  comparePassword,
  generateToken,
} from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// CONFIGURACOES DE SEGURANCA
// ============================================
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// Rate limiting para login
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'LOGIN_RATE_LIMIT',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

// Schemas de validacao Zod
const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string()
    .min(12, 'Senha deve ter no minimo 12 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiuscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minuscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um numero')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  name: z.string().min(3, 'Nome deve ter no minimo 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 digitos').optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url('URL do LinkedIn invalida').optional().or(z.literal('')),
  facebookUrl: z.string().url('URL do Facebook invalida').optional().or(z.literal('')),
  instagramUrl: z.string().url('URL do Instagram invalida').optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string()
    .min(12, 'Nova senha deve ter no minimo 12 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiuscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minuscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um numero')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
});

// Helper para pegar IP
const getClientIp = (req: any): string => {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] as string ||
    req.ip ||
    'unknown';
};

// ============================================
// REGISTRO DE NOVO USUARIO
// ============================================
router.post('/register', async (req, res) => {
  try {
    // Validar com Zod
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { email, password, name, cpf, phone, linkedinUrl, facebookUrl, instagramUrl } = parseResult.data;

    // Verificar se email ja existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email ja cadastrado',
        code: 'EMAIL_EXISTS',
      });
    }

    // Verificar se CPF ja existe (se fornecido)
    if (cpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf },
      });
      if (existingCpf) {
        return res.status(409).json({
          error: 'CPF ja cadastrado',
          code: 'CPF_EXISTS',
        });
      }
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuario com status PENDING
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        cpf,
        phone,
        linkedinUrl: linkedinUrl || undefined,
        facebookUrl: facebookUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        status: 'PENDING',
        role: 'PARTNER',
        firstLogin: true,
        failedLoginAttempts: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        role: true,
        linkedinUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Cadastro realizado com sucesso! Aguarde aprovacao do administrador.',
      user,
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ============================================
// LOGIN
// ============================================
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = getClientIp(req);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Verificar se usuario existe
    if (!user) {
      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verificar se conta esta bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(403).json({
        error: `Conta temporariamente bloqueada. Tente novamente em ${minutesLeft} minutos.`,
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil,
      });
    }

    // Verificar senha
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      // Incrementar contador de tentativas falhas
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000)
            : null,
        },
      });

      if (shouldLock) {
        return res.status(403).json({
          error: `Conta bloqueada por ${LOCKOUT_DURATION_MINUTES} minutos devido a muitas tentativas incorretas.`,
          code: 'ACCOUNT_LOCKED',
        });
      }

      return res.status(401).json({
        error: 'Email ou senha incorretos',
        code: 'INVALID_CREDENTIALS',
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts,
      });
    }

    // Verificar status do usuario
    if (user.status === 'PENDING') {
      return res.status(403).json({
        error: 'Seu cadastro esta aguardando aprovacao do administrador.',
        code: 'PENDING_APPROVAL',
        status: 'PENDING',
      });
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({
        error: 'Seu cadastro foi rejeitado. Entre em contato com o administrador.',
        code: 'REJECTED',
        status: 'REJECTED',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Sua conta foi suspensa. Entre em contato com o administrador.',
        code: 'SUSPENDED',
        status: 'SUSPENDED',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        error: 'Sua conta esta inativa. Entre em contato com o administrador.',
        code: 'INACTIVE',
        status: 'INACTIVE',
      });
    }

    // Gerar token de acesso
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    const token = generateToken(tokenPayload);

    // Gerar refresh token
    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');

    // Salvar refresh token no banco
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // Criar sessão ativa
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token: token,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'] || 'unknown',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      },
    });

    // Resetar tentativas falhas e atualizar ultimo login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      },
    });

    res.json({
      token,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        firstLogin: user.firstLogin,
        linkedinUrl: user.linkedinUrl,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        deviceId: user.deviceId,
        deviceModel: user.deviceModel,
        deviceStatus: user.deviceStatus,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ============================================
// LOGOUT
// ============================================
router.post('/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const refreshHeader = req.headers['x-refresh-token'] as string;

    // Revogar refresh token se fornecido
    if (refreshHeader) {
      const refreshHash = crypto.createHash('sha256').update(refreshHeader).digest('hex');
      await prisma.refreshToken.updateMany({
        where: { token: refreshHash },
        data: { revokedAt: new Date() },
      });
    }

    // Invalidar sessão ativa
    if (token) {
      await prisma.userSession.updateMany({
        where: { token },
        data: { isValid: false },
      });
    }

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Erro no logout' });
  }
});

// ============================================
// REFRESH TOKEN
// ============================================
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token obrigatório' });
    }

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: {
        token: refreshHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const user = tokenRecord.user;

    // Gerar novo token de acesso
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    const newToken = generateToken(tokenPayload);

    // Gerar novo refresh token
    const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshTokenValue).digest('hex');

    // Revogar token antigo e criar novo
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || 'unknown',
        },
      }),
    ]);

    res.json({
      token: newToken,
      refreshToken: newRefreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        linkedinUrl: user.linkedinUrl,
        facebookUrl: user.facebookUrl,
        instagramUrl: user.instagramUrl,
        deviceId: user.deviceId,
        deviceModel: user.deviceModel,
        deviceStatus: user.deviceStatus,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
});

// ============================================
// LOGOUT DE TODAS AS SESSOES
// ============================================
router.post('/logout-all', authenticate, async (req, res) => {
  res.json({ message: 'Todas as sessoes encerradas com sucesso' });
});

// ============================================
// OBTER PERFIL DO USUARIO LOGADO
// ============================================
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        firstLogin: true,
        lastLoginAt: true,
        createdAt: true,
        twoFactorEnabled: true,
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
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ============================================
// ALTERAR SENHA
// ============================================
router.post('/change-password', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    // Validar com Zod
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dados invalidos',
        code: 'VALIDATION_ERROR',
        details: parseResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Buscar usuario com senha
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    // Verificar senha atual
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Senha atual incorreta',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    // Verificar se nova senha eh diferente
    const isSamePassword = await comparePassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'A nova senha deve ser diferente da senha atual',
        code: 'SAME_PASSWORD',
      });
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(newPassword);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        firstLogin: false,
      },
    });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ============================================
// APROVACAO DE USUARIOS (ADMIN ONLY)
// ============================================

// Listar usuarios pendentes de aprovacao
router.get('/pending-users', authenticate, requireAnyRole([UserRole.ADMIN, UserRole.DIRECTOR]), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuarios pendentes:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Aprovar usuario
router.post('/approve/:userId', authenticate, requireAnyRole([UserRole.ADMIN, UserRole.DIRECTOR]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = 'PARTNER' } = req.body;

    // Verificar se usuario existe e esta pendente
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Usuario nao esta aguardando aprovacao',
        code: 'NOT_PENDING',
      });
    }

    // Aprovar usuario
    const approvedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        role: role as UserRole,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    res.json({
      message: 'Usuario aprovado com sucesso',
      user: approvedUser,
    });
  } catch (error) {
    console.error('Erro ao aprovar usuario:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Rejeitar usuario
router.post('/reject/:userId', authenticate, requireAnyRole([UserRole.ADMIN, UserRole.DIRECTOR]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Usuario nao esta aguardando aprovacao',
        code: 'NOT_PENDING',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
      },
    });

    res.json({ message: 'Usuario rejeitado' });
  } catch (error) {
    console.error('Erro ao rejeitar usuario:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Suspender usuario
router.post('/suspend/:userId', authenticate, requireAnyRole([UserRole.ADMIN, UserRole.DIRECTOR]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (userId === req.user!.id) {
      return res.status(400).json({
        error: 'Voce nao pode suspender sua propria conta',
        code: 'CANNOT_SUSPEND_SELF',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    res.json({ message: 'Usuario suspenso' });
  } catch (error) {
    console.error('Erro ao suspender usuario:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Reativar usuario
router.post('/activate/:userId', authenticate, requireAnyRole([UserRole.ADMIN, UserRole.DIRECTOR]), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' });
    }

    if (user.status !== 'SUSPENDED' && user.status !== 'INACTIVE') {
      return res.status(400).json({
        error: 'Usuario nao esta suspenso ou inativo',
        code: 'NOT_SUSPENDED',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    res.json({ message: 'Usuario reativado' });
  } catch (error) {
    console.error('Erro ao reativar usuario:', error);
    res.status(500).json({
      error: 'Erro interno no servidor',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
