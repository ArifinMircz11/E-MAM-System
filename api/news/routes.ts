import { Router } from 'express';
import { getAdminDb, getAdminAuth } from '../../src/lib/firebase-admin';
import { UserRole } from '../../src/types';

const router = Router();

// Middleware to check JWT / Auth (Enhanced to fetch role if missing in token)
const checkAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    req.user = decodedToken;

    // Fetch role from Firestore if not present in custom claims
    if (!decodedToken.role && !decodedToken.roles) {
      try {
        const userDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          (req.user as any)['role'] = (userData as any)?.['role'] || 'GURU';
        }
      } catch (e) {
        console.warn(`[News Auth] Could not fetch user role for ${decodedToken.uid}`);
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/', async (req: any, res) => {
  try {
    const db = getAdminDb();
    const tenantId = req.query.tenantId || '30315537';
    const onlyPublished = req.query.onlyPublished !== 'false';

    let q = db.collection('news').where('tenantId', '==', tenantId);
    if (onlyPublished) {
      q = q.where('isPublished', '==', true);
    }

    const snapshot = await q.orderBy('date', 'desc').limit(50).get();
    const news = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json(news);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkAuth, async (req: any, res) => {
  try {
    const db = getAdminDb();
    const { newsData, tenantId } = req.body;

    // RBAC check
    const roles = req.user.roles || [req.user.role];
    const isAuthorized = roles.some(
      (r: any) =>
        typeof r === 'string' && ['admin', 'developer', 'staf', 'humas'].includes(r.toLowerCase()),
    );

    if (!isAuthorized) {
      console.warn(`[News API] Unauthorized POST attempt by ${req.user.uid} with roles:`, roles);
      return res.status(403).json({ error: 'Forbidden' });
    }

    const docRef = await db.collection('news').add({
      ...newsData,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({ id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkAuth, async (req: any, res) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;
    const { newsData } = req.body;

    const roles = req.user.roles || [req.user.role];
    const isAuthorized = roles.some(
      (r: any) =>
        typeof r === 'string' && ['admin', 'developer', 'staf', 'humas'].includes(r.toLowerCase()),
    );

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db
      .collection('news')
      .doc(id)
      .update({
        ...newsData,
        updatedAt: new Date().toISOString(),
      });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkAuth, async (req: any, res) => {
  try {
    const db = getAdminDb();
    const { id } = req.params;

    const roles = req.user.roles || [req.user.role];
    const isAuthorized = roles.some(
      (r: any) => typeof r === 'string' && ['admin', 'developer'].includes(r.toLowerCase()),
    );

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.collection('news').doc(id).delete();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
