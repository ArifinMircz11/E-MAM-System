export interface SessionInfo {
  uid: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

class SessionManager {
  private session: SessionInfo | null = null;

  setSession(session: SessionInfo) {
    this.session = session;
  }

  clear() {
    this.session = null;
  }

  getSession(): SessionInfo | null {
    return this.session;
  }

  getTenantId(): string | null {
    return this.session?.tenantId ?? null;
  }

  getCurrentTenantId(): string | null {
    return this.session?.tenantId ?? null;
  }

  getUserId(): string | null {
    return this.session?.uid ?? null;
  }

  hasPermission(permission: string): boolean {
    return this.session?.permissions?.includes(permission) ?? false;
  }
}

export const sessionManager = new SessionManager();
