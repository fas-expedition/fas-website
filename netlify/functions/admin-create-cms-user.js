const ADMIN_ROLE = 'admin';
const ALLOWED_ROLES = new Set(['cms-editor', 'admin']);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response(401, { error: 'Missing authorization bearer token' });
  }

  const accessToken = authHeader.slice('Bearer '.length).trim();
  if (!accessToken) {
    return response(401, { error: 'Invalid authorization bearer token' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return response(400, { error: 'Invalid JSON body' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const role = String(payload.role || 'cms-editor').trim();

  if (!email || !isValidEmail(email)) {
    return response(400, { error: 'A valid email address is required' });
  }

  if (!ALLOWED_ROLES.has(role)) {
    return response(400, { error: `Invalid role. Allowed roles: ${Array.from(ALLOWED_ROLES).join(', ')}` });
  }

  const identityBaseUrl = getIdentityBaseUrl(event);
  const requesterResponse = await fetch(`${identityBaseUrl}/user`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  });

  if (!requesterResponse.ok) {
    const requesterErrorBody = await requesterResponse.text();
    return response(401, {
      error: 'Unable to validate current user',
      detail: requesterErrorBody,
    });
  }

  const requester = await requesterResponse.json();
  if (!hasRole(requester, ADMIN_ROLE)) {
    return response(403, { error: 'Only admins can create users' });
  }

  const createUserResponse = await fetch(`${identityBaseUrl}/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      app_metadata: {
        roles: [role],
      },
      user_metadata: {
        invitedBy: requester.email || requester.id || 'admin',
      },
    }),
  });

  if (!createUserResponse.ok) {
    const createUserErrorBody = await createUserResponse.text();
    return response(createUserResponse.status, {
      error: 'Failed to create user',
      detail: createUserErrorBody,
    });
  }

  const createdUser = await createUserResponse.json();
  return response(200, {
    success: true,
    user: {
      id: createdUser.id,
      email: createdUser.email,
      role,
    },
    message: 'User created successfully',
  });
};

function getIdentityBaseUrl(event) {
  if (process.env.URL) {
    return `${process.env.URL}/.netlify/identity`;
  }

  const proto = event.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${event.headers.host}/.netlify/identity`;
}

function hasRole(user, role) {
  const roles = user?.app_metadata?.roles;
  return Array.isArray(roles) && roles.includes(role);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}
