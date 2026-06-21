import type { KKEpisode, KKEpisodeServer, VideoSource } from '@/types';

// ─── Flatten all episodes from all servers ─────────────────

export function getAllEpisodes(episodes?: KKEpisodeServer[]): KKEpisode[] {
  if (!Array.isArray(episodes)) return [];
  return episodes.flatMap(server =>
    Array.isArray(server.server_data)
      ? server.server_data.map(ep => ({ ...ep, server_name: server.server_name }))
      : [],
  );
}

// ─── Get current episode ───────────────────────────────────

export function getCurrentEpisode(
  episodes: KKEpisode[],
  episodeSlug?: string,
  serverName?: string
): KKEpisode | undefined {
  if (!episodes.length) return undefined;
  
  if (episodeSlug && serverName) {
    const ep = episodes.find(e => e.slug === episodeSlug && e.server_name === serverName);
    if (ep) return ep;
  }

  if (episodeSlug) {
    const ep = episodes.find(e => e.slug === episodeSlug);
    if (ep) return ep;
  }
  
  return episodes[0];
}

// ─── Get video source from episode ────────────────────────

export function getEpisodeSource(episode?: KKEpisode): VideoSource {
  if (!episode) return { type: 'none', uri: '' };

  if (episode.link_m3u8) {
    return {
      type: 'm3u8',
      uri: episode.link_m3u8,
    };
  }

  // Native app should prefer m3u8. Embed is fallback but usually cannot be played natively.
  if (episode.link_embed) {
    return { type: 'embed', uri: episode.link_embed };
  }

  return { type: 'none', uri: '' };
}

export function normalizeEpisodeSlug(
  episode?: KKEpisode,
  options?: {
    fallbackWhenMissing?: string | null;
    treatAsSingle?: boolean;
  },
): string | null | undefined {
  if (episode?.slug && episode.slug.trim().length > 0) {
    return episode.slug;
  }

  if (options?.treatAsSingle) {
    return options.fallbackWhenMissing ?? 'full';
  }

  return options?.fallbackWhenMissing;
}
