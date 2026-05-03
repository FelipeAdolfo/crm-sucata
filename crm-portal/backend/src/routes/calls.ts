import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient, ActivityType, UserRole } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ============================================
// NORMALIZAR TELEFONE (remove caracteres nao numericos)
// ============================================
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ============================================
// BUSCAR ENTIDADE POR TELEFONE
// Verifica em oportunidades e contatos
// ============================================
async function findEntityByPhone(rawPhone: string) {
  const normalized = normalizePhone(rawPhone);

  // 1. Buscar em oportunidades (telefone principal)
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      OR: [
        { phone: { contains: normalized } },
        { documentNumber: { contains: normalized } },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      type: true,
      stage: true,
      assignedToId: true,
    },
  });

  if (opportunity) {
    return { type: 'OPPORTUNITY' as const, entity: opportunity };
  }

  // 2. Buscar em contatos (telefone do contato)
  const contact = await prisma.contact.findFirst({
    where: {
      OR: [
        { phoneMobile: { contains: normalized } },
        { phoneLandline: { contains: normalized } },
      ],
    },
    include: {
      opportunity: {
        select: {
          id: true,
          name: true,
          phone: true,
          type: true,
          stage: true,
          assignedToId: true,
        },
      },
    },
  });

  if (contact && contact.opportunity) {
    return { type: 'CONTACT' as const, entity: contact.opportunity, contactName: contact.name };
  }

  return null;
}

// ============================================
// POST /api/calls/register
// Registra uma chamada recebida do app Android
// ============================================
router.post(
  '/register',
  [
    body('telefone').notEmpty().withMessage('Telefone e obrigatorio'),
    body('nome_contato').notEmpty().withMessage('Nome do contato e obrigatorio'),
    body('duracao_segundos').isInt({ min: 0 }).withMessage('Duracao deve ser um numero inteiro >= 0'),
    body('data_hora_ms').isInt().withMessage('Data/hora em milliseconds e obrigatoria'),
    body('tipo_chamada').optional().isIn(['RECEBIDA', 'REALIZADA', 'PERDIDA']).withMessage('Tipo deve ser RECEBIDA, REALIZADA ou PERDIDA'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados invalidos', details: errors.array() });
    }

    const {
      telefone,
      nome_contato,
      duracao_segundos,
      data_hora_ms,
      tipo_chamada = 'REALIZADA',
      user_id,
    } = req.body;

    try {
      // 1. Buscar se o telefone pertence a alguma oportunidade/contato
      const found = await findEntityByPhone(telefone);

      if (!found) {
        return res.status(404).json({
          success: false,
          code: 'PHONE_NOT_FOUND',
          message: 'Numero nao vinculado a nenhuma empresa ou oportunidade no sistema.',
          telefone: normalizePhone(telefone),
        });
      }

      const opportunity = found.entity;
      const dataChamada = new Date(Number(data_hora_ms));

      // 2. Determinar tipo de atividade baseado na duracao
      let activityType: ActivityType;
      if (duracao_segundos === 0) {
        activityType = 'CALL_MISSED' as ActivityType;
      } else if (duracao_segundos < 30) {
        activityType = 'CALL' as ActivityType;
      } else {
        activityType = 'CALL_COMPLETED' as ActivityType;
      }

      // 3. Criar atividade no historico de relacionamento
      const activity = await prisma.activity.create({
        data: {
          type: activityType,
          description: `Chamada ${tipo_chamada.toLowerCase()} para ${nome_contato} (${telefone}). Duracao: ${formatDuration(duracao_segundos)}.`,
          opportunityId: opportunity.id,
          userId: user_id || opportunity.assignedToId || undefined,
          metadata: {
            telefone: normalizePhone(telefone),
            nome_contato,
            duracao_segundos,
            tipo_chamada,
            data_hora_ms: Number(data_hora_ms),
            origem: 'app_android',
            entidade_tipo: found.type,
            contato_nome: 'contactName' in found ? found.contactName : null,
          },
        },
      });

      // 4. Buscar oportunidade completa para resposta
      const oppComplete = await prisma.opportunity.findUnique({
        where: { id: opportunity.id },
        select: {
          id: true,
          name: true,
          phone: true,
          type: true,
          stage: true,
          city: true,
          state: true,
          assignedTo: { select: { id: true, name: true } },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Chamada registrada no historico de relacionamento.',
        activity: {
          id: activity.id,
          type: activityType,
          description: activity.description,
          createdAt: activity.createdAt,
        },
        opportunity: oppComplete,
      });
    } catch (error) {
      console.error('[ERRO_REGISTRO_CHAMADA]', error);
      return res.status(500).json({
        error: 'Erro interno ao registrar chamada.',
        code: 'INTERNAL_ERROR',
      });
    }
  }
);

// ============================================
// GET /api/calls
// Lista chamadas registradas (com filtros)
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      opportunityId,
      userId,
      tipo,
      periodo,
      page = '1',
      limit = '20',
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {
      type: {
        in: ['CALL', 'CALL_COMPLETED', 'CALL_MISSED'],
      },
    };

    if (opportunityId) {
      where.opportunityId = String(opportunityId);
    }

    if (userId) {
      where.userId = String(userId);
    }

    if (tipo) {
      where.type = String(tipo).toUpperCase();
    }

    // Filtro por periodo
    if (periodo) {
      const dias = Number(periodo);
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - dias);
      where.createdAt = { gte: dataInicio };
    }

    // Se for comprador (nao gerente+), so ve suas proprias chamadas
    if (req.user!.role === UserRole.BUYER || req.user!.role === UserRole.PARTNER) {
      where.userId = req.user!.id;
    }

    const [calls, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          opportunity: {
            select: {
              id: true,
              name: true,
              phone: true,
              type: true,
              stage: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.activity.count({ where }),
    ]);

    // Estatisticas
    const stats = {
      total,
      realizadas: calls.filter((c) => c.type === 'CALL_COMPLETED').length,
      nao_atendidas: calls.filter((c) => c.type === 'CALL_MISSED').length,
      tentativas: calls.filter((c) => c.type === 'CALL').length,
    };

    res.json({
      calls,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List calls error:', error);
    res.status(500).json({ error: 'Erro ao listar chamadas' });
  }
});

