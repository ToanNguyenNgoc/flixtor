/* eslint-disable react-native/no-inline-styles */
import React, { ReactNode } from 'react'
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import { SvgProps } from 'react-native-svg'
import { SvgIcons } from '@/assets/svg-component'
import { muiColor } from '@/themes'

type BaseIconProps = {
  badgeNumber?: number,
  badgeStyle?: StyleProp<ViewStyle>
  /**
   * The name of the icon
   */
  icon: keyof typeof SvgIcons

  /**
   * An optional tint color for the icon
   */
  color?: string

  /**
   * An optional size for the button icon. If not provided, the icon will be sized to the icon's resolution.
   */
  sizeButton?: number

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number | StyleProp<ViewStyle>

  /**
   * Style overrides for the icon image
   */
  style?: SvgProps['style']

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>;
  lottie?:ReactNode;
}

type PressableIconProps = Omit<TouchableOpacityProps, 'style'> & BaseIconProps
type IconProps = Omit<ViewProps, 'style'> & BaseIconProps

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity />
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {PressableIconProps} props - The props for the `PressableIcon` component.
 * @returns {JSX.Element} The rendered `PressableIcon` component.
 */
export function PressableIconSvg(props: PressableIconProps) {
  const {
    icon,
    color,
    sizeButton,
    size = 24,
    badgeNumber = 0, badgeStyle,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    lottie,
    ...pressableProps
  } = props

  const SVGComponent = SvgIcons[icon]

  return (
    <TouchableOpacity {...pressableProps} style={[
      { borderRadius: 1000, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', aspectRatio: 1 / 1, position: 'relative' },
      { width: sizeButton },
      $containerStyleOverride
    ]}>
      {
        badgeNumber > 0 &&
        <View style={[styles.badgeCnt, badgeStyle]}>
          <Text style={{fontSize: 12, color: muiColor.grey[0]}}>
            {badgeNumber > 10 ? '9+': badgeNumber}
          </Text>
        </View>
      }
      <View style={typeof size === 'number' ? { width: size, height: size } : size}>
        {
          lottie ?
            lottie
            :
            <SVGComponent width="100%" height="100%" color={color} style={$imageStyleOverride} />
        }
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  badgeCnt: {
    position: 'absolute',
    backgroundColor: muiColor.red[400],
    zIndex: 100,
    width: 24,
    aspectRatio: 1 / 1,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    right: -12,
    top: -12,
  }
})

/**
 * A component to render a registered icon.
 * It is wrapped in a <View />, use `PressableIcon` if you want to react to input
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Icon/}
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size = 24,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...viewProps
  } = props

  const SVGComponent = SvgIcons[icon]

  return (
    <View {...viewProps} style={$containerStyleOverride}>
      <View style={typeof size === 'number' ? { width: size, height: size } : size}>
        <SVGComponent width="100%" height="100%" color={color} style={$imageStyleOverride} />
      </View>
    </View>
  )
}
