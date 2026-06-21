import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SkipBack = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Path d="M19 20L9 12L19 4V20Z" fill={props.color ?? '#374957'} /><Path d="M5 19V5" stroke={props.color ?? '#374957'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export default SkipBack;
