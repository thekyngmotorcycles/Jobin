const assert = require('node:assert/strict');
const { createHmac, randomBytes, randomUUID } = require('node:crypto');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { Pool } = require(process.env.PILOT_PG_MODULE || 'pg');
const { createPilot } = require('./gateway.cjs');
const { StorageClient } = require('@supabase/storage-js');

const { PILOT_DB, PILOT_AUTH, PILOT_LEGACY_AUTH, PILOT_STORAGE, PILOT_MAIL, PILOT_REST,
  PILOT_JWT_SECRET, PILOT_ANON_KEY, PILOT_S3_MODULE } = process.env;
for (const value of [PILOT_DB, PILOT_AUTH, PILOT_LEGACY_AUTH, PILOT_STORAGE, PILOT_MAIL, PILOT_REST]) {
  assert.equal(new URL(value).hostname, '127.0.0.1', 'fixture services are loopback only');
}
assert.ok(PILOT_JWT_SECRET);
const pool = new Pool({ connectionString: PILOT_DB });
const password = randomUUID();
const updatedPassword = randomUUID();
const address = () => randomUUID() + '@example.com';
const authHeaders = (account) => ({ Authorization: 'Bearer ' + account.access_token });
const sessionOf = (account) => JSON.parse(Buffer.from(account.access_token.split('.')[1], 'base64url')).session_id;

function fixtureAdminToken() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = encode({ alg: 'HS256', typ: 'JWT' }) + '.' +
    encode({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 1800 });
  return claims + '.' + createHmac('sha256', PILOT_JWT_SECRET).update(claims).digest('base64url');
}

function request(url, method, body, headers) {
  return fetch(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { ...headers, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    signal: AbortSignal.timeout(15000),
  });
}

async function expect(response, status, label) {
  const result = await response;
  assert.equal(result.status, status, label);
  return result;
}

async function createUser(origin, email, adminToken) {
  const result = await expect(request(origin + '/admin/users', 'POST', {
    email, password, email_confirm: true, user_metadata: { display_name: 'Synthetic pilot' },
  }, { Authorization: 'Bearer ' + adminToken }), 200, 'fixture user provisioned');
  return result.json();
}

async function listen(server) {
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  return 'http://127.0.0.1:' + server.address().port;
}

function fixtureCache(origin) {
  const cached = new Map();
  return createServer(async (req, res) => {
    let result = cached.get(req.url);
    if (!result) {
      const upstream = req.url === '/cache-control-fixture'
        ? new Response('synthetic public response', { headers: { 'Cache-Control': 'public, max-age=30' } })
        : await fetch(origin + req.url, { headers: req.headers.authorization
          ? { Authorization: req.headers.authorization } : {} });
      result = { status: upstream.status, headers: Object.fromEntries(upstream.headers),
        body: Buffer.from(await upstream.arrayBuffer()) };
      if (/^public, max-age=[1-9]/.test(result.headers['cache-control'])) cached.set(req.url, result);
      res.setHeader('X-Fixture-Cache', 'MISS');
    } else {
      res.setHeader('X-Fixture-Cache', 'HIT');
    }
    res.writeHead(result.status, result.headers).end(result.body);
  });
}

async function verifyMail(email, base) {
  const inbox = await (await fetch(PILOT_MAIL + '/api/v1/messages')).json();
  const message = inbox.messages.find((candidate) => candidate.To.some((recipient) => recipient.Address === email));
  assert.ok(message, 'confirmation message sent to specified fixture mailbox');
  const payload = await (await fetch(PILOT_MAIL + '/api/v1/message/' + message.ID)).json();
  const link = payload.Text.match(/https?:\/\/[^\s<>]+/g).map((entry) => new URL(entry))
    .find((entry) => entry.pathname.endsWith('/verify') && entry.searchParams.get('type') === 'email_change');
  assert.ok(link, 'upstream dual confirmation link');
  const token = link.searchParams.get('token') || link.searchParams.get('token_hash');
  await expect(request(base + '/auth/v1/verify', 'POST', { type: 'email_change', token_hash: token }),
    200, 'verify email change through allowlisted route');
}

function storageData(result, label) {
  assert.equal(result.error, null, label);
  return result.data;
}

