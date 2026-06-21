import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const Clock = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Circle cx={12} cy={12} r={10} stroke={props.color ?? '#374957'} strokeWidth={2} /><Path d="M12 6V12L16 14" stroke={props.color ?? '#374957'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export default Clock;
