import React from 'react';
import type { LetterRequest, MadrasahData } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface LetterPreviewProps {
  letter: LetterRequest;
  madrasah: MadrasahData;
}

const LetterPreview: React.FC<LetterPreviewProps> = ({ letter, madrasah }) => {
  const today = format(new Date(), 'dd MMMM yyyy', { locale: id });
  const signedDate = letter.signedAt
    ? format(new Date(letter.signedAt), 'dd MMMM yyyy', { locale: id })
    : today;

  let formattedSubmissionTime = '-';
  if (letter.date) {
    try {
      formattedSubmissionTime =
        format(new Date(letter.date), 'd MMMM yyyy HH:mm', { locale: id }) + ' WIB';
    } catch (e) {
      formattedSubmissionTime = letter.date;
    }
  }

  return (
    <div className="bg-white text-black p-8 md:p-12 shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] font-serif leading-relaxed print:shadow-none print:p-0">
      {/* KOP SURAT */}
      <div className="flex items-center border-b-4 border-double border-black pb-4 mb-8">
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          {madrasah.logoSurat ? (
            <img
              src={madrasah.logoSurat}
              alt="Logo Madrasah"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
          )}
        </div>
        <div className="flex-1 text-center px-4">
          <h2 className="text-lg font-bold  leading-tight">Kementerian Agama Republik Indonesia</h2>
          <h1 className="text-xl font-bold uppercase leading-tight">{madrasah.nama}</h1>
          <p className="text-[10px] font-medium mt-1">
            {madrasah.alamat} <br />
            Telepon: {madrasah.telepon} | Email: {madrasah.email} <br />
            Website: {madrasah.website}
          </p>
        </div>
        <div className="w-24 h-24 shrink-0 flex items-center justify-center">
          {madrasah.logoLayanan && (
            <img
              src={madrasah.logoLayanan}
              alt="Logo Layanan"
              className="max-w-full max-h-full object-contain opacity-80"
            />
          )}
        </div>
      </div>

      {/* JUDUL SURAT */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold uppercase underline decoration-1 underline-offset-4">
          {letter.type}
        </h3>
        <p className="text-sm font-medium">Nomor: {letter.letterNumber || '.../.../.../...'}</p>
      </div>

      {/* ISI SURAT */}
      <div className="space-y-6 text-sm text-justify">
        <p>
          Yang bertanda tangan di bawah ini, Kepala {madrasah.nama}, dengan ini menerangkan bahwa:
        </p>

        <div className="ml-8 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <span className="font-medium">Nama Lengkap</span>
            <span className="col-span-2">
              : <span className="font-bold uppercase">{letter.userName}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="font-medium">Jabatan/Status</span>
            <span className="col-span-2">: {letter.userRole}</span>
          </div>
          {letter.className && (
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium">Kelas</span>
              <span className="col-span-2">: {letter.className}</span>
            </div>
          )}
          {letter.waliKelas && (
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium">Wali Kelas</span>
              <span className="col-span-2">: {letter.waliKelas}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <span className="font-medium">Waktu Pengiriman</span>
            <span className="col-span-2">: {formattedSubmissionTime}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <span className="font-medium">Keterangan</span>
            <span className="col-span-2">: {letter.description}</span>
          </div>
        </div>

        <p>
          Adalah benar-benar merupakan bagian dari civitas akademika {madrasah.nama} dan yang
          bersangkutan memiliki integritas serta berkelakuan baik selama berada di lingkungan
          madrasah.
        </p>

        <p>
          Demikian surat keterangan ini diberikan kepada yang bersangkutan untuk dapat dipergunakan
          sebagaimana mestinya.
        </p>
      </div>

      {/* TANDA TANGAN */}
      <div className="mt-16 flex justify-end">
        <div className="w-64 text-center">
          <p className="mb-1">Barabai, {signedDate}</p>
          <p className="font-bold mb-4">Kepala Madrasah,</p>

          <div className="flex justify-center mb-4">
            {letter.status === 'Signed' ? (
              <div className="relative p-2 border border-slate-200 rounded-lg">
                <QRCodeSVG value={`e-Mam System-VALID-${letter.digitalSignatureHash}`} size={100} />
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  SIGNED
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-300 italic text-[10px] border-2 border-dashed border-slate-100 rounded-xl px-4">
                Menunggu Tanda Tangan Digital
              </div>
            )}
          </div>

          <p className="font-bold underline decoration-1 underline-offset-2">
            {madrasah.kepalaNama}
          </p>
          <p className="text-xs">NIP. {madrasah.kepalaNip}</p>
        </div>
      </div>

      {/* FOOTER / WATERMARK */}
      <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-end opacity-30 grayscale">
        <div className="text-[8px] font-mono">
          Generated by e-Mam System <br />
          Hash: {letter.digitalSignatureHash || 'UNSIGNED-DRAFT'}
        </div>
        <div className="text-[8px] font-mono text-right">
          Halaman 1 dari 1 <br />
          {new Date().toISOString()}
        </div>
      </div>
    </div>
  );
};

export default LetterPreview;
