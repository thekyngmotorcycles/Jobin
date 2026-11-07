# Jobin professional-content moderation — integration plan

## Status
The policy and deterministic decision rules are implemented in `server/moderation/professional-policy.ts`, with tests. **An AI video analyzer is NOT connected or deployed.** Existing safety moderation in `server/moderation/` covers nudity, sexual content, minors, blood, violence; that is distinct from professional relevance. Do not represent a safety-only pass as professional approval.

## Policy
Accept actual work demonstrations, professional education (including silent videos with text overlays), professional services, workplace experiences and work-centered humor. Reject unrelated lifestyle, personal gym and entertainment videos regardless of the account's profession. A caption, hashtag or declared profession alone is never enough. Do not discriminate by identity or gender.

## Production architecture
1. Client uploads to private `video-originals` staging; do not display in any public feed yet.
2. Trusted Node worker obtains time-limited signed video access. Extract scene-distributed frames and scene-change frames; OCR on-screen text, transcribe speech if present. Videos with no speech are fully supported.
3. Send **actual frames, OCR, transcript and temporal context** to a multimodal model, with `JOBIN_RELEVANCE_POLICY` and a strict schema matching `ProfessionalEvidence`. Do not trust creator captions as evidence.
4. Run `decideProfessionalRelevance` server-side. Approve only if the video is professionally relevant with strong confidence and existing safety checks also pass. Otherwise queue human review or reject with explanation. Do not auto-reject uncertain clips.
5. Store a server-generated decision, model version, policy version, evidence references, and audit trail in protected tables; **only trusted service code** may write decisions. The database publish RPC must verify both a clean safety verdict AND professional approval. Never let a client set `published` or forge an approval.
6. Provide creator-facing reasons, human review and appeals. Feed queries must include only approved published videos; recommendation rank may consider relevance but cannot replace publish enforcement.
7. For live broadcasts, use separate ongoing relevance sampling and immediate stream controls; a one-time upload decision is insufficient.

## Deployment prerequisites
- Choose and provision a multimodal video-analysis provider, OCR/transcription and a processing host. Store API keys in server-only secrets, never Expo.
- Connect a real adapter to the existing moderation worker; define provider error handling and strict timeouts. Provider outage means pending review, never automatic approval.
- Add database migration, RLS and trusted publishing gates; deploy and verify in staging with test clips before production.
- Validate multilingual videos, text-only clips, mixed-content videos, false rejects and false approvals with a labeled evaluation set.
- Estimate per-minute video processing cost and set budgets/rate limits.

**Do not turn on automatic relevance approvals until these gates and a real provider are connected and tested.**

## Sustainable educational disclaimer (product decision)
Jobin **does not verify, certify, or hire professionals to review the technical correctness of educational videos**. Never expose a `verified` professional-review status or badge. Creators may publish educational videos without credentials, subject to general content safety and relevance checks.

Educational uploads may carry `disclosure.educationalDisclaimer: true`, displayed as the brief, subtle **“Contenido educativo no verificado”** notice. This is a disclaimer, **not** evidence that the content was reviewed, nor a guarantee of safety or accuracy. Show it consistently for educational content, not based on claimed credentials. AI-generated status is a separate disclosure.

At scale, prioritize automated relevance and safety checks, rate limits, duplicate detection, user reports and risk-based escalation; do not promise universal human review. Escalation for dangerous material is safety moderation, not professional certification. Keep processing budgets and model costs measurable.
