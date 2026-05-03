import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import opportunityRoutes from './routes/opportunities';
import contactRoutes from './routes/contacts';
import visitRoutes from './routes/visits';
import photoRoutes from './routes/photos';
import activityRoutes from './routes/activities';
import marketIntelRoutes from './routes/marketIntel';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import callRoutes from './routes/calls';
import documentRoutes from './routes/documents';

// Load environment variables
dotenv.config();

// Import upload config
import { serveUploads } from './utils/upload';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));

// 2. CORS - Configuracao para Railway Cloud
// Suporta multiplas origens separadas por virgula na variavel FRONTEND_URL
const additionalOrigins = process.env.FRONTEND_URL?.split(',').map(o => o.trim()).filter(Boolean) || [];
const allowedOrigins = [
  ...additionalOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (mobile apps, curl, etc)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Permite origins locais e da Railway (*.railway.app)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      // Permite subdominios da Railway
      if (origin.endsWith('.up.railway.app')) return true;
      if (origin.endsWith('.railway.app')) return true;
      return false;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueado para origem: ${origin}`);
      callback(new Error('Origem nao permitida'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Refresh-Token'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400,
}));

// 3. Rate limiting
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisicoes por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Muitas requisicoes. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

app.use(apiRateLimit);

// 4. Body parsing with limits
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'JSON invalido' });
      throw new Error('Invalid JSON');
    }
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  skip: (req) => req.path.includes('/auth/login') || req.path.includes('/auth/register'),
}));

// 6. Serve static uploads (apenas em desenvolvimento)
serveUploads(app);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CRM Sucata API',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/market-intel', marketIntelRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/documents', documentRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
    code: 'ROUTE_NOT_FOUND',
  });
});

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Erros de validacao do Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados invalidos',
      code: 'VALIDATION_ERROR',
      details: err.errors,
    });
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalido',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Erro de CORS
  if (err.message === 'Origem nao permitida') {
    return res.status(403).json({
      error: 'Acesso negado',
      code: 'CORS_ERROR',
    });
  }

  // Erro de JSON invalido
  if (err.message === 'Invalid JSON') {
    return res.status(400).json({
      error: 'JSON invalido',
      code: 'INVALID_JSON',
    });
  }

  // Erro generico
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Erro interno do servidor',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
========================================
  CRM SUCATA - BACKEND
========================================
  Porta: ${PORT}
  Ambiente: ${process.env.NODE_ENV || 'development'}
  API: http://localhost:${PORT}/api
  Seguranca: Ativada
========================================
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Tratamento de erros nao capturados
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
