import type { NextFunction, Request, Response } from 'express';
import { getAdminAuth } from '../../src/lib/firebase-admin.js';

export interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
}

/**
 * Server-side authentication boundary.
 *
 * The Firebase ID token is the only trusted source of requester identity.
 * Client-controlled headers such as x-requester-uid are deliberately ignored.
 */
export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication token required.' });
    return;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified,
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or revoked authentication token.' });
  }
}
