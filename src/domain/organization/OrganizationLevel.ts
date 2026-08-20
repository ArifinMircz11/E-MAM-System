export enum OrganizationLevelValue {
  DEVELOPER = 0,
  KANWIL = 1,
  KEMENAG = 2,
  MADRASAH = 3,
}

export interface OrganizationLevelInfo {
  level: OrganizationLevelValue;
  name: string;
  code: string;
  description: string;
}

export const ORGANIZATION_LEVELS: Record<OrganizationLevelValue, OrganizationLevelInfo> = {
  [OrganizationLevelValue.DEVELOPER]: {
    level: OrganizationLevelValue.DEVELOPER,
    name: 'Developer (Platform Owner)',
    code: 'DEVELOPER',
    description: 'System Platform Owner & Enterprise Administrator',
  },
  [OrganizationLevelValue.KANWIL]: {
    level: OrganizationLevelValue.KANWIL,
    name: 'Kanwil Kementerian Agama Provinsi',
    code: 'KANWIL',
    description: 'Regional Office of Ministry of Religious Affairs (Province Level)',
  },
  [OrganizationLevelValue.KEMENAG]: {
    level: OrganizationLevelValue.KEMENAG,
    name: 'Kantor Kementerian Agama Kabupaten/Kota',
    code: 'KEMENAG',
    description: 'District Office of Ministry of Religious Affairs (Regency/City Level)',
  },
  [OrganizationLevelValue.MADRASAH]: {
    level: OrganizationLevelValue.MADRASAH,
    name: 'Madrasah',
    code: 'MADRASAH',
    description: 'Madrasah Educational Institution',
  },
};
