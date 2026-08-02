import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage, { type FastImageProps } from 'react-native-fast-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { muiColor } from '@/themes';
import { getOriginalImageUrlFromProxy } from '@/utils/image';

const FALLBACK_URL = 'https://via.placeholder.com/200x300/141414/ffffff?text=No+Image';

interface CachedImageProps extends FastImageProps {
  /** Should show a fading skeleton while loading? (Default: true) */
  showSkeleton?: boolean;
  /** Image URL to fall back to if the original fails to load */
  fallbackUrl?: string;
}

function getSourceUri(source?: FastImageProps['source']): string | null {
  if (!source || typeof source === 'number' || !('uri' in source)) {
    return null;
  }

  return typeof source.uri === 'string' ? source.uri : null;
}

function shouldUseNativeFallback(uri?: string | null): boolean {
  if (!uri) {
    return false;
  }

  return /\.webp($|\?)/i.test(uri.trim());
}

/**
 * A wrapper around FastImage that provides:
 * 1. An animated skeleton placeholder while the image loads.
 * 2. Automatic fallback to a placeholder image if the URL fails.
 */
export const CachedImage = React.memo(({
  source,
  style,
  showSkeleton = true,
  fallbackUrl = FALLBACK_URL,
  onLoadStart,
  onLoad,
  onError,
  ...rest
}: CachedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useOriginalSource, setUseOriginalSource] = useState(false);
  const [useNativeImageFallback, setUseNativeImageFallback] = useState(false);

  const sourceKey = useMemo(() => {
    if (typeof source === 'number') {
      return `local:${source}`;
    }

    if (source && 'uri' in source) {
      return source.uri ?? fallbackUrl;
    }

    return fallbackUrl;
  }, [source, fallbackUrl]);

  const originalSource = useMemo(() => {
    if (typeof source === 'number') {
      return null;
    }

    if (source && 'uri' in source && source.uri) {
      const originalUri = getOriginalImageUrlFromProxy(source.uri);

      if (!originalUri || originalUri === source.uri) {
        return null;
      }

      return {
        ...source,
        uri: originalUri,
        cache: source.cache ?? FastImage.cacheControl.immutable,
        priority: source.priority ?? FastImage.priority.normal,
      };
    }

    return null;
  }, [source]);

  const targetSource = useMemo(() => {
    if (hasError) return { uri: fallbackUrl };
    if (useOriginalSource && originalSource) return originalSource;
    if (typeof source === 'number') return source; // local require
    if (source && 'uri' in source && source.uri) {
      return {
        ...source,
        cache: source.cache ?? FastImage.cacheControl.immutable,
        priority: source.priority ?? FastImage.priority.normal,
      };
    }
    // Invalid source or empty uri string
    return { uri: fallbackUrl };
  }, [fallbackUrl, hasError, originalSource, source, useOriginalSource]);

  const targetUri = useMemo(() => getSourceUri(targetSource), [targetSource]);
  const shouldUseNativeImageFromSource = useMemo(
    () => shouldUseNativeFallback(getSourceUri(source)),
    [source],
  );
  const shouldUseFastImageFallback = useMemo(() => {
    if (typeof targetSource === 'number') {
      return false;
    }

    return useNativeImageFallback || shouldUseNativeFallback(targetUri);
  }, [targetSource, targetUri, useNativeImageFallback]);

  useEffect(() => {
    setHasError(false);
    setUseOriginalSource(false);
    setIsLoading(true);
    setUseNativeImageFallback(shouldUseNativeImageFromSource);
  }, [shouldUseNativeImageFromSource, sourceKey]);

  const targetSourceKey = `${sourceKey}:${useOriginalSource ? 'original' : hasError ? 'fallback' : 'primary'}`;

  return (
    <View style={[styles.container, style]}>
      <FastImage
        key={targetSourceKey}
        source={targetSource}
        fallback={shouldUseFastImageFallback}
        style={StyleSheet.absoluteFill}
        onLoadStart={() => {
          setIsLoading(true);
          onLoadStart?.();
        }}
        onLoad={(e) => {
          setIsLoading(false);
          onLoad?.(e);
        }}
        onError={() => {
          if (!useNativeImageFallback && typeof targetSource !== 'number') {
            setUseNativeImageFallback(true);
            return;
          }

          if (!useOriginalSource && originalSource) {
            setUseNativeImageFallback(shouldUseNativeFallback(originalSource.uri));
            setUseOriginalSource(true);
            return;
          }

          if (!hasError) {
            setUseNativeImageFallback(shouldUseNativeFallback(fallbackUrl));
            setHasError(true);
            return;
          }

          setIsLoading(false);
          onError?.();
        }}
        {...rest}
      />
      {isLoading && showSkeleton && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.skeleton}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: muiColor.grey[900], // Fallback subtle background
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: muiColor.grey[800],
  },
});
