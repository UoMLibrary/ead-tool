import type { ArchivalNode } from '$lib/model/archival';

/**
 * Build an EAD XML document from an ArchivalNode tree
 */
export function buildEadXml(root: ArchivalNode): XMLDocument {
    const doc = document.implementation.createDocument('', '', null);

    const ead = doc.createElement('ead');
    doc.appendChild(ead);

    const archdesc = el(doc, 'archdesc', { level: 'collection' });
    ead.appendChild(archdesc);

    const dsc = el(doc, 'dsc');
    archdesc.appendChild(dsc);

    const seriesC = buildComponent(doc, root);
    dsc.appendChild(seriesC);

    return doc;
}

function buildComponent(doc: XMLDocument, node: ArchivalNode): Element {
    const c = el(doc, 'c', { level: node.level });

    const did = el(doc, 'did');
    c.appendChild(did);

    appendText(did, 'unitid', node.id);
    appendText(did, 'unittitle', node.title);

    if (node.date) {
        const unitdate = el(doc, 'unitdate', {
            datechar: 'creation',
            era: 'ce',
            calendar: 'gregorian'
        });
        unitdate.textContent = node.date;
        did.appendChild(unitdate);
    }

    // physdesc (extent + condition)
    if (node.extent || node.condition) {
        const physdesc = el(doc, 'physdesc');

        if (node.extent) {
            appendText(physdesc, 'extent', node.extent);
        }

        if (node.condition) {
            const physfacet = appendText(physdesc, 'physfacet', node.condition);
            physfacet.setAttribute('label', 'Condition:');
        }

        did.appendChild(physdesc);
    }

    // ✅ NEW: language block
    if (node.language) {
        const langmaterial = el(doc, 'langmaterial');
        appendText(langmaterial, 'language', node.language);
        did.appendChild(langmaterial);
    }

    // scopecontent (outside <did>)
    if (node.scope?.length) {
        const scope = el(doc, 'scopecontent');
        for (const para of node.scope) {
            appendText(scope, 'p', para);
        }
        c.appendChild(scope);
    }

    // Recurse into children
    for (const child of node.children) {
        c.appendChild(buildComponent(doc, child));
    }

    return c;
}


function el(
    doc: XMLDocument,
    name: string,
    attrs?: Record<string, string>
): Element {
    const e = doc.createElement(name);
    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
            e.setAttribute(k, v);
        }
    }
    return e;
}

function appendText(parent: Element, name: string, text: string): Element {
    const el = parent.ownerDocument!.createElement(name);
    el.textContent = text;
    parent.appendChild(el);
    return el;
}

