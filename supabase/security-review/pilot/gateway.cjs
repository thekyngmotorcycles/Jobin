const { createHmac, randomInt, randomUUID, timingSafeEqual } = require('node:crypto');
const { createServer } = require('node:http');

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const emailPattern = /^[^\s@]{1,64}@[^\s@]{1,189}$/;

function normalizeOperation(body) {
  switch (body.action) {
    case 'password':
      if (typeof body.password === 'string' && Buffer.byteLength(body.password) >= 12 &&
          Buffer.byteLength(body.password) <= 72) {
        return { action: body.action, password: body.password };
      }
      break;
    case 'email':
      if (typeof body.email === 'string' && emailPattern.test(body.email)) {
        return { action: body.action, email: body.email.toLowerCase() };
      }
      break;
    case 'delete-account':
      return { action: body.action };
    case 'payment':
    case 'withdrawal':
      if (Number.isSafeInteger(body.amountMinor) && body.amountMinor > 0 && body.amountMinor <= 1000000 &&
          body.currency === 'USD' && typeof body.destination === 'string' &&
          /^fixture-[a-z0-9-]{1,40}$/.test(body.destination)) {
        return { action: body.action, amountMinor: body.amountMinor, currency: body.currency,
          destination: body.destination };
      }
  }
  return null;
}

async function jsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw new SyntaxError('body size');
    chunks.push(chunk);
  }
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SyntaxError('body shape');
  return body;
}

async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function hasLiveSession(db, session) {
  const found = await db.query(
    `select 1 from auth.sessions s join auth.users u on u.id=s.user_id
     where s.id=$1 and s.user_id=$2 and (s.not_after is null or s.not_after>clock_timestamp())
     and u.deleted_at is null and (u.banned_until is null or u.banned_until<=clock_timestamp())
     and u.email=$3 and u.email_confirmed_at is not null`,
    [session.id, session.userId, session.email],
  );
  return found.rowCount === 1;
}

function writeJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(value));
}

