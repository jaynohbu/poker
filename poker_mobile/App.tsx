import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const WEB_URL = process.env.REACT_APP_WEB_URL || 'http://localhost:4200';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      // Handle messages from Angular app if needed
      switch (data.type) {
        case 'BRIDGE_READY':
          console.log('WebView bridge ready');
          break;
        case 'NAVIGATE':
          console.log('Navigate to:', data.path);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const injectedJavaScript = `
    (function() {
      // Expose native bridge to Angular app
      window.NativeBridge = {
        postMessage: (data) => {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      };
      
      // Signal that bridge is ready
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'BRIDGE_READY'
      }));
      
      console.log('Native bridge injected');
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onLoad={() => {
          console.log('WebView loaded');
          setIsLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        scalesPageToFit={true}
        decelerationRate="normal"
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={true}
        // Allow localhost for development
        ...(Platform.OS === 'android' && {
          androidHardwareAccelerationDisabled: false,
          mixedContentMode: 'compatibility',
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    flex: 1,
  },
});
