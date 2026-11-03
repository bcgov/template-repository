const { createRemoteJWKSet, jwtVerify } = require('jose');

const issuer = `${process.env.SSO_URL}/realms/${process.env.SSO_REALM}`;

const jwks = createRemoteJWKSet(
  new URL(`${issuer}/protocol/openid-connect/certs`)
);

const allowedClientIds = [
  process.env.SSO_CLIENT_ID,
  ...(process.env.SSO_ALLOWED_CLIENTS?.split(',') || []),
]
  .map(id => id.trim())
  .filter(Boolean);

async function integrationAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const accessToken = authHeader.slice(7);

    const { payload } = await jwtVerify(accessToken, jwks, {issuer,});

    const clientId = payload.azp || payload.client_id;

    if (!allowedClientIds.includes(clientId)) {
      return res.status(403).json({ error: 'Client is not authorized' });
    }

    req.tokenClaims = payload;
    next();
  } catch (error) {
    console.error('Integration auth failed:', error.message);

    return res.status(401).json({ error: 'Invalid access token' });
  }
}

module.exports = { integrationAuth };