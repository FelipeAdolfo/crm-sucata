import { Request, Response, NextFunction } from 'express';
import { verifyToken, verifyTempToken } from '../utils/auth';
import { UserPayload } from '../types';
import { UserRole } from '@prisma/client';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Authenticate middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticação não fornecido' });
      return;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Verify temp token (for 2FA flow)
export const verifyTempAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token temporário não fornecido' });
      return;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyTempToken(token);
    
    // Attach temp user data to request
    (req as any).tempUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token temporário inválido ou expirado' });
  }
};

// Role hierarchy (from lowest to highest)
const roleHierarchy: UserRole[] = [
  UserRole.PARTNER,
  UserRole.BUYER,
  UserRole.ANALYST,
  UserRole.MANAGER,
  UserRole.DIRECTOR,
  UserRole.INTEL_COORDINATOR,
  UserRole.ADMIN,
];

// Check if user has required role or higher
const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const userIndex = roleHierarchy.indexOf(userRole);
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  
  return userIndex >= requiredIndex;
};

// Require specific role middleware
export const requireRole = (role: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    
    if (!hasRole(req.user.role, role)) {
      res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    
    next();
  };
};

// Require minimum role middleware (any of the roles)
export const requireAnyRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    
    const hasRequiredRole = roles.some(role => hasRole(req.user!.role, role));
    
    if (!hasRequiredRole) {
      res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      return;
    }
    
    next();
  };
};

// Check if user owns resource or has higher role
export const requireOwnerOrRole = (getResourceOwnerId: (req: Request) => Promise<string | null>, minRole?: UserRole) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    
    // Check if user has minimum required role
    if (minRole && hasRole(req.user.role, minRole)) {
      next();
      return;
    }
    
    // Check if user owns the resource
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId === req.user.id) {
        next();
        return;
      }
      
      res.status(403).json({ error: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
  };
};

// Require 2FA enabled
export const requireTwoFactor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  
  if (!req.user.twoFactorEnabled) {
    res.status(403).json({ error: 'Autenticação de dois fatores obrigatória' });
    return;
  }
  
  next();
};
