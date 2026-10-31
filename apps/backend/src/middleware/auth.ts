import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { store } from '../services/store.service';
import { IUser, UserRole } from '@nexus/types';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret) as { userId: string; role: UserRole };
    const user = store.users.get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not found or session revoked' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of roles: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
