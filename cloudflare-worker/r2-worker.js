/**
 * Cloudflare Worker — CPS Connect R2 Storage API
 *
 * Endpoints:
 *   POST   /upload          — upload d'un fichier (FormData), retourne { url, key }
 *   GET    /list?prefix=    — liste les objets R2, retourne { objects: R2Object[] }
 *   DELETE /delete?key=     — supprime un objet R2
 *   GET    /health          — vérification que le Worker répond
 *
 * Auth: JWT Firebase obligatoire sur /upload et /delete.
 *       /list et /health sont publics (lecture seule).
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/health' && request.method === 'GET') {
        return json({ status: 'ok' }, corsHeaders);
      }

      if (url.pathname === '/list' && request.method === 'GET') {
        return handleList(request, env, url, corsHeaders);
      }

      if (url.pathname === '/upload' && request.method === 'POST') {
        const uid = await requireAuth(request, env);
        return handleUpload(request, env, uid, corsHeaders);
      }

      if (url.pathname === '/serve' && request.method === 'GET') {
        return handleServe(request, env, url, corsHeaders);
      }

      if (url.pathname === '/delete' && request.method === 'DELETE') {
        await requireAuth(request, env);
        return handleDelete(request, env, url, corsHeaders);
      }

      return json({ error: 'Not found' }, corsHeaders, 404);
    } catch (err) {
      const status = err.status || 500;
      return json({ error: err.message }, corsHeaders, status);
    }
  }
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleUpload(request, env, uid, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'resources';
  const customKey = formData.get('customKey'); // optionnel — overwrite une clé existante

  if (!file || typeof file === 'string') {
    throw httpError(400, 'Champ "file" manquant dans FormData');
  }

  const timestamp = Date.now();
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100);
  const key = customKey || `${folder}/${uid}_${timestamp}_${sanitizedName}`;

  await env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
    customMetadata: { uploadedBy: uid, originalName: file.name },
  });

  const publicUrl = `${env.R2_PUBLIC_BASE_URL}/${key}`;
  return json({ url: publicUrl, key }, corsHeaders);
}

async function handleList(request, env, url, corsHeaders) {
  const prefix = url.searchParams.get('prefix') || '';
  const cursor = url.searchParams.get('cursor') || undefined;

  const listed = await env.R2_BUCKET.list({
    prefix: prefix || undefined,
    cursor,
    limit: 100,
  });

  const objects = listed.objects.map(obj => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
    url: `${env.R2_PUBLIC_BASE_URL}/${obj.key}`,
    name: extractOriginalName(obj.key.split('/').pop() || obj.key),
    folder: obj.key.includes('/') ? obj.key.split('/').slice(0, -1).join('/') : '',
  }));

  return json({
    objects,
    truncated: listed.truncated,
    cursor: listed.cursor || null,
  }, corsHeaders);
}

async function handleServe(request, env, url, corsHeaders) {
  const key = url.searchParams.get('key');
  if (!key) throw httpError(400, 'Paramètre "key" manquant');

  const object = await env.R2_BUCKET.get(key);
  if (!object) throw httpError(404, 'Fichier introuvable');

  const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
  const fileName = key.split('/').pop() || 'file';
  const originalName = extractOriginalName(fileName);

  return new Response(object.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${originalName}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

async function handleDelete(request, env, url, corsHeaders) {
  const key = url.searchParams.get('key');
  if (!key) throw httpError(400, 'Paramètre "key" manquant');

  await env.R2_BUCKET.delete(key);
  return json({ deleted: key }, corsHeaders);
}

// ---------------------------------------------------------------------------
// Auth — vérifie le JWT Firebase
// ---------------------------------------------------------------------------

async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) throw httpError(401, 'Token Firebase manquant');

  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) throw httpError(500, 'FIREBASE_PROJECT_ID non configuré');

  try {
    const payload = await verifyFirebaseJwt(token, projectId);
    return payload.sub; // uid Firebase
  } catch (err) {
    throw httpError(401, `Token invalide: ${err.message}`);
  }
}

async function verifyFirebaseJwt(token, projectId) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Format JWT invalide');

  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  if (!header.kid) throw new Error('kid manquant dans le header JWT');

  // JWKS endpoint — retourne des clés en format JWK, directement importables
  const jwksRes = await fetch(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    { cf: { cacheTtl: 3600 } }
  );
  if (!jwksRes.ok) throw new Error('Impossible de récupérer les clés JWKS Firebase');
  const jwks = await jwksRes.json();

  const jwk = jwks.keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error(`Clé JWKS introuvable pour kid=${header.kid}`);

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sigBytes = Uint8Array.from(
    atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, sigInput);
  if (!valid) throw new Error('Signature JWT invalide');

  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) throw new Error('Token expiré');
  if (payload.iat > now + 60) throw new Error('Token émis dans le futur');
  if (payload.aud !== projectId) throw new Error(`audience invalide: ${payload.aud}`);
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('issuer invalide');
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Extrait le nom original depuis le format {uid}_{timestamp}_{nom}
function extractOriginalName(rawName) {
  const match = rawName.match(/^[^_]+_\d{13}_(.+)$/);
  return match ? match[1] : rawName;
}

function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
