const { randomUUID } = require("crypto");
const db = require("../dummyDB");
const {
  getRedirectUri,
  generateAccessToken,
  generateRefreshToken,
  checkIfValidScope,
} = require("../utils");

// Authorization Code Grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.1
const _handleAuthorizationCodeFlowStep1 = (req, res) => {
  const { scope, client_id, redirect_uri, state } = req.body;
  const redirectUrl = getRedirectUri(redirect_uri, client_id);
  const codeDetails = {
    code: randomUUID(),
    userId: req.session.user.id,
    expiresAt: new Date(new Date().getTime() + 10 * 60 * 1000), // expires in 10 minutes
    used: false,
    scope,
    client_id,
    redirect_uri,
  };
  db.codes.push(codeDetails);
  const code = codeDetails.code;
  return res.redirect(
    redirectUrl +
      (redirectUrl.includes("?") ? "&" : "?") +
      `code=${code}&state=${state}`
  );
};

const handleAuthorizationCodeFlowStep2 = (req, res) => {
  const { code, client_id, redirect_uri } = req.body;
  const codeDetails = db.codes.filter((c) => c.code === code)[0];

  if (
    !codeDetails ||
    codeDetails.client_id !== client_id ||
    codeDetails.expiresAt.getTime() < new Date().getTime() ||
    (code.redirect_uri && code.redirect_uri !== redirect_uri)
  ) {
    return res.status(400).json({ message: "invalid_grant" });
  }

  if (codeDetails.used) {
    // this is a breach. SHOULD remove all the access and refresh tokens associated with this code. https://www.rfc-editor.org/rfc/rfc6749#section-4.1.2 on description of 'code'
    // removing all the tokens associated with this code
    db.tokens = db.tokens.filter((token) => token.code !== code);
    db.refreshTokens = db.refreshTokens.filter((token) => token.code !== code);
    return res.status(400).json({ message: "invalid_grant" });
  }

  codeDetails.used = true;
  const accessTokenDetails = generateAccessToken(
    client_id,
    codeDetails.scope,
    codeDetails.userId,
    code
  );
  const refreshTokenDetails = generateRefreshToken(accessTokenDetails);

  return res.json({
    access_token: accessTokenDetails.token,
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: refreshTokenDetails.token,
  });
};

// Implicit Grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.2
const handleImplicitGrantFlow = (req, res) => {
  const { client_id, redirect_uri, scope, state } = req.body;
  const isScopeValid = checkIfValidScope(scope);

  if (!isScopeValid) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  const accessTokenDetails = generateAccessToken(
    client_id,
    scope,
    req.session.user.id
  );
  const redirectUrl = getRedirectUri(redirect_uri, client_id);

  res.redirect(
    redirectUrl +
      (redirectUrl.includes("?") ? "&" : "?") +
      `access_token=${accessTokenDetails.token}&token_type=bearer&expires_in=3600&scope=${scope}&state=${state}`
  );
};

// Resource Owner Password Credentials Grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.3
const handleResourceOwnerPasswordCredentialsFlow = (req, res) => {
  const { username, password, client_id, scope } = req.body;
  if (username !== "me" || password !== "password") {
    return res.status(400).json({ error: "invalid_request" });
  }

  const isScopeValid = checkIfValidScope(scope);
  if (!isScopeValid) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  const userId = "userid"; // hard-coded for simplicity
  const accessTokenDetails = generateAccessToken(client_id, scope, userId);
  const refreshTokenDetails = generateRefreshToken(accessTokenDetails);

  return res.status(200).json({
    access_token: accessTokenDetails.token,
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: refreshTokenDetails.token,
    scope,
  });
};

// Client Credentials Grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.4
const clientCredentialFlow = (req, res) => {
  const { client_id, scope } = req.body;

  const isScopeValid = checkIfValidScope(scope);
  if (!isScopeValid) {
    return res.status(400).json({ error: "invalid_scope" });
  }

  const accessTokenDetails = generateAccessToken(client_id, scope);

  return res.status(200).json({
    access_token: accessTokenDetails.token,
    token_type: "bearer",
    expires_in: 3600,
    scope,
  });
};

module.exports = {
  _handleAuthorizationCodeFlowStep1,
  handleAuthorizationCodeFlowStep2,
  handleImplicitGrantFlow,
  handleResourceOwnerPasswordCredentialsFlow,
  clientCredentialFlow,
};
