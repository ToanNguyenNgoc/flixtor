import React, { memo } from 'react';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import WebView from 'react-native-webview';
import { Colors } from '@/config/theme';

interface EmbedPlayerProps {
  uri: string;
}

function EmbedPlayer({ uri }: EmbedPlayerProps) {
  if (!uri) return null;

  // Wrap embed URL in minimal HTML so it renders properly
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
    iframe { width: 100vw; height: 100vh; border: none; }
  </style>
</head>
<body>
  <iframe src="${uri}" allowfullscreen frameborder="0"></iframe>
</body>
</html>`;

  return (
    <WebView
      style={styles.webview}
      source={{ html }}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}
      startInLoadingState
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: Colors.black },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.black },
});

export default memo(EmbedPlayer);
