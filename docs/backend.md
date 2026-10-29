# Jobin backend foundation

Migration: supabase/migrations/20261029190000_jobin_foundation.sql.

## Modules
43 tables cover personal/company profiles, private preferences, licenses, verification decisions, append-only employment events, editing projects/clips, processed videos, likes/saves/comments, public/private lives, participants, services, availability, bookings, contracts, payment accounts/events, reviews, photo evidence, disputes, connection modes and mutual matches, conversations/messages, notifications, guilds, daily activity, reward ledger, blocks/reports and calendar connections.

All public and private tables have RLS. Credentials and payment webhooks remain on the server. The client can update only its own permitted profile/preferences fields, send messages in authorized conversations, block/report and invoke narrow RPCs. Workflows without explicit policies are denied to client roles; this is intentional scaffolding, not a complete backend API.

## Accounts and verification
The auth trigger creates a profile and private preferences for each signup, and a company row for company accounts. account_type cannot be edited through the client. Switching types requires an audited migration/workflow.

jobin_request_verification and jobin_attach_company_document prepare a submission. Documents live in a private bucket and do not award a badge. A trusted human review process must check issuing authority, applicable municipal/state requirements, document validity, expiration and revocation before inserting a company_verifications row. No compliance is inferred from an upload. The public verified_companies view includes only unexpired, unrevoked verifications.

## Employment as a resume
A personal account claims employment and consents; only the matching verified company can approve it. Current and former workers are read through employment_records. company_workforce distinguishes current_people from verified_people_ever. Ending employment retains the original record. Triggers prevent deletes or rewriting approved facts and employment_events is append-only. Mistakes and fraud need correction events and moderation, not silent deletion. Account deletion is restricted by foreign keys: a retention, anonymization and legally required removal policy must be designed before launch.

## Reviews
Only the hirer in a completed booking/contract can submit one review through jobin_submit_review. Rating is 1–5; scores 1–3 require at least 40 characters and photo evidence. The media service must first inspect the actual upload and add an owned image to private.verified_uploads. File extensions and client metadata alone are not proof. Photos are private to the parties and moderators. The subject can open a dispute; a dispute does not erase a rating automatically. Only a trusted moderation workflow may resolve/remove it. Public profile_ratings includes published and disputed reviews until resolution.

## Video
Every account type may create work videos. Only server ingestion may publish a videos row; duration_ms must be 1–180000, ready state is explicit and provider asset IDs are unique. Validate the actual transcoded output, not client duration, and enforce the total composed timeline. Original files are private. The current mobile editor previews a trim; it does not yet transcode, upload or publish.

## Live and inbox
Private sessions require host/accepted participant authorization. A video-provider token endpoint must re-check membership before issuing short-lived room tokens; RLS does not secure a provider's public room URL. Conversation reads/writes require membership and are blocked after either account blocks the other. Membership and room invitations are server-controlled to prevent self-enrollment.

## Matching and rewards
jobin_express_interest requires independent opt-in for each mode, blocks self/blocked matches and requires adult personal accounts for dating. Reciprocal likes are serialized and only mutual interests create matches. Birth date self-entry is a foundation; appropriate age assurance is not implemented.

work_activity records one local date per profile and distinguishes self_reported from platform_verified evidence. reward_ledger is server-written, idempotent per activity. Daily usage can earn activity recognition but is never presented as employer-verified experience. Do not award duplicate points on retries or treat opening the app as proof of employment.

## Payments and scheduling
Confirmed/completed bookings exclude overlapping provider time ranges. Prices and completion states are server-controlled. Stripe event IDs are unique for idempotency; webhook signature validation and payout/refund state machines are still required. No escrow is implemented. OAuth secrets belong in a server vault, not calendar_connections.

## Apply and test
Create a dedicated Jobin Supabase project, then:
```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```
Never apply database-bootstrap.sql to a hosted database; it is a CI-only auth/storage fixture.

GitHub Actions runs the migration and transactional authorization tests on PostgreSQL 17. This checks SQL and role behavior but is not a full Supabase Auth/Storage end-to-end test.

Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the project settings. Never commit service-role keys or provider secrets.
