# Jobin

Universal Expo SDK 54 / React Native app for iOS, Android and web.

## Run
Node.js 22.13+:
```sh
npm install
npm start
npm run ios
npm run android
npm run web
```

## Product foundation
- Home opens directly into a vertical, paged video feed. Demo clips are clearly labeled and playback is limited to the focused card.
- Bottom bar: Home, Meet People, central upload button, Inbox, Mi perfil.
- Light, dark and pink palettes, saved on-device; italic serif display type with readable system body text.
- Video selection/recording, local trim preview and draft preparation; 180-second maximum.
- Personal/company signup and email login when Supabase is configured.
- Company document selection and verification/history screens.
- Profile review summary next to avatar, work history, activity/reward placeholders, settings and appearance.
- Public/private live preparation and inbox entry points.
- Services, communities and meeting cards remain accessible.

## What is live versus scaffolded
The home screen plays publicly hosted sample clips, not user uploads. The editor does not yet export/transcode/upload/publish. Document selection stays local. Lives do not broadcast. Profile edits, likes and social interactions are demo session state. Real account signup/login is available only after Supabase configuration. No real rating, verified badge, employment or reward is invented.

Supabase migration includes 43 tables, RLS, narrow RPCs, private evidence storage, immutable employment audit, verified-hirer reviews, disputes, matching and booking collision prevention. See docs/backend.md for boundaries and server work still required. The presence of a table does not mean its complete product workflow is implemented.

## Setup
- Expo cloud registration: docs/expo-setup.md.
- Supabase: docs/backend.md.
- Copy .env.example to .env and set only public Supabase client configuration.
- Private keys for payments, video and administrative decisions must remain server-side.

## Validate
```sh
npx expo install --check
npm run lint
npm run typecheck
npm test
npm run export
```

GitHub Actions also applies the SQL migration to PostgreSQL 17 and exercises authorization, evidence, immutable employment and video-duration rules. Native exports are bundles, not signed builds or device tests.

Test camera/media selection, audio, portrait/landscape paging, keyboard, screen-reader navigation and each theme on physical iOS/Android devices and web. The first npm install generates a lockfile that should be committed after resolution.

## Builds
```sh
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
npm run export:web
```
Preview iOS targets a simulator. Production requires EAS registration, signing and store developer accounts.

Video sample: Google's public gtv-videos-bucket/ForBiggerFun.mp4, used only to demonstrate playback.
