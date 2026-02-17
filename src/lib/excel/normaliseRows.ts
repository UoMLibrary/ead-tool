import type { RawRow } from './excelReader';
import type { ArchivalNode, Level } from '$lib/model/archival';

interface NormalisedResult {
    series: ArchivalNode;
    nodes: ArchivalNode[];
    skippedRows: number;
}

function findColumn(
    columns: string[],
    matcher: (c: string) => boolean
): string {
    const col = columns.find(matcher);
    if (!col) {
        throw new Error('Required column not found');
    }
    return col;
}

function findOptionalColumn(
    columns: string[],
    keywords: string[]
): string | undefined {
    return columns.find(c =>
        keywords.some(k => c.toLowerCase().includes(k))
    );
}

function cleanText(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const s = String(value).trim();
    return s.length ? s : undefined;
}

function splitParagraphs(value: unknown): string[] | undefined {
    const text = cleanText(value);
    if (!text) return undefined;

    return text
        .split(/\r?\n\s*\r?\n/)
        .map(p => p.trim())
        .filter(Boolean);
}

function normaliseLevel(value: unknown): Level | null {
    if (value === null || value === undefined) return null;

    const level = String(value).trim().toLowerCase();
    if (!level) return null;

    if (
        level === 'fonds' ||
        level === 'subfonds' ||
        level === 'series' ||
        level === 'subseries' ||
        level === 'file' ||
        level === 'item'
    ) {
        return level as Level;
    }

    throw new Error(`Invalid <c level>: "${value}"`);
}

export function normaliseRows(rows: RawRow[]): NormalisedResult {
    if (!rows.length) {
        throw new Error('Excel file contains no rows');
    }

    let skippedRows = 0;

    const columns = Object.keys(rows[0]);

    // -----------------------------
    // Required columns
    // -----------------------------

    const levelCol = findColumn(columns, c =>
        c.toLowerCase().includes('<c level')
    );

    const unitidCol = findColumn(columns, c =>
        c.toLowerCase().includes('<unitid')
    );

    const titleCol = findColumn(columns, c =>
        c.toLowerCase().includes('<unittitle')
    );

    const dateCol = findColumn(columns, c =>
        c.toLowerCase().includes('<unitdate')
    );

    // -----------------------------
    // Optional columns (flexible detection)
    // -----------------------------

    const extentCol = findOptionalColumn(columns, ['<extent']);

    const scopeCol = findOptionalColumn(columns, ['<scopecontent']);

    const languageCol = findOptionalColumn(columns, [
        '<langmaterial',
        '<language',
        'language'
    ]);

    const conditionCol = findOptionalColumn(columns, [
        'physfacet',
        'condition'
    ]);

    // -----------------------------
    // Build nodes
    // -----------------------------

    const nodes: ArchivalNode[] = [];

    for (const row of rows) {
        const id = cleanText(row[unitidCol]);

        if (!id) {
            throw new Error('Row found with empty <unitid>');
        }

        const level = normaliseLevel(row[levelCol]);

        // Skip rows that are not descriptive units
        if (!level) {
            skippedRows++;
            continue;
        }

        const node: ArchivalNode = {
            id,
            level,
            title: cleanText(row[titleCol]) ?? '',
            date: cleanText(row[dateCol]),
            extent: extentCol ? cleanText(row[extentCol]) : undefined,
            condition: conditionCol
                ? cleanText(row[conditionCol])
                : undefined,
            language: languageCol
                ? cleanText(row[languageCol])
                : undefined,
            scope: scopeCol
                ? splitParagraphs(row[scopeCol])
                : undefined,
            children: []
        };

        nodes.push(node);
    }

    if (nodes.length === 0) {
        throw new Error('No descriptive rows found');
    }

    // -----------------------------
    // Root selection (no longer enforce single series)
    // -----------------------------

    const seriesNodes = nodes.filter(n => n.level === 'series');

    let primarySeries: ArchivalNode;

    if (seriesNodes.length > 0) {
        primarySeries = seriesNodes[0];
    } else {
        // Fallback if no series rows exist (e.g., fonds-level spreadsheet)
        primarySeries = nodes[0];
    }

    return {
        series: primarySeries,
        nodes,
        skippedRows
    };
}
