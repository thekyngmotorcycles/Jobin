# Jobin phase 3 — work-only media and safety

## Implemented
The additive migration `20261031070000_work_media_safety.sql` adds immutable work-media identity and employment snapshots, professional-context checks, independent sanction counters, private evidence, adjudication, appeals and identity protection. It does not change JCard rendering, profession seals, employment-history rules or review APIs. It includes a variable-reference fix for profession selection during signup; that fix does not change the phase-2 seal rules.

Public Lives require acceptance of work rules, a registered personal profession or preapproved organization scope, valid activity context and current employer approval where an employer is claimed. Representation permission is required for a claimed employer's Live. A declared pending employment cannot be bypassed by selecting independent work. Actors in academy require confirmation from their selected preapproved school; graduated actors use the film-set context. Actors use their personal training identity. Artists must show their own performance; guards/vigiladores broadcast outside the venue. Interviews remain private. No one is required or rewarded by this change to go Live.

Videos upload to the existing private video-originals bucket and request server processing of a trim of at most 180 seconds. Client duration is not trusted for publication: the processor must return a measured immutable artifact, then the moderator must evaluate all five categories, then the video provider must acknowledge publication. None of these are simulated by the app.

## Real-provider integration
`server/moderation/contracts.ts` defines stream/video inputs and category/confidence outputs. `http-providers.ts` is a vendor-neutral HTTP adapter, not a detector. `worker.ts` runs on a trusted Node 22 host:
`node --experimental-strip-types server/moderation/worker.ts`

Configure server-only variables from `server/moderation/.env.example`. Never place service credentials, provider keys or webhook secrets in Expo public variables. The only public worker setting is EXPO_PUBLIC_SAFETY_API_URL, its HTTPS origin, for moderator previews. Allow web app origins explicitly through SAFETY_WEB_ORIGINS.

Required moderator endpoints:
- GET /health → ready, coverage of nudity/sexual_content/minors/blood/violence, liveMonitoring.
- POST /video/analyze → complete validated result or pending providerJobId.
- POST /live/watch → real watchId; send signed results continuously.
- Results: status=complete, UUID jobId, unique eventId, immutable assetId, exactly five coverage categories, findings [{category, confidence 0–1}], observedAt.

Required video endpoints:
- GET /health → ready, failClosedLeases.
- POST /video/prepare → measured durationMs (1–180000), immutable assetId and quarantined playbackUrl for the requested server-side trim.
- POST /video/publish and /video/disable → idempotent asset delivery/withdrawal.
- POST /live/prepare → staging-only publisherUrl, playbackUrl and assetId. The stream must start private.
- POST /live/lease → enable/renew public delivery only until expiresAt, never more than 15 unsupervised seconds.
- POST /live/stop → idempotent immediate cutoff.
- POST /media/review-url → authorized private evidence URL valid at most 120 seconds.

The real vendor bridge must enforce quarantine, artifact immutability, authenticated review links and lease expiry. Do not mark its health ready before those guarantees are implemented. No adapters or keys are preset.

## Callback and failure behavior
The worker accepts POST /moderation/webhook with x-jobin-timestamp (Unix seconds) and x-jobin-signature in the format sha256=<HMAC-SHA256 hex>. Sign the exact timestamp + '.' + raw JSON bytes. The signature comparison is constant-time; requests older than five minutes are rejected. The backend validates job/artifact correlation, category coverage, confidence and observation timestamps and deduplicates event IDs. An incident is counted once per media and counter.

Termination and withdrawal commands retry with bounded exponential backoff without an attempt cap; ordinary processing failures become visible as failed after eight attempts. A confirmed high-confidence finding blocks database playback immediately and creates a durable stop/disable command. The callback also attempts an immediate provider stop. A Live provider must close its stream by itself if the 15-second safety lease is not renewed, even if the worker dies. A lost heartbeat, missing category, unknown output, vendor failure or low-confidence finding never becomes a clean approval. Low-confidence findings hold the content for an independent moderator; they do not create an automatic strike. A moderator can confirm the violation or independently clear all five categories with a documented reason. A manual decision has its own immutable audit event and is never recorded as a fabricated vendor result. Cleared videos still await actual provider publication, and cleared Lives stay ended. Publication requires a separate durable provider acknowledgment. Quarantined artifacts are not publicly delivered before that step.

The Expo real-content player polls authoritative state every two seconds and releases its player on withdrawal. Demo previews remain explicitly demo previews and do not send reports or pretend to be moderation results.

## Sanctions
- Content counter: first confirmed incident restricts Live/video uploads for 30 days, second for six calendar months, third permanently blocks the account.
- Employer counter: a report alone has no sanction. The reporting organization must be platform-approved before a sanction can be upheld. An independent moderator must document evidence that a claimed affiliation was false at the media timestamp. An approval captured in the immutable snapshot prevents upholding that employer's allegation. Videos require a moderator-verified recording timestamp; approved historical employment covering that date also prevents an upheld report, even if the video was uploaded after the employee left. Absence of an app record alone is not proof of impersonation. Two confirmed incidents suspend the account for one calendar year and create a separate public professional trust mark.
- SQL guards enforce media restrictions on raw uploads and legacy video-project writes. Whole-account sanctions guard all business-table writes, including existing SECURITY DEFINER APIs. The account retains its explanation and owner-only appeal route.
- Appeals are owner-only, independently decided, documented and audited. Acceptance recalculates counters and time windows and revokes a no-longer-applicable permanent identity block; it never auto-republishes media.

Verified email/phone history is HMAC-hashed with a random DB-only key. Permanent content bans block those normalized identifiers at auth insert/update, not through spoofable profile metadata. Phone normalization uses E.164 digits, email normalization trims and case-folds. The history and blocklist store no raw contact details and have no client grants. New identities not known or verified by the service cannot be inferred by this mechanism.

## Roles and configuration still required
Assign actual moderation staff through trusted administration of the existing private.moderators table. Credential reviewers do not automatically become moderators. Moderators cannot decide their own cases, and account-suspended moderators cannot adjudicate new safety cases.
Deploy and configure the real video/moderation vendor bridge and the durable worker; verify actual detection coverage, continuous observations, webhook signing, quarantine and fail-closed stream termination. With configuration absent, Live requests are denied and uploaded videos stay private/pending. No actual detections or physical stream cutoff can occur without that external service.

The legal draft is docs/terms-and-conditions-draft.es.md and /terms. It cites the complete initial catalogue and is explicitly pending legal review. No legal approval is claimed.

## Testing
SQL authorization and sanction tests run only in CI's disposable PostgreSQL service. tests/media-safety.test.sql uses clearly named synthetic fixtures to test the real backend; those results are not a production detector and are never inserted in the hosted project. Node tests cover signed-webhook tampering/expiry, incomplete outputs, provider failures, duration checks and the legal catalogue.

Deployment: migration 20261031070000 applied to nwiimdmtddjquwxtjxmw. All new provider readiness flags remain false until the real services and worker are configured. No production detection fixtures or sanction incidents were inserted. Public SDK types were regenerated from the deployed schema; raw identity hashes and secrets are not exposed by the client schema.
