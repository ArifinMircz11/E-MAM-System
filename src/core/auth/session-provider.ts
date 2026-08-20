import { SecurityContext, EMPTY_SECURITY_CONTEXT } from './security-context';
import { CanonicalUser } from './canonical-user';
import { ClaimsResolver } from './claims-resolver';

/**
 * SESSION PROVIDER
 * 
 * Pengelola status sesi dan SecurityContext aktif.
 * Bertanggung jawab atas siklus hidup identitas pengguna dalam satu sesi aplikasi.
 */

class SessionProvider {
  private context: SecurityContext = EMPTY_SECURITY_CONTEXT;
  private listeners: Set<(context: SecurityContext) => void> = new Set();

  /**
   * Mendapatkan SecurityContext aktif saat ini.
   */
  getContext(): SecurityContext {
    return this.context;
  }

  /**
   * Berlangganan perubahan SecurityContext.
   */
  subscribe(listener: (context: SecurityContext) => void): () => void {
    this.listeners.add(listener);
    listener(this.context);
    return () => this.listeners.delete(listener);
  }

  /**
   * Inisialisasi sesi dari data user mentah.
   */
  async initialize(rawData: any): Promise<SecurityContext> {
    const user = ClaimsResolver.mapToCanonical(rawData);
    
    const newContext: SecurityContext = {
      user,
      tenant: {
        id: user.tenantId,
        status: user.status,
        settings: user.metadata?.settings || {},
      },
      organization: {
        id: user.organizationId,
        type: user.organizationType,
        name: user.profile.name,
      },
      permissions: new Set(user.permissions),
      scopes: new Set(user.scopes.map(s => s.id)),
      features: new Set(user.metadata?.features || []),
      policies: user.metadata?.policies || {},
      isAuthenticated: true,
      isReady: true,
    };

    this.context = newContext;
    this.notify();
    return this.context;
  }

  /**
   * Membersihkan sesi (logout).
   */
  clear(): void {
    this.context = EMPTY_SECURITY_CONTEXT;
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.context));
  }
}

export const sessionProvider = new SessionProvider();
