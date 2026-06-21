import React, { FC } from "react";
import { Text, View } from "react-native";
import { BrandHeader } from "../component";
import { PressableIconSvg } from "@/components/common";
import { muiColor } from "@/themes";
import { Colors, Spacing } from "@/config/theme";

export const BrandHomeScreen: FC = () => {
  return (
    <View>
      <BrandHeader
        hasBack={false}
        rightElement={
          <PressableIconSvg
            containerStyle={{ backgroundColor: Colors.backgroundOverlayLight, padding: Spacing.sm }}
            icon="User2" color={muiColor.grey[0]}
            size={20}
          />
        }
        styleContainer={{ backgroundColor: Colors.backgroundTransparent }}
        colorIcon={muiColor.grey[700]}
      />
      <Text>
        BrandHomeScreen
      </Text>
    </View>
  )
}
