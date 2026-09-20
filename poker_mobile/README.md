# poker_mobile - React Native WebView Wrapper

This is a **thin React Native wrapper** that embeds the Angular `poker_web` UI using WebView. It enables a single Angular codebase to deploy as both a web app and native iOS/Android applications.

## 🎯 Purpose

- **WebView-based hybrid**: Runs the same Angular UI inside a native app shell
- **Native iOS/Android builds**: Uses EAS (Expo Application Services) for native compilation—not Expo Go wrapper
- **Single codebase**: Same Angular UI works for web browser AND mobile app
- **Easy deployment**: Update the Angular app once, deploy everywhere

## 🏗️ Architecture

```
poker_mobile (React Native)
    ↓
WebView Component (App.tsx)
    ↓
Angular UI from poker_web (loaded via http://localhost:4200)
    ↓
NestJS Backend (WebSocket + REST)
```

### Key Files

- **App.tsx**: Main WebView component that loads the Angular app
- **index.js**: React Native entry point
- **app.json**: Native app metadata for iOS/Android
- **eas.json**: EAS Build configuration for native builds
- **.env.example**: Environment variables template

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Angular dev server in poker_web
cd ../poker_web
npm run start

# In another terminal, the WebView will automatically load http://localhost:4200
```

### Environment Variables

Create `.env` file:

```
REACT_APP_WEB_URL=http://localhost:4200      # Angular dev server
REACT_APP_API_URL=http://localhost:3000       # NestJS backend
REACT_APP_ML_URL=http://localhost:5000        # Python ML service
```

For production, replace with deployed URLs:

```
REACT_APP_WEB_URL=https://poker.example.com
REACT_APP_API_URL=https://api.poker.example.com
REACT_APP_ML_URL=https://ml.poker.example.com
```

## 📱 Native Builds

### Prerequisites

- **Node.js** 18+
- **EAS CLI**: `npm install -g eas-cli`
- **Xcode** (macOS) or **Android Studio** (for Android)
- **Apple Developer Account** (for iOS signing)

### iOS Build (Native)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS (one-time setup)
eas build --platform ios --local
# Follow prompts to link Apple Developer account

# Build locally for simulator/device
eas build --platform ios --local

# Output: .app or .ipa file ready for simulator/device
```

### Android Build (Native)

```bash
# Build for Android
eas build --platform android --local

# Output: .apk or .aab file
```

## 🔧 Configuration

### app.json

Defines native app metadata:

```json
{
  "expo": {
    "name": "PokerMate",
    "slug": "pokermateapp",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.pokermateapp.mobile"
    },
    "android": {
      "package": "com.pokermateapp.mobile"
    }
  }
}
```

### eas.json

Defines build profiles:

```json
{
  "build": {
    "development": { ... },
    "preview": { ... },
    "production": { ... }
  }
}
```

## 🌉 Native Bridge

The WebView injects a `window.NativeBridge` object for communication between React Native and Angular:

```typescript
// In Angular component
if (window.NativeBridge) {
  window.NativeBridge.postMessage({
    type: 'camera_request',
    data: { action: 'open' }
  });
}

// In React Native (App.tsx)
injectedJavaScript={`
  window.NativeBridge = {
    postMessage: (message) => {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  };
`}
```

## 📦 Dependencies

- **react-native**: 0.72.0 - Native app framework
- **react-native-webview**: 13.0.0 - WebView component
- **react-navigation**: Navigation between screens (if needed)

## 🐛 Troubleshooting

### WebView not loading Angular app

**Issue**: White screen or connection refused

```bash
# Ensure Angular dev server is running
cd ../poker_web
npm run start

# Check REACT_APP_WEB_URL in .env
# For local dev, use: http://localhost:4200 (or your machine IP for simulator)
```

### EAS build fails

```bash
# Clear cache
eas build --platform ios --local --clear-cache

# Check credentials
eas credentials
```

### Simulator/Device not connecting to backend

```bash
# Use machine IP instead of localhost for simulator
REACT_APP_API_URL=http://192.168.1.100:3000
```

## 📚 Related Documentation

- [Main README](../README.md) - Project overview
- [Architecture Documentation](../ARCHITECTURE.md) - System design
- [Angular UI (poker_web)](../poker_web/README.md) - Frontend UI
- [NestJS Backend](../poker_backend/README.md) - API server

## 🔐 Security Notes

- ⚠️ **HTTPS in production**: Never use `http://` for remote servers in production
- ⚠️ **API keys**: Store sensitive credentials in environment variables, not in code
- ⚠️ **CORS**: Backend must allow requests from WebView origin

## 📋 Development Workflow

1. **Update Angular UI** (`poker_web/`) → Changes instantly visible in WebView (live reload)
2. **Run backend** (`poker_backend/`) → WebView connects via WebSocket
3. **Test on simulator** → Full native experience
4. **Build for device** → `eas build` creates .ipa or .apk
5. **Deploy to App Store** → Use EAS Submit or manual provisioning

## 📞 Support

For WebView-specific issues, see:
- [react-native-webview docs](https://react-native-webview.com)
- [EAS Build documentation](https://docs.expo.dev/build/introduction/)
- [React Native docs](https://reactnative.dev)