async function verifyDocuments({ base, a, b, c, adminToken, hold }) {
  const admin = new StorageClient(PILOT_STORAGE, { Authorization: 'Bearer ' + adminToken });
  const subject = (user) => new StorageClient(PILOT_STORAGE, authHeaders(user));
  const legacyBucket = 'pilot-legacy-docs', vault = 'pilot-vault';
  storageData(await admin.createBucket(legacyBucket, { public: false }), 'legacy private bucket');
  storageData(await admin.createBucket(vault, { public: false }), 'server-only bucket');
  await pool.query(`create schema pilot_fixture;
    create table pilot_fixture.legacy_document_grants (reviewer_id uuid primary key);
    alter table pilot_fixture.legacy_document_grants enable row level security;
    grant usage on schema pilot_fixture to authenticated;
    grant select on pilot_fixture.legacy_document_grants to authenticated;
    create policy fixture_grants_own on pilot_fixture.legacy_document_grants to authenticated using (reviewer_id=auth.uid());
    create policy fixture_legacy_document on storage.objects for select to authenticated using (
      bucket_id='pilot-legacy-docs' and exists (
        select 1 from pilot_fixture.legacy_document_grants where reviewer_id=(select auth.uid())));
    create policy fixture_server_only_vault on storage.objects as restrictive for all to anon,authenticated
      using (bucket_id<>'pilot-vault') with check (bucket_id<>'pilot-vault');`);
  await pool.query('insert into pilot_fixture.legacy_document_grants values($1)', [b.user.id]);
  const bytes = Buffer.from('synthetic document');
  const fixtureFile = a.user.id + '/fixture.txt';
  const newFile = a.user.id + '/' + randomUUID() + '.txt';
  const docId = randomUUID();
  storageData(await admin.from(legacyBucket).upload(fixtureFile, bytes, { cacheControl: '0' }), 'fixture original saved');
  const earlier = storageData(await subject(b).from(legacyBucket).createSignedUrl(fixtureFile, 300), 'preexisting link');
  await expect(fetch(earlier.signedUrl), 200, 'preexisting signed fixture');
  const transformUrl = (bucket, path) => PILOT_STORAGE + '/render/image/authenticated/' + bucket + '/' + path + '?width=32';
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  const legacyImage = a.user.id + '/fixture.png';
  const vaultImage = a.user.id + '/' + randomUUID() + '.png';
  storageData(await admin.from(legacyBucket).upload(legacyImage, pixel, { contentType: 'image/png', cacheControl: '0' }), 'image fixture');
  await expect(fetch(transformUrl(legacyBucket, legacyImage), { headers: authHeaders(b) }), 200,
    'authenticated transform route is active for authorized image');
  const transformed = storageData(await subject(b).from(legacyBucket).createSignedUrl(
    legacyImage, 300, { transform: { width: 32 } }), 'preexisting transformed-image link');
  await expect(fetch(transformed.signedUrl), 200, 'signed transform route is active');
  const { S3Client, HeadObjectCommand } = require(PILOT_S3_MODULE || '@aws-sdk/client-s3');
  const s3Head = async (account, bucket, path) => {
    const client = new S3Client({ endpoint: PILOT_STORAGE + '/s3', forcePathStyle: true, region: 'local',
      credentials: { accessKeyId: 'jobeen-pilot', secretAccessKey: PILOT_ANON_KEY, sessionToken: account.access_token },
      maxAttempts: 1 });
    try {
      return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: path }));
    } finally {
      client.destroy();
    }
  };
  assert.equal((await s3Head(b, legacyBucket, fixtureFile)).ContentLength, bytes.length,
    'S3 with authorized session reaches existing fixture');
  await pool.query('delete from pilot_fixture.legacy_document_grants where reviewer_id=$1', [b.user.id]);
  assert.ok((await subject(b).from(legacyBucket).download(fixtureFile)).error, 'new direct read denied');
  // The original fixture is synthetic. A move preserves its bytes under a new address.
  storageData(await admin.from(legacyBucket).move(fixtureFile, newFile, { destinationBucket: vault }), 'fixture moved');
  storageData(await admin.from(legacyBucket).move(legacyImage, vaultImage, { destinationBucket: vault }), 'image fixture moved');
  const retired = await fetch(earlier.signedUrl);
  assert.ok(retired.status >= 400, 'retired link is denied before expiration at origin');
  assert.ok((await fetch(transformed.signedUrl)).status >= 400, 'preexisting transform link retired at origin');
  await pool.query('insert into jobeen_pilot.documents values($1,$2,$3,$4,$5)',
    [docId, a.user.id, b.user.id, vault, newFile]);
  for (const account of [a, b, c]) {
    const client = subject(account).from(vault);
    assert.ok((await client.download(newFile)).error, 'direct authenticated Storage read denied');
    assert.ok((await client.createSignedUrl(newFile, 60)).error, 'direct Storage signature denied');
    const batch = await client.createSignedUrls([newFile], 60);
    assert.ok(batch.error || batch.data?.every((entry) => !entry.signedUrl), 'direct batch Storage signature denied');
    assert.ok((await client.copy(newFile, 'fixture-copy', { destinationBucket: legacyBucket })).error, 'direct copy denied');
    assert.deepEqual(storageData(await client.list(a.user.id), 'Storage list'), [], 'vault list hidden');
    const publicUrl = PILOT_STORAGE + '/object/public/' + vault + '/' + newFile;
    assert.ok((await fetch(publicUrl, { headers: authHeaders(account) })).status >= 400, 'public route denied');
    assert.ok((await fetch(transformUrl(vault, vaultImage), { headers: authHeaders(account) })).status >= 400,
      'direct transform denied');
    await assert.rejects(s3Head(account, vault, newFile),
      (error) => [403, 404].includes(error.$metadata?.httpStatusCode), 'S3 session cannot read vault metadata');
  }

  const route = '/documents/' + docId;
  const get = (account, headers) => fetch(base + route, { headers: { ...authHeaders(account), ...headers } });
  const cache = fixtureCache(base);
  const cacheUrl = await listen(cache);
  try {
    await fetch(cacheUrl + '/cache-control-fixture');
    assert.equal((await fetch(cacheUrl + '/cache-control-fixture')).headers.get('x-fixture-cache'), 'HIT');
    for (const account of [a, b]) {
      const response = await expect(fetch(cacheUrl + route, { headers: authHeaders(account) }), 200, 'authorized download');
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.equal(response.headers.get('x-fixture-cache'), 'MISS');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes, 'fixture integrity');
    }
    await expect(fetch(cacheUrl + route, { headers: authHeaders(c) }), 403, 'third account denied through cache');
    await pool.query('insert into public.blocks(blocker_id,blocked_id) values($1,$2)', [a.user.id, b.user.id]);
    await expect(get(b), 403, 'active block overrides approval');
    await expect(get(a), 200, 'owner survives block');
    await pool.query('delete from public.blocks where blocker_id=$1 and blocked_id=$2', [a.user.id, b.user.id]);
    await expect(get(b), 200, 'unblocked reviewer retains existing permission in the fixture');

    // Hold reads after Storage has admitted them. Revocation must win before response bytes.
    let release;
    let arrived;
    const waiting = new Promise((resolve) => { arrived = resolve; });
    const blocked = new Promise((resolve) => { release = resolve; });
    let inStorage = 0;
    hold.current = () => {
      if (++inStorage === 2) arrived();
      return blocked;
    };
    const first = get(b);
    const second = get(b, { Range: 'bytes=0-2' });
    try {
      await Promise.race([waiting, new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error('concurrent storage read timeout')), 10000);
        timer.unref();
      })]);
      await pool.query('update jobeen_pilot.documents set reviewer_id=null where id=$1', [docId]);
    } finally {
      hold.current = undefined;
      release();
    }
    await Promise.all([expect(first, 403, 'in-flight bytes withheld after revoke'),
      expect(second, 403, 'in-flight Range denied after revoke')]);
    await expect(fetch(cacheUrl + route, { headers: authHeaders(b) }), 403, 'old cached response cannot recover access');
    await expect(get(a), 200, 'owner survives reviewer revocation');
  } finally {
    cache.close();
  }
  console.log('PASS documents: live permission and block, concurrent revocation before bytes, origin, direct Storage and fixture cache');
}

