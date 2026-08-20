import type { AppEntity } from '@/domain/entities/base';

/**
 * EntityMapper handles transformations between Firestore DTOs and Dexie Entities.
 * This is where legacy field names (like studentsId) are mapped to
 * modern schema names (like studentId).
 */
export interface EntityMapper<T extends AppEntity = any, DTO = any> {
  toEntity(dto: DTO): T;
  toDTO(entity: T): DTO;
}

/**
 * Registry for entity mappers
 */
class MapperRegistry {
  private mappers: Map<string, EntityMapper> = new Map();

  register(entityName: string, mapper: EntityMapper) {
    this.mappers.set(entityName, mapper);
  }

  get<T extends AppEntity, DTO>(entityName: string): EntityMapper<T, DTO> {
    const mapper = this.mappers.get(entityName);
    if (!mapper) {
      // Default identity mapper if none registered
      return {
        toEntity: (dto: any) => dto as T,
        toDTO: (entity: T) => entity as any as DTO,
      };
    }
    return mapper;
  }
}

export const mapperRegistry = new MapperRegistry();

/**
 * Attendance Mapper: Handles legacy 'studentsId' and 'statusGlobal'
 */
mapperRegistry.register('attendance', {
  toEntity: (dto: any) => {
    const entity = { ...dto };
    entity.studentId = dto.studentId || dto.studentsId;
    entity.studentsId = dto.studentsId || dto.studentId;

    entity.namaLengkap = dto.namaLengkap || dto.studentName || dto.name;
    entity.studentName = dto.namaLengkap || dto.studentName || dto.name;
    entity.name = dto.namaLengkap || dto.studentName || dto.name;

    entity.tanggal = dto.tanggal || dto.date;
    entity.date = dto.tanggal || dto.date;

    entity.isHaid = dto.isHaid !== undefined ? dto.isHaid : dto.isHaidMode;
    entity.isHaidMode = dto.isHaid !== undefined ? dto.isHaid : dto.isHaidMode;

    const statusGlobal =
      dto.statusGlobal ||
      (dto.status === 'T'
        ? 'Terlambat'
        : dto.status === 'PC'
          ? 'PC'
          : dto.status === 'A'
            ? 'Alpha'
            : dto.status === 'I'
              ? 'Izin'
              : dto.status === 'S'
                ? 'Sakit'
                : dto.status || 'Hadir');
    entity.statusGlobal = statusGlobal;

    entity.status =
      dto.status ||
      (statusGlobal === 'Terlambat'
        ? 'T'
        : statusGlobal === 'Alpha'
          ? 'A'
          : statusGlobal === 'Izin'
            ? 'I'
            : statusGlobal === 'Sakit'
              ? 'S'
              : 'H');
    entity.statusKehadiran = dto.statusKehadiran || statusGlobal;

    entity.totalPoinHariIni =
      dto.totalPoinHariIni !== undefined
        ? Number(dto.totalPoinHariIni)
        : dto.totalPointsAdded !== undefined
          ? Number(dto.totalPointsAdded)
          : 0;
    entity.totalPointsAdded = entity.totalPoinHariIni;

    return entity;
  },
  toDTO: (entity: any) => {
    const dto = { ...entity };
    // Maintain backward compatibility for Firestore
    dto.studentsId = entity.studentsId || entity.studentId;
    if (entity.studentId) {
      dto.studentId = entity.studentId;
    }

    dto.namaLengkap = entity.namaLengkap || entity.studentName || entity.name;
    dto.studentName = entity.namaLengkap || entity.studentName || entity.name;
    dto.name = entity.namaLengkap || entity.studentName || entity.name;

    dto.tanggal = entity.tanggal || entity.date;
    dto.date = entity.tanggal || entity.date;

    dto.isHaid = entity.isHaid !== undefined ? entity.isHaid : entity.isHaidMode;
    dto.isHaidMode = entity.isHaid !== undefined ? entity.isHaid : entity.isHaidMode;

    // Ensure statusGlobal is set
    if (!dto.statusGlobal) {
      let statusVal = dto.status || 'Hadir';
      if (statusVal === 'T') statusVal = 'Terlambat';
      else if (statusVal === 'PC') statusVal = 'PC';
      else if (statusVal === 'A') statusVal = 'Alpha';
      else if (statusVal === 'I') statusVal = 'Izin';
      else if (statusVal === 'S') statusVal = 'Sakit';
      dto.statusGlobal = statusVal;
    }

    // Maintain status for client compatibility
    dto.status =
      entity.status ||
      (dto.statusGlobal === 'Terlambat'
        ? 'T'
        : dto.statusGlobal === 'Alpha'
          ? 'A'
          : dto.statusGlobal === 'Izin'
            ? 'I'
            : dto.statusGlobal === 'Sakit'
              ? 'S'
              : 'H');
    dto.statusKehadiran = entity.statusKehadiran || dto.statusGlobal;

    dto.totalPoinHariIni =
      entity.totalPoinHariIni !== undefined
        ? Number(entity.totalPoinHariIni)
        : entity.totalPointsAdded !== undefined
          ? Number(entity.totalPointsAdded)
          : 0;
    dto.totalPointsAdded = dto.totalPoinHariIni;

    return dto;
  },
});

/**
 * Student Mapper
 */
mapperRegistry.register('student', {
  toEntity: (dto: any) => {
    return {
      ...dto,
      studentId: dto.studentId || dto.studentsId || dto.id,
    };
  },
  toDTO: (entity: any) => {
    const dto = { ...entity };
    // Firestore legacy compatibility
    dto.studentsId = entity.studentId || entity.id;
    return dto;
  },
});

mapperRegistry.register('students', mapperRegistry.get('student'));

/**
 * Points / Poin Mapper
 */
mapperRegistry.register('points', {
  toEntity: (dto: any) => {
    const entity = { ...dto };
    entity.studentId = dto.studentId || dto.studentsId || dto.id;
    entity.studentsId = dto.studentsId || dto.studentId;
    entity.points = dto.points !== undefined ? dto.points : dto.skor;
    entity.skor = dto.skor !== undefined ? dto.skor : dto.points;
    return entity;
  },
  toDTO: (entity: any) => {
    const dto = { ...entity };
    dto.studentsId = entity.studentsId || entity.studentId;
    if (entity.studentId) {
      dto.studentId = entity.studentId;
    }
    dto.points =
      entity.points !== undefined
        ? Number(entity.points)
        : entity.skor !== undefined
          ? Number(entity.skor)
          : 0;
    dto.skor =
      entity.skor !== undefined
        ? Number(entity.skor)
        : entity.points !== undefined
          ? Number(entity.points)
          : 0;

    if (entity.kategori) {
      dto.type =
        entity.kategori === 'Pelanggaran' || entity.type === 'pelanggaran'
          ? 'pelanggaran'
          : 'prestasi';
    } else if (entity.type) {
      dto.type = String(entity.type).toLowerCase();
    } else {
      dto.type = 'pelanggaran';
    }
    return dto;
  },
});

mapperRegistry.register('poin', mapperRegistry.get('points'));
