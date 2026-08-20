import { firestoreGateway as dbGateway } from '../gateways/FirestoreGateway';

export const subscribeToMasterVersion = (setMasterVersion: (version: number) => void) => {
  const checkVersion = async () => {
    if (document.visibilityState === 'hidden') return;
    try {
      const snap = await dbGateway.getDoc(dbGateway.doc(dbGateway.db, 'system', 'config'));
      if (snap.exists()) {
        const data = snap.data();
        const serverVersion = data?.master_version || 1;
        setMasterVersion(serverVersion);
      }
    } catch (err) {
      console.warn('[MasterVersionListener] Check failed:', err);
    }
  };

  checkVersion();
  // Polling significantly less frequently and only when visible (30 minutes)
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      checkVersion();
    }
  }, 30 * 60000);

  return () => clearInterval(interval);
};
