/**
 * @license
 * e-Mam System - Enterprise Export Service
 * LAYER: SERVICE (Architecture Compliant)
 */

import { format } from 'date-fns';
import { toast } from 'sonner';

export class ExportService {
  /**
   * Exports data to CSV format (Excel compatible).
   */
  static async exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
    const toastId = toast.loading('Mempersiapkan file Excel (CSV)...');
    try {
      if (!data || data.length === 0) {
        throw new Error('Tidak ada data untuk diexport');
      }

      const keys = Object.keys(data[0]);
      const csvRows = [
        keys.join(','),
        ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('File berhasil diunduh', { id: toastId });
    } catch (error: any) {
      console.error('[ExportService] Export Failed:', error);
      toast.error(`Gagal membuat file: ${error.message}`, { id: toastId });
    }
  }

  /**
   * Exports attendance data to PDF format.
   * Dynamic import of jsPDF to keep bundle small.
   */
  static async exportAttendanceToPdf(
    data: any[], 
    title: string, 
    columns: { header: string; dataKey: string }[],
    fileName: string
  ) {
    const toastId = toast.loading('Mempersiapkan dokumen PDF...');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('e-MAM SYSTEM', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(title, 14, 30);
      doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, 36);

      // Table
      autoTable(doc, {
        startY: 45,
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(c => row[c.dataKey] || '-')),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF berhasil diunduh', { id: toastId });
    } catch (error: any) {
      console.error('[ExportService] PDF Export Failed:', error);
      toast.error(`Gagal membuat PDF: ${error.message}`, { id: toastId });
    }
  }
}
