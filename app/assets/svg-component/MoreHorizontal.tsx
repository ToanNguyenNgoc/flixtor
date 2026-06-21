import * as React from "react";
import Svg, { Circle } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const MoreHorizontal = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Circle cx={12} cy={12} r={1.5} fill={props.color ?? '#374957'} /><Circle cx={19} cy={12} r={1.5} fill={props.color ?? '#374957'} /><Circle cx={5} cy={12} r={1.5} fill={props.color ?? '#374957'} /></Svg>;
export default MoreHorizontal;
