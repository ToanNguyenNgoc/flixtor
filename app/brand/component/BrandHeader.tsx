import { PressableIconSvg } from "@/components/common";
import { Colors, Spacing, Typography } from "@/config/theme";
import { muiColor } from "@/themes";
import { useNavigation } from "@react-navigation/native";
import React, { FC, ReactElement } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  title?: string;
  hasBack?: boolean;
  onBackPress?: () => void;
  rightElement?: ReactElement;
  styleContainer?: StyleProp<ViewStyle>;
  styleIcon?: StyleProp<ViewStyle>;
  colorIcon?: string;
}

export const BrandHeader: FC<Props> = (props) => {
  const navigate = useNavigation();
  const {
    title = "",
    hasBack = true,
    onBackPress = () => navigate.goBack(),
    rightElement = <View />,
    styleContainer,
    styleIcon,
    colorIcon = muiColor.grey[0],
  } = props;
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }, styleContainer]}>
      <View style={styles.body}>
        <View style={styles.titleCnt}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.titleCnt, styles.btnCnt]}>
          {
            hasBack ?
              <PressableIconSvg containerStyle={styleIcon} onPress={onBackPress} icon="CaretLeft" color={colorIcon} />
              :
              <View />
          }
          {rightElement}
        </View>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.primaryLight,
  },
  body: {
    height: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  titleCnt: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: muiColor.grey[0],
  },
  btnCnt: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    zIndex: 2,
  }
});