// ============================================
// GET /api/calls/stats
// Estatisticas de chamadas
// ============================================
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const dias = Number(periodo);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);

    const baseWhere: any = {
      type: { in: ['CALL', 'CALL_COMPLETED', 'CALL_MISSED'] },
      createdAt: { gte: dataInicio },
    };

    if (req.user!.role === UserRole.BUYER || req.user!.role === UserRole.PARTNER) {
      baseWhere.userId = req.user!.id;
    }

    const [total, completed, missed, attempted] = await Promise.all([
      prisma.activity.count({ where: baseWhere }),
      prisma.activity.count({ where: { ...baseWhere, type: 'CALL_COMPLETED' } }),
      prisma.activity.count({ where: { ...baseWhere, type: 'CALL_MISSED' } }),
      prisma.activity.count({ where: { ...baseWhere, type: 'CALL' } }),
    ]);

    // Media de duracao das chamadas completadas
    const completedCalls = await prisma.activity.findMany({
      where: {
        ...baseWhere,
        type: 'CALL_COMPLETED',
      },
      select: { metadata: true },
    });

    const durations = completedCalls
      .map((c) => (c.metadata as any)?.duracao_segundos)
      .filter((d): d is number => typeof d === 'number');

    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    res.json({
      periodo: dias,
      total,
      completed,
      missed,
      attempted,
      avgDurationSeconds: avgDuration,
      avgDurationFormatted: formatDuration(avgDuration),
      conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  } catch (error) {
    console.error('Call stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatisticas' });
  }
});

// ============================================
// DELETE /api/calls/:id
// Remove registro de chamada (ADMIN/gerente)
// ============================================
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a chamada existe
    const call = await prisma.activity.findFirst({
      where: {
        id,
        type: { in: ['CALL', 'CALL_COMPLETED', 'CALL_MISSED'] },
      },
    });

    if (!call) {
      return res.status(404).json({ error: 'Registro de chamada nao encontrado' });
    }

    // Verificar permissao
    if (
      req.user!.role !== UserRole.ADMIN &&
      req.user!.role !== UserRole.MANAGER &&
      req.user!.role !== UserRole.DIRECTOR &&
      call.userId !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Sem permissao para excluir este registro' });
    }

    await prisma.activity.delete({ where: { id } });

    res.json({ message: 'Registro de chamada removido' });
  } catch (error) {
    console.error('Delete call error:', error);
    res.status(500).json({ error: 'Erro ao remover registro' });
  }
});

// ============================================
// HELPER: Formatar duracao em segundos
// ============================================
function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}min ${secs}s`;
}

export default router;
