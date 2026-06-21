import * as React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const Search = (props: SvgProps) => <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}><Circle cx={11} cy={11} r={8} stroke={props.color ?? '#374957'} strokeWidth={2.5} /><Path d="M21 21L16.65 16.65" stroke={props.color ?? '#374957'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
export default Search;
