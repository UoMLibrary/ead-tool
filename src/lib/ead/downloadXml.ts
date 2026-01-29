/**
 * Serialize an XMLDocument and trigger a download
 */
export function downloadXml(
    xml: XMLDocument,
    filename: string
) {
    const serializer = new XMLSerializer();
    const xmlString =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        serializer.serializeToString(xml);

    const blob = new Blob([xmlString], {
        type: 'application/xml'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
