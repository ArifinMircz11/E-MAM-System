/**
 * @license
 * e-Mam System - Excel Utility & Security Sanitizer
 * Dedicated secure Excel helper to replace vulnerable xlsx library.
 */

import ExcelJS from 'exceljs';
import { toast } from 'sonner';

export class ExcelSanitizer {
  /**
   * Sanitizes cell values to prevent Formula Injection / CSV Injection attacks.
   * Prepends a single quote to values starting with =, +, -, @, or tab characters.
   */
  static sanitizeValue(val: any): any {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (
        trimmed.startsWith('=') ||
        trimmed.startsWith('+') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('@') ||
        trimmed.startsWith('\t') ||
        trimmed.startsWith('\r')
      ) {
        // Safe escaping
        return `'${trimmed}`;
      }
      return trimmed;
    }
    return val;
  }

  /**
   * Scans a dataset for potential injection indicators or dangerous scripts.
   */
  static scanAndSanitizeRows(rows: Record<string, any>[]): Record<string, any>[] {
    let sanitizedCount = 0;
    const sanitized = rows.map((row) => {
      const cleanRow: Record<string, any> = {};
      for (const [key, val] of Object.entries(row)) {
        const cleanVal = this.sanitizeValue(val);
        if (cleanVal !== val) {
          sanitizedCount++;
        }
        cleanRow[key] = cleanVal;
      }
      return cleanRow;
    });

    if (sanitizedCount > 0) {
      console.warn(`[ExcelSanitizer] Escaped ${sanitizedCount} cell values to prevent formula injection.`);
    }
    return sanitized;
  }
}

/**
 * Reads an Excel file (.xlsx, .xls) from an ArrayBuffer and converts the first sheet to JSON.
 */
export async function readExcelToJSON<T = Record<string, any>>(arrayBuffer: ArrayBuffer): Promise<T[]> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Worksheet not found in the workbook.');
    }

    const rows: T[] = [];
    const headers: string[] = [];

    // Map headers from Row 1
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '').trim();
    });

    // Read remaining rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers row

      const rowData: Record<string, any> = {};
      let hasData = false;

      // Note: exceljs columns are 1-indexed
      for (let i = 1; i < headers.length; i++) {
        const cell = row.getCell(i);
        let val = cell.value;

        // Extract raw text or formula result if applicable
        if (val && typeof val === 'object') {
          if ('result' in val) {
            val = (val as any).result;
          } else if ('text' in val) {
            val = (val as any).text;
          } else if ('richText' in val) {
            val = (val as any).richText.map((rt: any) => rt.text || '').join('');
          } else {
            val = String(val);
          }
        }

        const header = headers[i];
        if (header) {
          rowData[header] = val ?? '';
          if (val !== null && val !== undefined && val !== '') {
            hasData = true;
          }
        }
      }

      if (hasData) {
        rows.push(rowData as T);
      }
    });

    // Apply security sanitizer sanitizing formula injections
    return ExcelSanitizer.scanAndSanitizeRows(rows as any) as T[];
  } catch (error) {
    console.error('[ExcelHelper] Error parsing Excel file:', error);
    toast.error('Gagal membaca file Excel. Pastikan file tidak terkunci atau rusak.');
    throw error;
  }
}

/**
 * Writes a JSON array of objects to an Excel file (.xlsx) and triggers a browser download.
 */
export async function writeJSONToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName = 'Sheet1'
): Promise<void> {
  try {
    if (data.length === 0) {
      throw new Error('No data available for export');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Dynamic headers based on keys of the first item
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.max(header.length + 4, 12),
    }));

    // Add rows
    worksheet.addRows(data);

    // Style the header row for elegant display
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Inter', bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' }, // Slate 900
    };

    // Auto-fit columns
    worksheet.columns.forEach((col) => {
      let maxLen = col.header?.length || 10;
      col.values?.forEach((val) => {
        if (val) {
          const strLen = String(val).length;
          if (strLen > maxLen) maxLen = strLen;
        }
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Ekspor data berhasil diunduh!');
  } catch (error) {
    console.error('[ExcelHelper] Error exporting to Excel:', error);
    toast.error('Gagal mengekspor data ke Excel.');
    throw error;
  }
}
