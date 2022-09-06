const path = require("path");
const { randomUUID } = require("crypto");
const db = require("../dummyDB");
const {
  handleAuthorizationCodeFlowStep2,
  handleResourceOwnerPasswordCredentialsFlow,
  clientCredentialFlow,
} = require("./flow-controllers");
const { getAppDetails, checkIfValidScope } = require("../utils");

const authorizationRequestHandler = (req, res) => {
  const { response_type, client_id, scope, state } = req.query;
  if (
    !response_type ||
    !client_id ||
    !scope // scope can be non-required, depends on the auth server's choice https://www.rfc-editor.org/rfc/rfc6749#section-3.3
  ) {
    return res.status(400).json({
      error: "invalid_request",
      error_description:
        "missing one or more required query params. required parameters: response_type, client_id, scope",
      state,
    });
  }

  const isScopeValid = checkIfValidScope(scope);
  if (!isScopeValid)
    return res.status(400).json({ error: "invalid_scope", state });

  const clientDetails = getAppDetails(client_id);
  if (!clientDetails)
    return res.status(400).json({
      error: "invalid_request",
      error_description: "client not found",
      state,
    });
  if (!["code", "token"].includes(response_type)) {
    // https://www.rfc-editor.org/rfc/rfc6749#section-3.1.1
    return res.status(400).json({ error: "unsupported_response_type", state });
  }

  if (!req.session.user)
    res.sendFile(path.join(__dirname, "..", "view", "login.html"));
  else res.sendFile(path.join(__dirname, "..", "view", "consent.html"));
};

const handleTokenRequest = (req, res) => {
  let { grant_type, client_id, refresh_token } = req.body; // For authorization code grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.1.3, for resource owner password grant: https://www.rfc-editor.org/rfc/rfc6749#section-4.3.2, from client credentials: https://www.rfc-editor.org/rfc/rfc6749#section-4.4.2

  // https://www.rfc-editor.org/rfc/rfc6749#section-6
  // client_id is not needed in the body in this case, so need to find it from the token,
  if (grant_type === "refresh_token") {
    const refreshTokenDetails = db.refreshTokens.filter(
      ({ token }) => token === refresh_token
    )[0];
    if (!refreshTokenDetails) {
      return res.status(400).json({ error: "invalid_request" });
    }
    client_id = refreshTokenDetails.clientId;
  }

  const clientDetails = getAppDetails(client_id);
  const authorization = req.headers.authorization; // https://www.rfc-editor.org/rfc/rfc6749#section-2.3.1

  if (
    !clientDetails ||
    !authorization ||
    authorization.split(" ")[0].toLowerCase() !== "basic" ||
    authorization.split(" ")[1] !== clientDetails.clientSecret
  )
    return res.status(401).json({ error: "invalid_client" });

  switch (grant_type) {
    case "authorization_code":
      return handleAuthorizationCodeFlowStep2(req, res);

    case "password":
      return handleResourceOwnerPasswordCredentialsFlow(req, res);

    case "client_credentials":
      return clientCredentialFlow(req, res);

    case "refresh_token":
      const refreshTokenDetails = db.refreshTokens.filter(
        ({ token }) => token === refresh_token
      )[0];
      scope = refreshTokenDetails.scope;
      const accessTokenDetails = {
        token: randomUUID(),
        clientId: client_id,
        userId: refreshTokenDetails.userId,
        scope: refreshTokenDetails.scope,
        expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000), // expires in 1 hour
      };
      refreshTokenDetails.token = randomUUID();
      db.tokens.push(accessTokenDetails);

      return res.status(200).json({
        access_token: accessTokenDetails.token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: refreshTokenDetails.token,
        scope,
      });

    default:
      res.status(400).json({ error: "unsupported_grant_type" });
  }
};

module.exports = {
  authorizationRequestHandler,
  handleTokenRequest,
};
