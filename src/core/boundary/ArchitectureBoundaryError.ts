/**
 * Canonical Architecture Boundary Error
 * Digunakan sebagai Single Source of Truth untuk semua kegagalan boundary penegakan arsitektur.
 */

export type ArchitectureBoundaryType =
  | 'identity'
  | 'user_contract'
  | 'tenant'
  | 'rbac'
  | 'security_context'
  | 'navigation'
  | 'dashboard'
  | 'repository'
  | 'ui'
  | 'sync_queue'
  | 'sync_engine';

export class ArchitectureBoundaryError extends Error {
  readonly boundary: ArchitectureBoundaryType;
  readonly code: string;
  readonly details?: any;
  readonly timestamp: number;

  constructor(
    boundary: ArchitectureBoundaryType,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ArchitectureBoundaryError';
    this.boundary = boundary;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, ArchitectureBoundaryError.prototype);
  }

  /**
   * Sanitized error representation for safe UI rendering.
   * Internal identifiers, tenant keys, and sensitive tokens are stripped.
   */
  toSafeUserMessage(): string {
    switch (this.boundary) {
      case 'identity':
        return 'Sesi identitas akun tidak valid. Silakan masuk kembali.';
      case 'user_contract':
        return 'Data profil akun tidak memenuhi standar kontrak keamanan sistem.';
      case 'tenant':
        return 'Akses ditolak: Anda tidak memiliki wewenang pada madrasah / instansi ini.';
      case 'rbac':
        return 'Hak akses tidak mencukupi untuk melakukan tindakan ini.';
      case 'security_context':
        return 'Terjadi kesalahan pada konteks keamanan akun.';
      case 'navigation':
        return 'Halaman atau menu tidak sesuai dengan hak akses peran Anda.';
      case 'dashboard':
        return 'Tampilan panel tidak sesuai dengan peran akun Anda.';
      case 'repository':
        return 'Operasi data lokal ditolak karena konteks keamanan tidak lengkap.';
      case 'ui':
        return 'Fitur ini tidak tersedia untuk tingkat wewenang akun Anda.';
      case 'sync_queue':
        return 'Antrean sinkronisasi menolak data yang tidak memenuhi batas arsitektur keamanan.';
      case 'sync_engine':
        return 'Mesin sinkronisasi mendeteksi ketidaksesuaian konteks tenant atau versi data.';
      default:
        return 'Terjadi kesalahan pada konteks keamanan akun.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      boundary: this.boundary,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}
