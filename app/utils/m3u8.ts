export type Quality = {
  label: string;
  uri: string;
  resolution?: number; // e.g. 1080, 720 for sorting
};

/**
 * Resolves a relative URL against a base URL.
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (e) {
    // Fallback if URL constructor fails (e.g. invalid base)
    if (relativeUrl.startsWith('http')) return relativeUrl;
    if (relativeUrl.startsWith('/')) {
      const match = baseUrl.match(/^(https?:\/\/[^/]+)/);
      if (match) return match[1] + relativeUrl;
    }
    const lastSlashIdx = baseUrl.lastIndexOf('/');
    return baseUrl.substring(0, lastSlashIdx + 1) + relativeUrl;
  }
}

/**
 * Parses an m3u8 master playlist to extract video qualities (variants).
 * Returns a list of Quality objects including an 'Auto' option.
 */
export async function parseM3u8Qualities(originalUrl: string): Promise<Quality[]> {
  try {
    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch m3u8: ${response.status}`);
    }
    const text = await response.text();

    const qualities: Quality[] = [];
    const lines = text.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Find RESOLUTION=widthxheight
        const resMatch = line.match(/RESOLUTION=\d+x(\d+)/);
        let resolution = 0;
        let label = '';
        if (resMatch && resMatch[1]) {
          resolution = parseInt(resMatch[1], 10);
          label = `${resolution}p`;
        }

        // The next non-empty line should be the URI
        let uriLine = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() && !lines[j].startsWith('#')) {
            uriLine = lines[j].trim();
            break;
          }
        }

        if (uriLine) {
          const absoluteUri = resolveUrl(uriLine, originalUrl);
          // Avoid duplicates
          if (!qualities.some(q => q.label === label)) {
            qualities.push({
              label: label || 'Unknown',
              uri: absoluteUri,
              resolution,
            });
          }
        }
      }
    }

    if (qualities.length > 0) {
      // Sort from highest resolution to lowest
      qualities.sort((a, b) => (b.resolution || 0) - (a.resolution || 0));

      // Filter out invalid/unknown labels and ensure unique entries if resolution was 0 for multiple
      const validQualities = qualities.filter(q => q.label !== 'Unknown');

      if (validQualities.length > 0) {
        return [
          { label: 'Auto', uri: originalUrl },
          ...validQualities
        ];
      }
    }

    // If no variants found, it's either a media playlist or we failed to parse
    return [{ label: 'Auto', uri: originalUrl }];
  } catch (error) {
    console.warn('Error parsing M3U8 qualities:', error);
    return [{ label: 'Auto', uri: originalUrl }];
  }
}
