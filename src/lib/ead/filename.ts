export function makeEadFilename(seriesId: string): string {
    return (
        seriesId
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w\-]/g, '') +
        '.xml'
    );
}
