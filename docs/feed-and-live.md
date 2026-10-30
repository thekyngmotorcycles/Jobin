# Feed and live discovery UI

The first tab is an edge-to-edge vertical video feed with Following / For You overlay navigation, search and inbox shortcuts, creator avatar/follow, like/comment/share/save actions, captions and animated audio metadata. Only the focused card plays. Creator follows, likes, comments, shares and saved posts are session demo state shared across screens. Repeating sample clips retain stable post IDs.

The second tab is Live. The old Meet People UI and its professional card component are removed. Legacy /connect links redirect to /streams. The hub has a live-avatar tray, Popular / Nearby / Games / Shop filters, a responsive staggered card grid, start-live promo, search, inbox and notifications. Cards open /stream/[id] rooms with a replay preview, local chat, share, demo gift reactions and floating hearts.

Existing light/dark/pink tokens are used for the hub, sheets and navigation. Feed/room chrome stays white over dark video for contrast. Ionicons fonts are preloaded at the root with explicit loading/error/retry UI. No native dependencies are added.

## Honest preview boundaries
Videos are Google sample clips; creator portraits and room cover images are Unsplash samples. Labels identify demo clips, sample engagement and recorded room previews. Viewer counts, existing discussion and rooms are examples. Sent comments and room messages stay within the local session. Sharing invokes the native user-controlled share sheet. Gift reactions do not charge money or credits.

No public broadcast, remote live chat, payment or real notification is fabricated. Live provider ingestion, room token authorization and a server-backed catalog are still separate integration work. The pre-existing /live preparation route remains available from the hub promo.

## Verification
CI runs lint, TypeScript, domain/social behavior tests, universal export and database checks. On devices, check video overlays and safe areas, all five tab icons, keyboard behavior in comment sheets and rooms, native sharing, audio toggles, Following filtering, search navigation, each theme and portrait/landscape paging. This is an OTA change for the existing SDK 54 build that already includes expo-font and @expo/vector-icons.
