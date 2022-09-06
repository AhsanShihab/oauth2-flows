const db = require("./dummyDB");
const { randomUUID } = require("crypto");

const getAppDetails = (clientId) => {
  const appDetails = db.registeredClients.filter(
    (client) => client.clientId === clientId
  )[0];

  return appDetails;
};

const getRedirectUri = (redirectUriInQueryParam, clientId) => {
  const appDetails = getAppDetails(clientId);
  const redirectUrl = redirectUriInQueryParam
    ? appDetails.redirectUrls.filter(
        (url) => url === redirectUriInQueryParam
      )[0]
    : appDetails.redirectUrls[0];

  return redirectUrl;
};

const generateAccessToken = (clientId, scope, userId, code) => {
  const accessTokenDetails = {
    token: randomUUID(),
    expiresAt: new Date(new Date().getTime() + 60 * 60 * 1000), // expires in 1 hour
    clientId: clientId,
    scope,
    userId,
    code,
  };
  db.tokens.push(accessTokenDetails);
  return accessTokenDetails;
};

const generateRefreshToken = (accessTokenDetails) => {
  const { expiresAt, ...refreshTokenDetails } = accessTokenDetails;
  refreshTokenDetails.token = randomUUID();
  db.refreshTokens.push(refreshTokenDetails);
  return refreshTokenDetails;
};

const checkIfValidScope = (scope) => {
  const VALID_SCOPES = ["read", "write", "delete"];
  const scopes = scope.split(" ");
  for (let sc of scopes) {
    if (!VALID_SCOPES.includes(sc)) {
      return false;
    }
  }
  return true;
}

module.exports = {
  getAppDetails,
  getRedirectUri,
  generateAccessToken,
  generateRefreshToken,
  checkIfValidScope,
};
