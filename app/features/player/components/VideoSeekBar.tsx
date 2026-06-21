import { Platform } from 'react-native';

import AndroidVideoSeekBar from './VideoSeekBar.android';
import IOSVideoSeekBar from './VideoSeekBar.ios';

const VideoSeekBar = Platform.OS === 'ios' ? IOSVideoSeekBar : AndroidVideoSeekBar;

export { AndroidVideoSeekBar, IOSVideoSeekBar };
export { type VideoSeekBarProps } from './VideoSeekBar.types';

export default VideoSeekBar;
