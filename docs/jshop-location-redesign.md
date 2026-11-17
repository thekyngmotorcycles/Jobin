# Buyer search location selector

The location screen is a mobile-first bottom sheet: search at top, map occupies remaining height, a single Apply button stays fixed at bottom.
A circle covers 70% of the smaller map dimension. Pan moves its center and reverse geocoding updates the search field after a short debounce. Pinch zoom changes real-world range without controls or a radius selector.
Supabase RPC jshop_listings_within_area accepts decimal miles 0.05 to 4000 and preserves the legacy RPC for old Android clients.
Seller location and published article coordinates do not change. No GPS permission required.
