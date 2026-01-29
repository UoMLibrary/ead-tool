import * as XLSX from 'xlsx';

export type RawRow = Record<string, string | number | null>;

export async function readExcel(file: File): Promise<RawRow[]> {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('No worksheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
        defval: null, // preserve empty cells
    });

    return rows;
}
