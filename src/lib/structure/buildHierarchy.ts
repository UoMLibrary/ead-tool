import type { ArchivalNode } from '$lib/model/archival';

interface HierarchyResult {
    root: ArchivalNode;
    warnings: string[];
}

/**
 * Build Series → File → Item hierarchy from flat nodes
 */
export function buildHierarchy(
    series: ArchivalNode,
    nodes: ArchivalNode[]
): HierarchyResult {
    const nodeMap = new Map<string, ArchivalNode>();
    const warnings: string[] = [];

    for (const node of nodes) {
        nodeMap.set(node.id, {
            ...node,
            children: []
        });
    }

    const seriesNode = nodeMap.get(series.id);
    if (!seriesNode) {
        throw new Error('Series node not found during hierarchy build');
    }

    for (const node of nodeMap.values()) {
        if (node.id === series.id) continue;

        const parentId = getParentId(node.id);

        if (!parentId) {
            seriesNode.children.push(node);
            continue;
        }

        const parent = nodeMap.get(parentId);

        if (!parent) {
            // ✅ Graceful fallback
            warnings.push(
                `Missing parent "${parentId}" for "${node.id}". Attached to series.`
            );
            seriesNode.children.push(node);
            continue;
        }

        parent.children.push(node);
    }

    return {
        root: seriesNode,
        warnings
    };
}


/**
 * Extract parent unitid from a path
 * e.g. "PLP 1/1/3" → "PLP 1/1"
 */
function getParentId(unitid: string): string | null {
    const parts = unitid.split('/').map(p => p.trim());
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('/');
}
