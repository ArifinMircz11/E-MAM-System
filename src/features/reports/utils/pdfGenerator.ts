// src/features/reports/utils/pdfGenerator.ts

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

/**
 * Utility to generate PDF reports
 */
export const exportReportToPDF = async (data: any, fileName: string) => {
  try {
    const doc = new jsPDF({ format: 'legal' });
    // Add PDF generation logic here
    doc.save(`${fileName}.pdf`);
    toast.success('Laporan PDF berhasil dibuat!');
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Gagal mengekspor PDF.');
  }
};
