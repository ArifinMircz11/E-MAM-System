import { getAdminAuth, getAdminDb } from '../lib/firebase-admin';
import { SecurityContextImpl } from '../core/identity/security-context/SecurityContext';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      securityContext?: any;
    }
  }
}

export const verifyIdToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    req.user = decodedToken;

    const adminDb = getAdminDb();
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

    let userData: any = {};
    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
      if (adminDoc.exists) {
        userData = { ...adminDoc.data(), accountType: 'developer', role: 'developer' };
      } else {
        userData = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.admin ? 'developer' : 'siswa',
          tenantId: decodedToken.tenantId || '',
        };
      }
    }

    const isDeveloper = Boolean(
      userData.accountType === 'developer' ||
      userData.role === 'developer' ||
      decodedToken.admin ||
      (Array.isArray(userData.roles) && userData.roles.map((r: any) => String(r).toLowerCase()).includes('developer'))
    );

    const requestedTenant = req.headers['x-workspace-tenant'] as string | undefined;
    let resolvedTenantId = userData.tenantId;

    if (isDeveloper) {
      if (requestedTenant && requestedTenant.trim() !== '' && requestedTenant !== 'global' && requestedTenant !== 'system') {
        // Authoritatively verify tenant exists in Firestore
        const tenantDoc = await adminDb.collection('tenants').doc(requestedTenant).get();
        const madrasahDoc = tenantDoc.exists ? null : await adminDb.collection('madrasah').doc(requestedTenant).get();

        if (tenantDoc.exists || (madrasahDoc && madrasahDoc.exists)) {
          resolvedTenantId = requestedTenant.trim();
        } else {
          res.status(403).json({ success: false, error: `Forbidden: Target workspace tenant "${requestedTenant}" not found or inactive.` });
          return;
        }
      } else {
        resolvedTenantId = 'global';
      }
    } else {
      if (requestedTenant && requestedTenant.trim() !== '' && requestedTenant !== resolvedTenantId) {
        res.status(403).json({ success: false, error: 'Forbidden: Tenant switching not allowed for non-developer.' });
        return;
      }
      if (!resolvedTenantId || typeof resolvedTenantId !== 'string' || resolvedTenantId.trim() === '') {
        res.status(403).json({ success: false, error: 'Forbidden: Missing authoritative tenantId for user.' });
        return;
      }
    }

    const securityContext = new SecurityContextImpl({
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userData,
      tenantId: resolvedTenantId,
      isDeveloper,
    });

    req.securityContext = securityContext;
    next();
  } catch (error: any) {
    console.error('Error verifying ID token or resolving SecurityContext:', error);
    const status = error.message && error.message.includes('Fail-Closed') ? 403 : 401;
    res.status(status).json({ success: false, error: 'Forbidden: ' + (error.message || 'Authentication failed') });
  }
};