async function run() {
  const adminToken = fixtureAdminToken();
  const delivery = new Map();
  const hold = {};
  const admin = new StorageClient(PILOT_STORAGE, { Authorization: 'Bearer ' + adminToken });
  await pool.query(readFileSync(__dirname + '/schema.sql', 'utf8'));
  const gateway = createPilot({
    pool, authOrigin: PILOT_AUTH, authAdminToken: adminToken, proofKey: randomBytes(32),
    deliver: ({ email, code }) => { delivery.set(email, code); },
    readDocument: async ({ bucket, object_path: path }) => {
      const blob = storageData(await admin.from(bucket).download(path), 'server vault read');
      await hold.current?.();
      return Buffer.from(await blob.arrayBuffer());
    },
  });
  const base = await listen(gateway);
  try {
    const [emailA, emailB, emailC, replacement] = [address(), address(), address(), address()];
    for (const email of [emailA, emailB, emailC]) await createUser(PILOT_AUTH, email, adminToken);
    const login = async (email, secret = password) => (await expect(request(
      base + '/auth/v1/token?grant_type=password', 'POST', { email, password: secret }), 200, 'pilot login')).json();
    let a = await login(emailA);
    const secondSession = await login(emailA);
    const b = await login(emailB);
    const c = await login(emailC);
    await expect(fetch(PILOT_REST + '/intents', {
      headers: { ...authHeaders(a), 'Accept-Profile': 'jobeen_pilot' },
    }), 406, 'internal pilot schema is outside the REST API');
    for (const [method, path] of [['PUT', '/auth/v1/user'], ['PUT', '/user'], ['POST', '/auth/v1/recover'],
      ['POST', '/auth/v1/otp'], ['POST', '/auth/v1/token?grant_type=id_token'],
      ['POST', '/auth/v1/signup'], ['DELETE', '/auth/v1/admin/users/' + a.user.id]]) {
      await expect(request(base + path, method, {}, authHeaders(a)), 404, 'public ingress deny-by-default');
    }
    await expect(request(base + '/auth/v1/verify', 'POST', { type: 'recovery', token_hash: 'fixture' }),
      404, 'recovery confirmation held outside pilot');
    await expect(request(PILOT_LEGACY_AUTH + '/user', 'GET', undefined, authHeaders(a)), 403,
      'pilot token rejected by independent legacy issuer');
    await expect(request(PILOT_LEGACY_AUTH + '/user', 'PUT', { password: randomUUID() }, authHeaders(a)), 403,
      'independent legacy issuer cannot mutate a pilot identity');
    const legacyResult = await expect(request(PILOT_LEGACY_AUTH + '/signup', 'POST', {
      email: emailA, password, data: { display_name: 'Synthetic legacy' },
    }), 200, 'independent legacy fixture can issue identity for same email');
    const legacy = await legacyResult.json();
    assert.notEqual(legacy.user.id, a.user.id, 'same email does not link UUIDs');
    await expect(request(base + '/pilot/intents', 'POST', {}, authHeaders(legacy)), 403, 'legacy token rejected on pilot');
    await expect(fetch(PILOT_REST + '/profiles', { headers: authHeaders(legacy) }), 401,
      'legacy token rejected on isolated Data API');
    const noChallenge = await request(base + '/pilot/complete', 'POST',
      { action: 'delete-account', operationId: randomUUID(), intentId: randomUUID(), code: '12345678' }, authHeaders(a));
    assert.equal(noChallenge.status, 403, 'a fresh login is not an operation proof');

    const prepare = async (account, operation, email = account.user.email) => {
      const input = { ...operation, operationId: randomUUID() };
      const { intentId } = await (await expect(request(base + '/pilot/intents', 'POST', input,
        authHeaders(account)), 201, 'challenge minted')).json();
      const code = delivery.get(email);
      assert.match(code, /^\d{8}$/);
      return { ...input, intentId, code };
    };
    const execute = (account, data) => request(base + '/pilot/complete', 'POST', data, authHeaders(account));
    const intent = await prepare(a, { action: 'password', password: updatedPassword });
    await expect(execute(a, { ...intent, code: intent.code === '10000000' ? '20000000' : '10000000' }), 403, 'wrong code');
    await expect(execute(b, intent), 403, 'other identity cannot redeem');
    await expect(execute(secondSession, intent), 403, 'other session cannot redeem');
    await expect(execute(a, { ...intent, password: randomUUID() }), 403, 'password is bound to the operation');
    const passwordResults = await Promise.all([execute(a, intent), execute(a, intent)]);
    assert.deepEqual(passwordResults.map((result) => result.status).sort(), [200, 409], 'one concurrent password mutation');
    await expect(execute(a, intent), 409, 'code cannot be reused');
    await expect(request(base + '/auth/v1/token?grant_type=password', 'POST', { email: emailA, password }),
      400, 'previous password rejected');
    a = await login(emailA, updatedPassword);
    await pool.query("update auth.sessions set created_at=now()-interval '2 days' where id=$1", [sessionOf(a)]);
    const emailIntent = await prepare(a, { action: 'email', email: replacement });
    const refreshed = await (await expect(request(base + '/auth/v1/token?grant_type=refresh_token', 'POST',
      { refresh_token: a.refresh_token }), 200, 'refresh rotation')).json();
    assert.equal(sessionOf(refreshed), sessionOf(a), 'refresh preserves session binding');
    a = refreshed;
    await expect(execute(a, emailIntent), 202, 'recent proof works even with older session');
    const before = await (await expect(request(base + '/auth/v1/user', 'GET', undefined, authHeaders(a)), 200,
      'user pending email change')).json();
    assert.equal(before.email, emailA);
    await verifyMail(emailA, base);
    const afterFirst = await (await expect(request(base + '/auth/v1/user', 'GET', undefined, authHeaders(a)),
      200, 'user after old mailbox only')).json();
    assert.equal(afterFirst.email, emailA);
    await verifyMail(replacement, base);
    a = await login(replacement, updatedPassword);
    assert.equal(a.user.id, before.id, 'email confirmation keeps user UUID');

    const withdrawal = { action: 'withdrawal', amountMinor: 250, currency: 'USD', destination: 'fixture-bank' };
    const expired = await prepare(b, withdrawal);
    await pool.query("update jobeen_pilot.intents set expires_at=clock_timestamp()-interval '1 second' where id=$1", [expired.intentId]);
    await expect(execute(b, expired), 410, 'expired code denied');
    const expiredSession = await login(emailB);
    const sessionProof = await prepare(expiredSession, withdrawal);
    await pool.query("update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id=$1",
      [sessionOf(expiredSession)]);
    await expect(execute(expiredSession, sessionProof), 403, 'server-expired session cannot redeem a fresh proof');
    const attempts = await prepare(b, withdrawal);
    for (let index = 0; index < 5; index++) {
      await expect(execute(b, { ...attempts, code: attempts.code === '10000000' ? '20000000' : '10000000' }), 403,
        'wrong proof attempts are persisted');
    }
    await expect(execute(b, attempts), 429, 'attempt limit even with valid code');
    const cash = await prepare(b, withdrawal);
    await expect(execute(b, { ...cash, amountMinor: cash.amountMinor + 1 }), 403, 'bound amount');
    await expect(execute(b, { ...cash, destination: 'fixture-other' }), 403, 'bound destination');
    await expect(execute(b, { ...cash, action: 'payment' }), 403, 'bound action');
    const financialResults = await Promise.all([execute(b, cash), execute(b, cash), execute(b, cash)]);
    assert.deepEqual(financialResults.map((result) => result.status).sort(), [200, 409, 409], 'one withdrawal entry');
    await expect(request(base + '/pilot/intents', 'POST', { ...withdrawal, operationId: cash.operationId },
      authHeaders(b)), 409, 'operation ID cannot mint a second proof for the same subject');
    await expect(execute(b, await prepare(b, { ...withdrawal, action: 'payment' })), 200, 'isolated test payment');
    assert.equal((await pool.query('select count(*)::int as total from jobeen_pilot.ledger')).rows[0].total, 2);

    await verifyDocuments({ base, a, b, c, adminToken, hold });
    const logoutIntent = await prepare(b, withdrawal);
    await expect(request(base + '/auth/v1/logout?scope=local', 'POST', undefined, authHeaders(b)), 204, 'logout');
    await expect(execute(b, logoutIntent), 403, 'still-signed access token denied after server session logout');
    const deleted = await prepare(c, { action: 'delete-account' });
    await expect(execute(c, deleted), 200, 'soft-delete synthetic account');
    await expect(execute(c, deleted), 403, 'deleted session cannot reuse code');
    const state = await pool.query('select deleted_at is not null as deleted from auth.users where id=$1', [c.user.id]);
    assert.ok(state.rows[0].deleted, 'GoTrue account soft deleted');
    console.log('PASS GoTrue: password, dual email confirmation, account deletion, two ledger actions, freshness, reuse, concurrency, refresh, logout and independent issuer');
  } finally {
    gateway.close();
  }
}

run().catch((error) => {
  // Assertion messages contain labels/statuses. Never print HTTP bodies or fixture credentials.
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
