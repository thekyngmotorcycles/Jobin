const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { resolve } = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const typescript = require('typescript');
const { Pool } = require(process.env.PILOT_PG_MODULE || 'pg');

const { PILOT_DB, PILOT_AUTH, PILOT_REST, PILOT_STORAGE, PILOT_ANON_KEY, PILOT_SERVICE_KEY } = process.env;
for (const value of [PILOT_DB, PILOT_AUTH, PILOT_REST, PILOT_STORAGE]) {
  assert.equal(new URL(value).hostname, '127.0.0.1', 'fixture services are loopback only');
}
assert.ok(PILOT_ANON_KEY, 'fixture anon key');
assert.ok(PILOT_SERVICE_KEY, 'fixture service key');
const pool = new Pool({ connectionString: PILOT_DB });
const root = resolve(__dirname, '../../..');
const baseline = 'bf212a9';
const hostRoutes = { '/auth/v1': PILOT_AUTH, '/rest/v1': PILOT_REST, '/storage/v1': PILOT_STORAGE };

function fixtureFetch(input, options) {
  const url = new URL(input);
  const prefix = Object.keys(hostRoutes).find((path) => url.pathname.startsWith(path + '/'));
  assert.ok(prefix && url.origin === PILOT_AUTH, 'only explicit fixture routes are available');
  return fetch(hostRoutes[prefix] + url.pathname.slice(prefix.length) + url.search, options);
}

function loadClient(revision, file, db) {
  const path = 'src/lib/' + file + '.ts';
  const source = revision ? execFileSync('git', ['show', revision + ':' + path], { cwd: root, encoding: 'utf8' })
    : readFileSync(resolve(root, path), 'utf8');
  const { outputText } = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.CommonJS } });
  const module = { exports: {} };
  const fixtureRequire = (name) => {
    assert.equal(name, './supabase', 'module definition must remain limited to the Supabase client');
    return { requireSupabase: () => db };
  };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, fixtureRequire);
  return module.exports;
}

async function account() {
  const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fixtureFetch } };
  const db = createClient(PILOT_AUTH, PILOT_ANON_KEY, opts);
  const admin = createClient(PILOT_AUTH, PILOT_SERVICE_KEY, opts);
  const credentials = { email: randomUUID() + '@example.com', password: randomUUID() };
  const provisioned = await admin.auth.admin.createUser({
    ...credentials, email_confirm: true, user_metadata: { display_name: 'Migration fixture' },
  });
  assert.equal(provisioned.error, null, 'fixture provisioned');
  const { data, error } = await db.auth.signInWithPassword(credentials);
  assert.equal(error, null, 'fixture login');
  assert.ok(data.session, 'fixture login session');
  return { db, id: data.user.id,
    oldCard: loadClient(baseline, 'jcard-cloud', db), newCard: loadClient(null, 'jcard-cloud', db),
    oldCV: loadClient(baseline, 'cv-access', db), newCV: loadClient(null, 'cv-access', db) };
}

function data(result, label) {
  assert.equal(result.error, null, label);
  return result.data;
}

async function reloadSchemas() {
  await pool.query("notify pgrst, 'reload schema'");
}

