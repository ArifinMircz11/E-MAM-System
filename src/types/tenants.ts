import { z } from 'zod';
import { BaseEntitySchema } from './schemas';

export const TenantSchema = BaseEntitySchema.extend({
  id: z.string().optional(),
  name: z.string().min(1),
  npsn: z.string().min(1),
  nsm: z.string().optional(),
  alamat: z.string().optional(),
  provinsi: z.string().optional(),
  kabupaten: z.string().optional(),
  kecamatan: z.string().optional(),
  kodePos: z.string().optional(),
  email: z.string().email().optional(),
  telepon: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  status: z.enum(['Aktif', 'Nonaktif']).default('Aktif'),
  jenjang: z.enum(['RA', 'MI', 'MTs', 'MA']).optional(),
  tenantCode: z.string().min(1),
  slug: z.string().min(1),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const TenantConfigurationSchema = BaseEntitySchema.extend({
  id: z.string().optional(),
  tenantId: z.string().min(1),
  academicYearStart: z.string().min(1),
  semester: z.string().min(1),
  timezone: z.string().default('Asia/Makassar'),
  locale: z.string().default('id-ID'),
});

export type TenantConfiguration = z.infer<typeof TenantConfigurationSchema>;
