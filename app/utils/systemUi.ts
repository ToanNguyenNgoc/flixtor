import { NativeModules, Platform } from 'react-native';

interface SystemUiNativeModule {
  enterImmersive?: () => void;
  exitImmersive?: () => void;
  setGestureExclusionRect?: (xDp: number, yDp: number, widthDp: number, heightDp: number) => void;
  clearGestureExclusionRects?: () => void;
}

const systemUiModule = NativeModules.SystemUiModule as SystemUiNativeModule | undefined;

export function enterImmersiveVideoMode() {
  if (Platform.OS !== 'android') {
    return;
  }

  systemUiModule?.enterImmersive?.();
}

export function exitImmersiveVideoMode() {
  if (Platform.OS !== 'android') {
    return;
  }

  systemUiModule?.exitImmersive?.();
}

export function setAndroidGestureExclusionRect(
  xDp: number,
  yDp: number,
  widthDp: number,
  heightDp: number,
) {
  if (Platform.OS !== 'android') {
    return;
  }

  systemUiModule?.setGestureExclusionRect?.(xDp, yDp, widthDp, heightDp);
}

export function clearAndroidGestureExclusionRects() {
  if (Platform.OS !== 'android') {
    return;
  }

  systemUiModule?.clearGestureExclusionRects?.();
}
