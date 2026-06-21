import * as React from "react";
import Svg, { Path, Circle } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const Music = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Path d="M9 18V5L21 3V16" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Circle cx={6} cy={18} r={3} stroke={props.color ?? '#374957'} strokeWidth={2} /><Circle cx={18} cy={16} r={3} stroke={props.color ?? '#374957'} strokeWidth={2} /></Svg>;
export default Music;