async function waitForPaths(account, ...paths) {
  const { data: { session } } = await account.db.auth.getSession();
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = await fetch(PILOT_REST + '/', { headers: {
      Authorization: 'Bearer ' + session.access_token, Accept: 'application/openapi+json',
    } });
    if (result.ok) {
      const spec = await result.json();
      if (paths.every((path) => spec.paths?.[path])) return;
    } else {
      await result.body?.cancel();
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  assert.fail('REST schema cache did not load stage contracts: ' + paths.join(', '));
}

async function apply(name) {
  await pool.query(readFileSync(resolve(__dirname, '..', name), 'utf8'));
  await reloadSchemas();
}

async function signedPhoto(user, path, ttl) {
  const storage = user.db.storage.from('jobeen-private-post-photos');
  const result = await storage.createSignedUrls([path], ttl);
  return result.error ? undefined : result.data[0]?.signedUrl ?? undefined;
}

async function run() {
  await pool.query(readFileSync(resolve(__dirname, 'legacy-fixture.sql'), 'utf8'));
  await reloadSchemas();
  const [a, b, c] = await Promise.all([account(), account(), account()]);
  await waitForPaths(a, '/jcard_business_details', '/jcard_employment_history', '/rpc/read_approved_employment');
  const stamp = randomUUID().slice(0, 8);
  const handle = 'fixture_' + stamp;
  const companyEmail = handle + '@example.invalid';
  const photo = a.id + '/shared.jpg';
  const draft = a.id + '/draft.jpg';
  const bytes = Buffer.from([255,216,255,217]);
  await pool.query('insert into public.jcard_business_details(owner_id,name,business_handle,email) values($1,$2,$3,$4)',
    [a.id, 'Fixture business', handle, companyEmail]);
  await pool.query(`insert into public.jcard_visibility
    (owner_id,personal_enabled,business_enabled,business_show_email,business_show_phone)
    values($1,true,true,false,false)`, [a.id]);
  await pool.query('insert into public.employment_access_requests(owner_id,requester_id,status) values($1,$2,$3)', [a.id,b.id,'approved']);
  await pool.query('insert into public.companies(profile_id,legal_name) values($1,$2)', [a.id,'Fixture business']);
  await pool.query(`insert into public.company_verification_requests(company_id,submitted_by,industry,municipality,state)
    values($1,$1,'Trade','Miami','FL')`, [a.id]);
  await pool.query(`insert into public.company_verifications(company_id,request_id,verified_by,verified_at,valid_until)
    select company_id,id,$1,now(),now()+interval '1 day'
    from public.company_verification_requests where company_id=$2`, [c.id,a.id]);
  await pool.query('insert into public.profile_follows(follower_id,followed_id) values($1,$2)', [b.id,a.id]);
  data(await a.db.storage.from('jobeen-private-post-photos').upload(photo, bytes, { contentType: 'image/jpeg' }),
    'owner image upload baseline');
  data(await a.db.storage.from('jobeen-post-draft-photos').upload(draft, bytes, { contentType: 'image/jpeg' }),
    'owner draft upload baseline');
  data(await a.db.from('jobeen_feed_posts').insert({
    author_id: a.id, body: 'Synthetic shared photo', kind: 'photos', photo_paths: [photo],
    audience: 'private', audience_followers: true, photo_bucket: 'jobeen-private-post-photos',
  }), 'owner intentionally shares image with follower');
  await a.oldCard.writeCloudHistory({ id:'fixture-work',company:'Fixture employer',role:'Fixture role',from:2020 });
  assert.equal((await a.oldCard.readCloudHistory()).length, 1);
  assert.equal((await b.oldCard.readPublicBusinessCard(a.id)).name, 'Fixture business');
  await assert.rejects(b.newCard.readPublicBusinessCard(a.id));
  assert.equal((await b.oldCV.approvedCV(a.id)).length, 1, 'consenting reader baseline');
  assert.deepEqual(await c.oldCV.approvedCV(a.id), []);
  assert.ok(await signedPhoto(b, photo, 300), 'permitted social media baseline');

  await apply('business-card-projection.sql');
  await waitForPaths(b, '/jobeen_public_business_cards', '/rpc/jobeen_business_handle_available');
  const projected = await b.newCard.readPublicBusinessCard(a.id);
  assert.equal(projected.email, null, 'additive view redacts address');
  assert.equal(await b.newCard.checkBusinessHandleAvailable(handle), false);
  assert.equal((await b.oldCard.readPublicBusinessCard(a.id)).name, 'Fixture business');

  await apply('business-card-privacy.sql');
  await apply('company-verification-privacy.sql');
  await apply('employment-privacy.sql');
  await apply('social-media-ownership.sql');
  await waitForPaths(a, '/rpc/request_employment_access', '/rpc/revoke_employment_access',
    '/rpc/respond_employment_access');
  const stableReads = async () => {
    assert.equal(await b.oldCard.readPublicBusinessCard(a.id), null, 'rollback retains raw JCard denial');
    assert.equal((await a.oldCard.readCloudBusiness()).email, companyEmail, 'legacy owner reads own contact');
    assert.equal((await c.newCard.readPublicBusinessCard(a.id)).email, null, 'new reader masks contact');
    assert.equal((await a.newCard.readCloudHistory(a.id)).length, 1, 'candidate owner history');
    assert.equal((await a.oldCard.readCloudHistory()).length, 1, 'old owner history');
    assert.deepEqual(data(await c.db.from('jcard_employment_history').select('id').eq('owner_id',a.id),
      'history RLS'), [], 'history is private');
    assert.deepEqual(data(await b.db.from('verified_companies').select('company_id').eq('company_id',a.id),
      'badge projection'), [{company_id:a.id}]);
    assert.ok((await c.db.from('company_verifications').select('verified_by')).error, 'reviewers are hidden');
    assert.ok(await signedPhoto(b, photo, 300), 'legacy and candidate retain authorized feed signing');
    assert.equal(await signedPhoto(c, photo, 300), undefined, 'third account cannot sign shared photo');
    for (const ttl of [3600, 300]) {
      for (const [user, allowed] of [[a, true], [b, false]]) {
        const result = await user.db.storage.from('jobeen-post-draft-photos').createSignedUrls([draft], ttl);
        assert.equal(Boolean(!result.error && result.data[0]?.signedUrl), allowed, 'both client draft TTLs retained with RLS');
      }
    }
  };
  await stableReads();
  const cv = (await a.newCV.cvRequests()).find((row) => row.requester_id === b.id);
  assert.ok(cv, 'existing approval survived cutover');
  assert.equal((await b.newCV.approvedCV(a.id)).length, 1, 'approved CV after cutover');
  await a.newCV.revokeCV(cv.id);
  assert.deepEqual(await b.oldCV.approvedCV(a.id), [], 'old CV reader respects revocation after rollback');
  const newRequest = await b.oldCV.requestCV(a.id);
  await a.oldCV.respondCV(newRequest, true);
  assert.equal((await b.newCV.approvedCV(a.id)).length, 1, 'old and candidate use compatible RPC contracts');
  await a.oldCV.revokeCV(newRequest);
  assert.deepEqual(await b.newCV.approvedCV(a.id), [], 'candidate respects revocation written by old client');
  await stableReads();
  console.log('PASS combined cutover: actual old/new JCard and CV readers, badge and history, Storage draft/share, and rollback without ACL restoration');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error.code || 'fixture request failed');
  process.exitCode = 1;
}).finally(() => pool.end());
