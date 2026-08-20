import type { IRepository } from '../IRepository';
import type { SecurityContext } from '@/core/security/types';
import type { AppEntity } from '@/domain/entities/base';

export interface IClassEntity extends AppEntity {
  namaKelas: string;
  kodeKelas: string;
  tingkat: string;
  jurusan?: string;
  tahunAjaran: string;
  semester: string;
  waliKelasId?: string;
  jumlahSiswa: number;
  status: string;
}

export interface IClassRepository extends IRepository<IClassEntity> {
  findByTenant(context: SecurityContext, tenantId: string): Promise<IClassEntity[]>;
  findByKodeKelas(context: SecurityContext, tenantId: string, kodeKelas: string): Promise<IClassEntity | null>;
}
