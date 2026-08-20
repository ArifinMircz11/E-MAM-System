export class SessionService {
  isDeveloperSessionActive(): boolean {
    return true;
  }

  getCurrentSessionTenant(): string {
    return '30315537';
  }
}

export const sessionService = new SessionService();
