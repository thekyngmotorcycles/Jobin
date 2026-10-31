# JCard verification — phase 2

## Scope
The profile JCard now reads the authenticated Supabase identity and public ratings/approved employment data. It has no demo fallback. Its existing layout and finishes remain. The old profile employment-history UI and review APIs are unchanged. Lives, moderation and strikes are not implemented or modified.

## Data and authority
- One shared server-configured catalogue: 13 sectors and 114 professional trades, including the four engineering specializations. Catalogue writes require a trusted service/admin; personal clients cannot add arbitrary professions.
- `jcard_profiles`: case-insensitive unique handle, availability, and at most 20 unique languages with integer fluency 0–100. Legal display name and location are saved on the existing profile.
- `person_professions`: per-profession in_academy/graduado, primary profession and optional requested education institution. A change of training or school invalidates its old confirmation.
- `profession_seals`: certificate, company or institution origin; verified/unverified; issuer, evidence and dates. Ranges count toward the same ten verified seals, not an extra quota.
- Verified school enrollment is distinct from a license to practice: it produces a training check, not an automatic license.
- Approved personal document seals persist after employment ends.
- Company-origin seals require an approved, consenting current employment, a selected profession and a matching platform-preapproved organization scope. Derivative triggers never rewrite employment/audit records. On leaving, the company badge is revoked and an immutable exclusion prevents reclaiming the same profession through rehiring; a new personal certificate submitted after leaving can restore that seal. An older pending request cannot be reused to restore it.
- When all ten verified slots are occupied, company automation does not break employment approval. Eligible professions remain unverified/queued by capacity; synchronization re-evaluates them when employment or scope changes or the person edits a profession.
- All issuers use the same per-person row lock and seal-capacity trigger. Direct client writes are denied, even for credential reviewers.

## Organization profiles
Organizations extend existing company accounts, with company/education/government kind. The kind is not proof of authority. A dedicated documentary review preapproves specific professional scopes. Only an authorized matching school can confirm its requested students. Only a preapproved government organization with a police/military scope can define and grant its own ranks to consenting, approved current employees. Promotions replace the previous rank from that institution.
Current and former approved employees are read from the existing immutable employment records. No delete controls or replacement history APIs are added. Employment approval continues to use the existing verified-company employment API. The representation permission added here is data only; it is not connected to any live workflow.

## Documents and review
Documents use the private `professional-certificates` bucket: PDF/JPEG/PNG, maximum 10 MB enforced by Supabase Storage. Clients can upload in their own directory and cannot replace/delete uploaded files. Signed preview links last 120 seconds and require owner or credential reviewer access.
The reviewer queue is filtered on the server and bounded to 200 requests per state, in arrival order. Request state transitions are pending → approved/rejected; decisions require a reason, cannot be repeated and cannot be made on the reviewer's own request. No OCR or automated authenticity claim is made. The reviewer must actually validate the document, issuing authority and organization type/scope.

Provisioning reviewers is intentionally privileged: add the real reviewer's auth UUID to `private.credential_reviewers` using a trusted database administration session. There is no public self-assignment route. This role does not grant moderation or strike powers.

## Local professional opportunities
Students and companies search by active profession and case-insensitive city. Companies can discover academy students (confirmed or unconfirmed); students can find companies with a matching preapproved scope. Invitations/applications require compatible identities, matching city and profession, and no block. Duplicate contacts are rejected. Only the recipient accepts/declines; only the sender withdraws. Accepting a contact does not create employment or a contract.

## Client routes
- /professional — real JCard identity, languages, location, profession and training
- /certificates — private submission and request states
- /credential-review — reviewer-only documentary queue
- /company — shared company/institution profile; /company?id=UUID is its public profile
- /opportunities — city/trade discovery and applications/invitations
- /jcard?user=UUID — public QR destination

## Verification and deployment
The additive migration is `20261031050000_jcard_verification.sql`. SQL authorization tests run only in CI's disposable PostgreSQL service via `tests/jcard-verification.test.sql`; never run bootstrap or fixtures on a hosted project. Normal application CI checks catalogue/UI types and exports all three platforms.
No native dependencies are added. A new native build is not required for these routes; an EAS update is a separate deployment action.

## Operational follow-up
Designate actual credential reviewers and complete real organization/document reviews before checks or scopes can appear. Actual legal/compliance validation requires people/processes outside this code. Existing employment verification prerequisites still apply; no new method bypasses that workflow. Live permission enforcement, live moderation and strikes remain phase 3. No fictional accounts, employees, certificates or ratings are seeded in production.

Deployment: migration applied to Supabase project nwiimdmtddjquwxtjxmw and recorded as version 20261031050000. Production contains only the profession catalogue and backfilled real identities; no CI fixtures were run there. Database TypeScript definitions were regenerated from the deployed schema.
