# Jobin — Android native capabilities baseline (Expo SDK 54)

## Audited existing dependencies
- Installed: expo-image-picker (camera/gallery), expo-media-library (photo gallery), expo-image-manipulator (image crops), expo-document-picker (system document picker), expo-video (playback), expo-updates (OTA), expo-dev-client.
- Missing: expo-notifications (remote push registration/handling), expo-camera (in-app camera / live preview), optional expo-file-system (file cache/upload lifecycle).
- No real live-stream transport SDK or native video editing/export SDK is installed.
- Existing notification screen is in-app only; it is not Android remote push delivery.
- Existing live screen requests supervised live and a provider URL; it is not a native broadcaster.
- Video upload/editing has a trim preview but no on-device rendered export.
- Moderation worker and professional policy exist; multimodal professional-relevance AI is not deployed.

## Decision: native dependencies
1. Add expo-notifications with Android channels, notification icon and explicit runtime opt-in. Register device tokens only after login and user consent. Never put provider server credentials in the client.
2. Add expo-camera for controlled camera recording and a future broadcaster preview. Ask permissions only when the camera/mic feature is used.
3. Keep expo-document-picker for Android Storage Access Framework; add expo-file-system only if concrete upload/caching needs require it. Avoid broad MANAGE_EXTERNAL_STORAGE.
4. Keep expo-video for playback. Prefer server-side video trim/transcoding, captions rendering and delivery; add an on-device encoder only if offline editing is a firm requirement.
5. For native live streaming, evaluate a compatible Expo SDK 54 WebRTC/RTMP provider SDK, Android foreground service behavior, permissions, moderation sampling and fail-closed stream termination before selecting/installing it. Do not imply that expo-camera alone provides live broadcast.

## Server-only integrations (do not need an APK)
- Public AI assistant: authenticated edge/backend proxy, per-user quotas, abuse prevention, scoped context, no service keys on device.
- Video moderation AI: server worker obtains private signed media; extracts frames, text and speech; combines multimodal professional relevance with existing safety rules. Keep uncertain/outage cases private/pending, allow appeal and retain audit trail.
- Push delivery: server-side notifications pipeline and secure token registry. Client needs native expo-notifications in its installed binary; notification content/rules can update OTA/backend.

## OTA / rebuild contract
- Native package addition, plugin/permission change, Android manifest change, or native SDK change => rebuild APK and verify EAS runtime fingerprint.
- JS/TS interface, API integration, moderation rules and server-side model changes => OTA/backend deployment only, provided native modules and runtime remain compatible.
- Do not ship a final baseline APK until native dependencies, provider choices and CI checks are validated.

## Acceptance checks
- Android 13+ notification permission and channel; foreground/background/tapped notification navigation; token refresh and logout cleanup.
- Camera photo/video recording and denied-permission behavior; gallery limited access.
- Document selection of PDF/image/video, content:// URI handling, size/type validation and safe upload.
- Video preview/trim request with server-side actual export and playback of processed asset.
- Live publish/stop, reconnection, background transitions, moderation-provider failure stopping stream.
- Public assistant privacy, rate limits, and safe error states.
- Moderation false-positive appeal, AI disclosure and educational-not-verified notice.
