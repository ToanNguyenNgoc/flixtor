import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const Shuffle = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Path d="M16 3H21V8" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M4 20L21 3" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M21 16V21H16" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M15 15L21 21" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><Path d="M4 4L9 9" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export default Shuffle;
