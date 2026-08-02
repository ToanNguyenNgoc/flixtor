/**
 * Legacy playback service placeholder.
 *
 * `react-native-track-player` is no longer part of the active app stack and
 * this service is not registered in `index.js`, so we keep a no-op export to
 * avoid stale imports breaking TypeScript during dependency upgrades.
 */
export default async function PlaybackService(): Promise<void> {
  return undefined;
}
