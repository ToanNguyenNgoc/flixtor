/**
 * PlaybackService — registered with react-native-track-player to handle
 * remote control events (from notification, lock screen, Bluetooth, etc.)
 *
 * This file MUST be registered in index.js via:
 *   TrackPlayer.registerPlaybackService(() => require('./service'))
 *
 * NOTE: This uses CommonJS module.exports because react-native-track-player
 * requires it. The file is registered before the React app boots.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
import TrackPlayer, { Event } from 'react-native-track-player';

export default async function PlaybackService() {
  // Remote play
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  // Remote pause
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  // Remote stop
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.stop();
  });

  // Remote next
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  // Remote previous
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  // Remote seek
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => {
    TrackPlayer.seekTo(position);
  });

  // Duck audio when another app interrupts (calls, notifications)
  TrackPlayer.addEventListener(Event.RemoteDuck, async ({ paused, permanent }) => {
    if (permanent) {
      await TrackPlayer.stop();
    } else if (paused) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  });
}
