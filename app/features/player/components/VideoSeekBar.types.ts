import type { StyleProp, ViewStyle } from 'react-native';

export interface VideoSeekBarProps {
  duration: number;
  currentTime: number;
  bufferedTime?: number;
  disabled?: boolean;
  isDragging?: boolean;
  isSeeking?: boolean;
  targetSeekTime?: number | null;
  style?: StyleProp<ViewStyle>;
  onSeekStart: (time: number) => void;
  onSeekChange: (time: number) => void;
  onSeekComplete: (time: number) => void;
}
