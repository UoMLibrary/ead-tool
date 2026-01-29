import type { ArchivalNode } from '$lib/model/archival';

/**
 * Build flat Series → Item structure
 */
export function buildFlat(
    series: ArchivalNode,
    nodes: ArchivalNode[]
): ArchivalNode {
    // Clone the series to avoid mutation
    const root: ArchivalNode = {
        ...series,
        children: []
    };

    const items = nodes
        .filter(n => n.id !== series.id)
        .map(n => ({
            ...n,
            level: 'item' as const,
            children: []
        }))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    root.children = items;
    return root;
}
