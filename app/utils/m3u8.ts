import type { DownloadQualityOption } from '@/types';

export type Quality = {
  label: string;
  uri: string;
  resolution?: number; // e.g. 1080, 720 for sorting
};

export interface HlsSegment {
  duration: number;
  uri: string;
  sequence: number;
}

export interface HlsMediaPlaylist {
  uri: string;
  targetDuration: number;
  mediaSequence: number;
  totalDuration: number;
  segments: HlsSegment[];
}

export interface HlsMasterPlaylist {
  hasProtectedContent: boolean;
  qualities: DownloadQualityOption[];
}

/**
 * Resolves a relative URL against a base URL.
 */
function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
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

function parseAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const raw = line.split(':')[1] ?? '';
  const matcher = /([A-Z0-9-]+)=((?:"[^"]*")|[^,]*)/gi;

  for (const match of raw.matchAll(matcher)) {
    const key = match[1];
    const value = match[2]?.replace(/^"|"$/g, '') ?? '';
    attributes[key] = value;
  }

  return attributes;
}

export async function fetchText(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch m3u8: ${response.status}`);
  }

  return response.text();
}

export function parseMasterPlaylist(text: string, baseUrl: string): HlsMasterPlaylist {
  const lines = text.split(/\r?\n/);
  const qualities: DownloadQualityOption[] = [];
  let hasProtectedContent = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    if (!line) continue;

    if (
      line.startsWith('#EXT-X-KEY:')
      || line.startsWith('#EXT-X-SESSION-KEY:')
      || line.includes('METHOD=SAMPLE-AES')
      || line.includes('KEYFORMAT=')
      || line.includes('URI="skd://')
    ) {
      hasProtectedContent = true;
    }

    if (!line.startsWith('#EXT-X-STREAM-INF:')) {
      continue;
    }

    const attributes = parseAttributes(line);
    const nextUri = lines
      .slice(index + 1)
      .map(item => item.trim())
      .find(item => item.length > 0 && !item.startsWith('#'));

    if (!nextUri) {
      continue;
    }

    const resolutionText = attributes.RESOLUTION?.split('x')[1];
    const resolution = resolutionText ? parseInt(resolutionText, 10) : undefined;
    const bandwidth = attributes.BANDWIDTH ? parseInt(attributes.BANDWIDTH, 10) : undefined;
    const label = resolution ? `${resolution}p` : bandwidth ? `${Math.round(bandwidth / 1000)}kbps` : 'Auto';

    qualities.push({
      label,
      uri: resolveUrl(nextUri, baseUrl),
      resolution,
      bandwidth,
    });
  }

  return { hasProtectedContent, qualities };
}

export function parseMediaPlaylist(text: string, baseUrl: string): HlsMediaPlaylist {
  const lines = text.split(/\r?\n/);
  const segments: HlsSegment[] = [];
  let targetDuration = 0;
  let mediaSequence = 0;
  let totalDuration = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';
    if (!line) continue;

    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = parseInt(line.split(':')[1] ?? '0', 10) || 0;
      continue;
    }

    if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      mediaSequence = parseInt(line.split(':')[1] ?? '0', 10) || 0;
      continue;
    }

    if (!line.startsWith('#EXTINF:')) {
      continue;
    }

    const duration = parseFloat(line.split(':')[1]?.split(',')[0] ?? '0') || 0;
    const uriLine = lines
      .slice(index + 1)
      .map(item => item.trim())
      .find(item => item.length > 0 && !item.startsWith('#'));

    if (!uriLine) {
      continue;
    }

    totalDuration += duration;
    segments.push({
      duration,
      uri: resolveUrl(uriLine, baseUrl),
      sequence: mediaSequence + segments.length,
    });
  }

  return {
    uri: baseUrl,
    targetDuration,
    mediaSequence,
    totalDuration,
    segments,
  };
}

export function buildOfflineManifest(
  playlist: HlsMediaPlaylist,
  fileNames: string[],
): string {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${Math.max(playlist.targetDuration, 1)}`,
    `#EXT-X-MEDIA-SEQUENCE:${playlist.mediaSequence}`,
  ];

  playlist.segments.forEach((segment, index) => {
    lines.push(`#EXTINF:${segment.duration.toFixed(3)},`);
    lines.push(fileNames[index] ?? `segment_${index}.ts`);
  });

  lines.push('#EXT-X-ENDLIST');
  return lines.join('\n');
}

export async function getHlsDownloadQualities(sourceUrl: string): Promise<DownloadQualityOption[]> {
  const sourceText = await fetchText(sourceUrl);
  const master = parseMasterPlaylist(sourceText, sourceUrl);

  if (master.qualities.length === 0) {
    return [{ label: 'Auto', uri: sourceUrl }];
  }

  const unique = master.qualities.filter((quality, index, list) => (
    list.findIndex(item => item.uri === quality.uri) === index
  ));

  unique.sort((left, right) => (right.resolution ?? 0) - (left.resolution ?? 0));

  return [
    { label: 'Auto', uri: sourceUrl },
    ...unique,
  ];
}

/**
 * Parses an m3u8 master playlist to extract video qualities (variants).
 * Returns a list of Quality objects including an 'Auto' option.
 */
export async function parseM3u8Qualities(originalUrl: string): Promise<Quality[]> {
  try {
    const text = await fetchText(originalUrl);
    const qualities = parseMasterPlaylist(text, originalUrl).qualities.map(quality => ({
      label: quality.label,
      uri: quality.uri,
      resolution: quality.resolution,
    }));

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
