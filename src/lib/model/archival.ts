export type Level = 'series' | 'file' | 'item';

export interface ArchivalNode {
    id: string;           // unitid
    level: Level;
    title: string;        // unittitle
    date?: string;        // unitdate
    extent?: string;      // extent
    scope?: string[];     // scopecontent paragraphs
    children: ArchivalNode[];
}
