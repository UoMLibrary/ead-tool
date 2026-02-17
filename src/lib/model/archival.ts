export type Level =
    | 'fonds'
    | 'subfonds'
    | 'series'
    | 'subseries'
    | 'file'
    | 'item';

export interface ArchivalNode {
    id: string;
    level: Level;
    title: string;
    date?: string;
    extent?: string;
    condition?: string;  // NEW
    language?: string;   // NEW
    scope?: string[];
    children: ArchivalNode[];
}