function createPilot({ pool, authOrigin, authAdminToken, proofKey, deliver, readDocument }) {
  const origin = new URL(authOrigin);
  if (origin.protocol !== 'http:' || origin.hostname !== '127.0.0.1' || origin.pathname !== '/' ||
      origin.username || origin.password || origin.search || origin.hash || proofKey.length < 32) {
    throw new Error('Use a loopback GoTrue fixture and a generated proof key');
  }

  function authFetch(path, { method = 'GET', authorization, data } = {}) {
    const headers = {};
    if (authorization) headers.Authorization = authorization;
    if (data) headers['Content-Type'] = 'application/json';
    return fetch(new URL(path, origin), {
      method, headers, body: data && JSON.stringify(data), redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
  }

  async function identify(authorization) {
    if (!authorization?.startsWith('Bearer ')) return null;
    // Use claims only after GoTrue verifies the exact token and subject.
    const verified = await authFetch('/user', { authorization });
    if (!verified.ok) return null;
    const user = await verified.json();
    const claims = JSON.parse(Buffer.from(authorization.split('.')[1], 'base64url').toString());
    if (claims.sub !== user.id || claims.role !== 'authenticated' ||
        !uuid.test(claims.session_id) || !uuid.test(user.id)) return null;
    return { id: claims.session_id, userId: user.id, email: user.email, confirmed: Boolean(user.email_confirmed_at) };
  }

  function digest(scope, value) {
    return createHmac('sha256', proofKey).update(scope).update('\0').update(value).digest('hex');
  }

  function userLock(db, session) {
    return db.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [session.userId]);
  }

  async function createIntent(session, operationId, operation) {
    const id = randomUUID();
    const code = String(randomInt(10000000, 100000000));
    const result = await transaction(pool, async (db) => {
      await userLock(db, session);
      if (!session.confirmed || !session.email || !await hasLiveSession(db, session)) return 403;
      const recent = await db.query(
        `select count(*)::int as count from jobeen_pilot.intents
         where user_id=$1 and created_at>clock_timestamp()-interval '10 minutes'`, [session.userId],
      );
      if (recent.rows[0].count >= 10) return 429;
      const inserted = await db.query(
        `insert into jobeen_pilot.intents (id,user_id,session_id,operation_id,binding,proof,expires_at)
         values ($1,$2,$3,$4,$5,$6,clock_timestamp()+interval '5 minutes')
         on conflict (user_id,operation_id) do nothing`,
        [id, session.userId, session.id, operationId,
          digest('params', JSON.stringify([session.email, operation])), digest(id, code)],
      );
      return inserted.rowCount === 1 ? 201 : 409;
    });
    if (result !== 201) return { status: result };
    try {
      await deliver({ email: session.email, action: operation.action, code });
    } catch {
      await pool.query('update jobeen_pilot.intents set expires_at=clock_timestamp() where id=$1', [id]);
      return { status: 503 };
    }
    return { status: 201, intentId: id };
  }

  async function consumeIntent(session, id, operationId, operation, code) {
    return transaction(pool, async (db) => {
      await userLock(db, session);
      if (!await hasLiveSession(db, session)) return 403;
      const found = await db.query(
        `select *, expires_at>clock_timestamp() as fresh from jobeen_pilot.intents
         where id=$1 and user_id=$2 and session_id=$3 and operation_id=$4 for update`,
        [id, session.userId, session.id, operationId],
      );
      const intent = found.rows[0];
      if (!intent) return 403;
      if (intent.state !== 'pending') return 409;
      if (!intent.fresh) return 410;
      if (intent.attempts >= 5) return 429;
      const binding = digest('params', JSON.stringify([session.email, operation]));
      if (intent.binding !== binding ||
          !timingSafeEqual(Buffer.from(intent.proof, 'hex'), Buffer.from(digest(id, code), 'hex'))) {
        await db.query('update jobeen_pilot.intents set attempts=attempts+1 where id=$1', [id]);
        return 403;
      }
      const inFlight = await db.query(
        "select 1 from jobeen_pilot.intents where user_id=$1 and state in ('executing','uncertain')", [session.userId],
      );
      if (inFlight.rowCount) return 409;
      if (operation.action === 'payment' || operation.action === 'withdrawal') {
        await db.query('insert into jobeen_pilot.ledger values($1,$2,$3,$4,$5,$6)',
          [id, session.userId, operation.action, operation.amountMinor, operation.currency, operation.destination]);
        await db.query("update jobeen_pilot.intents set state='complete' where id=$1", [id]);
        return 200;
      }
      await db.query("update jobeen_pilot.intents set state='executing' where id=$1", [id]);
      return 202;
    });
  }

  async function executeAuth(session, authorization, id, operation) {
    let status = 503;
    try {
      if (await hasLiveSession(pool, session)) {
        const result = operation.action === 'delete-account'
          ? await authFetch('/admin/users/' + session.userId, {
            method: 'DELETE', authorization: 'Bearer ' + authAdminToken, data: { should_soft_delete: true },
          })
          : await authFetch('/user', {
            method: 'PUT', authorization, data: operation.action === 'email'
              ? { email: operation.email } : { password: operation.password },
          });
        if (result.ok) status = operation.action === 'email' ? 202 : 200;
        await result.body?.cancel();
      }
    } catch {
      // An indeterminate provider response keeps the operation reserved for reconciliation.
    }
    await pool.query('update jobeen_pilot.intents set state=$2 where id=$1',
      [id, status === 503 ? 'uncertain' : 'complete']);
    return status;
  }

  async function documentAccess(session, id) {
    const allowed = await pool.query(
      `select d.bucket,d.object_path from jobeen_pilot.documents d
       join auth.sessions s on s.id=$3 and s.user_id=$2
       join auth.users u on u.id=s.user_id
       where d.id=$1 and (d.owner_id=$2 or d.reviewer_id=$2)
       and (s.not_after is null or s.not_after>clock_timestamp())
       and u.deleted_at is null and (u.banned_until is null or u.banned_until<=clock_timestamp())
       and not exists (select 1 from public.blocks b where
        (b.blocker_id=d.owner_id and b.blocked_id=$2) or (b.blocker_id=$2 and b.blocked_id=d.owner_id))`,
      [id, session.userId, session.id],
    );
    return allowed.rows[0];
  }

  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('Vary', 'Authorization');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const authorization = request.headers.authorization;
      const path = request.url;
      const method = request.method;
      const tokenRoute = method === 'POST' && [
        '/auth/v1/token?grant_type=password', '/auth/v1/token?grant_type=refresh_token',
      ].includes(path);
      const userRoute = method === 'GET' && path === '/auth/v1/user';
      const logoutRoute = method === 'POST' && path === '/auth/v1/logout?scope=local';
      const verifyRoute = method === 'POST' && path === '/auth/v1/verify';
      if (tokenRoute || userRoute || logoutRoute || verifyRoute) {
        let data;
        if (tokenRoute) {
          const body = await jsonBody(request);
          data = path.endsWith('=password') ? { email: body.email, password: body.password }
            : { refresh_token: body.refresh_token };
        }
        if (verifyRoute) {
          const body = await jsonBody(request);
          if (body.type !== 'email_change' || typeof body.token_hash !== 'string') return response.writeHead(404).end();
          data = { type: 'email_change', token_hash: body.token_hash };
        }
        const upstream = await authFetch(path.slice('/auth/v1'.length), { method, authorization, data });
        response.writeHead(upstream.status, { 'Content-Type': 'application/json' });
        return response.end(upstream.status === 204 ? undefined : await upstream.text());
      }
      const documentId = method === 'GET' && path.startsWith('/documents/') ? path.slice('/documents/'.length) : '';
      const create = method === 'POST' && path === '/pilot/intents';
      const complete = method === 'POST' && path === '/pilot/complete';
      if (!create && !complete && !uuid.test(documentId)) return response.writeHead(404).end();
      const session = await identify(authorization);
      if (!session) return response.writeHead(403).end();
      if (documentId) {
        const allowed = await documentAccess(session, documentId);
        if (!allowed) return response.writeHead(403).end();
        const bytes = await readDocument(allowed);
        const current = await documentAccess(session, documentId);
        if (current?.bucket !== allowed.bucket || current?.object_path !== allowed.object_path) {
          return response.writeHead(403).end();
        }
        response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment' });
        return response.end(bytes);
      }
      const body = await jsonBody(request);
      const operation = normalizeOperation(body);
      if (!operation || !uuid.test(body.operationId)) return response.writeHead(400).end();
      if (create) {
        const result = await createIntent(session, body.operationId, operation);
        return writeJson(response, result.status, result.intentId ? { intentId: result.intentId } : {});
      }
      if (!uuid.test(body.intentId) || typeof body.code !== 'string' || !/^\d{8}$/.test(body.code)) {
        return response.writeHead(400).end();
      }
      let status = await consumeIntent(session, body.intentId, body.operationId, operation, body.code);
      if (status === 202) status = await executeAuth(session, authorization, body.intentId, operation);
      return response.writeHead(status).end();
    } catch (error) {
      response.writeHead(error instanceof SyntaxError ? 400 : 503).end();
    }
  });
}

module.exports = { createPilot };
