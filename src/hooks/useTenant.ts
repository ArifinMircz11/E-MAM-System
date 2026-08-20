import { create } from 'zustand';

export interface TenantData {
  identitas: {
    kodePos?: string;
    telepon?: string;
    namaMadrasah: string;
    email?: string;
    nsm?: string;
    motto?: string;
    npsn: string;
    kantor?: string;
    akreditasi?: string;
    website?: string;
    alamatLengkap?: string;
    alamat?: string; // Compatibility alias
    kementerian?: string;
  };
  konfigurasiSesi: {
    jadwal: {
      duha?: string;
      zuhur?: string;
      masuk: string;
      ashar?: string;
      pulang: string;
      jumat?: string; // Compatibility alias
    };
    hariLibur?: string[];
    toleransiKeterlambatan: number;
  };
  NPSN?: string;
  konfigurasiGeofence?: {
    gerbangUtama?: {
      lng?: number;
      radius?: number;
      lat?: number;
    };
    isGpsValidationActive?: boolean;
  };
  tenantId?: string;
  branding: {
    warnaTema?: string;
    warnaUtama?: string; // Compatibility alias
    warnaSekunder?: string; // Compatibility alias
    logoKopSuratUrl?: string;
    logoAppUrl: string;
    logoKemenagUrl?: string; // Compatibility alias
  };
  konfigurasiSistem: {
    semesterAktif: string;
    waGatewayToken?: string;
    timezone?: string;
    isMaintenance: boolean;
    tahunAjaranAktif: string;
    versiAplikasi?: string;
  };
  kepemimpinan?: {
    stempelUrl?: string;
    namaKepala?: string;
    ttdDigitalUrl?: string;
    nipKepala?: string;
  };
  aturanSanksiPoin?: {
    terlambat?: number;
    alpaSesi?: number;
    alpaTotal?: number;
    pulangCepat?: number;
    ambangBatasTeguran?: number;
  };
  metadata?: {
    diperbaruiPada?: string;
    dibuatPada?: string;
    berlakuHingga?: string;
    statusLangganan?: string;
  };
  ptsp?: {
    formatNomor?: string;
    ttdDigitalActive?: boolean;
    lastNomorSurat?: number;
    kodeSurat?: string;
  };
}

interface TenantStore {
  tenantData: TenantData | null;
  isLoading: boolean;
  setTenantData: (data: TenantData | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  tenantData: null,
  isLoading: true,
  setTenantData: (data) => set({ tenantData: data, isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

