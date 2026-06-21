import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const Library = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Path d="M4 3H2V21H4V3Z" fill={props.color ?? '#374957'} /><Path d="M8 3H10V21H8V3Z" fill={props.color ?? '#374957'} /><Path d="M14 3H16V21H14V3Z" fill={props.color ?? '#374957'} /><Path d="M19.0566 3.28906L21.0566 20.9491L19.071 21.1891L17.071 3.52906L19.0566 3.28906Z" fill={props.color ?? '#374957'} /></Svg>;
export default Library;
