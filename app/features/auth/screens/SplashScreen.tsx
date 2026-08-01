import React from 'react';
import {
  Image,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import { image } from '@/assets/image';
import { Colors } from '@/config/theme';

interface SplashScreenProps {
  onLayout?: (event: LayoutChangeEvent) => void;
}

export default function SplashScreen({ onLayout }: SplashScreenProps) {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <Image
        source={image.BootSplash}
        resizeMode="cover"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.white,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});
