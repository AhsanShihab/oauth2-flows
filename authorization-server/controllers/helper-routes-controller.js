const { randomUUID } = require("crypto");
const db = require("../dummyDB");
const {
  _handleAuthorizationCodeFlowStep1,
  handleImplicitGrantFlow,
} = require("./flow-controllers");
const { getAppDetails, getRedirectUri } = require("../utils");

const registerClients = (req, res) => {
  const { app_name, description, client_type, redirect_urls } = req.body; // https://www.rfc-editor.org/rfc/rfc6749#section-3.1.2.2
  if (
    !app_name || // custom rquirement for this auth server
    !redirect_urls ||
    !Array.isArray(redirect_urls) || // can register multiple urls hence an array
    redirect_urls.legth === 0 ||
    !client_type
  ) {
    return res.status(400).json({ message: "bad payload" });
  }
  if (!["confidential", "public"].includes(client_type)) {
    // https://www.rfc-editor.org/rfc/rfc6749#section-2.1
    return res.status(400).json({ message: "client_type is invalid" });
  }
  const clientDetails = {
    clientId: randomUUID(),
    clientSecret: randomUUID(),
    clientType: client_type,
    appName: app_name,
    description: description, // can have additional fields
    redirectUrls: redirect_urls /*
																	The redirection endpoint URI MUST be an absolute URI as defined by
																	[RFC3986] Section 4.3.  The endpoint URI MAY include an
																	"application/x-www-form-urlencoded" formatted (per Appendix B) query
																	component ([RFC3986] Section 3.4), which MUST be retained when adding
																	additional query parameters.  The endpoint URI MUST NOT include a
																	fragment component.
																*/,
  };
  db.registeredClients.push(clientDetails);
  return res.status(201).json(clientDetails);
};

const handleLogin = (req, res) => {
  const { username, password } = req.body;
  // for simpliccity, the user is hard-coded
  if (username !== "me" || password !== "password") {
    return res.status(401).json({ message: "wrong username or password" });
  }
  req.session.user = { username: "me", id: "userid" };
  res.redirect(`/oauth2/Authorization?${req.headers.referer.split("?")[1]}`);
};

const getClientDetails = (req, res) => {
  const { clientId } = req.params;
  const clientDetails = getAppDetails(clientId);
  if (!clientDetails) return res.status(404).json({ message: "not found" });
  return res.status(200).json(clientDetails);
};

const handleAuthorizationConfirmation = (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ message: "user is logged out" });
  const { isAllowed, client_id, redirect_uri, scope, state, response_type } =
    req.body;
  const appDetails = getAppDetails(client_id);
  if (!appDetails) {
    return res
      .status(404)
      .json({ error: "invalid_client", error_description: "client not found" });
  }
  const redirectUrl = getRedirectUri(redirect_uri, client_id);
  if (!redirectUrl) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "invalid redirect url",
    });
  }
  if (!isAllowed) {
    return res.redirect(
      redirectUrl +
        (redirectUrl.includes("?") ? "&" : "?") +
        "error=access_denied"
    );
  }

  if (response_type === "code") {
    return _handleAuthorizationCodeFlowStep1(req, res);
  } else if (response_type === "token") {
    return handleImplicitGrantFlow(req, res);
  } else {
    return res.status(400).json({ error: "unsupported_response_type" });
  }
};

const verifyToken = (req, res) => {
  const { token } = req.params;
  const accessTokenDetails = db.tokens.filter(
    (tokenDetails) => tokenDetails.token === token
  )[0];
  if (!accessTokenDetails) {
    return res.status(404).json({ error: "token not found" });
  }
  if (accessTokenDetails.expiresAt < new Date().getTime()) {
    return res.status(401).json({ error: "token expired" });
  }
  return res.status(200).json(accessTokenDetails);
};

module.exports = {
  registerClients,
  handleLogin,
  getClientDetails,
  handleAuthorizationConfirmation,
  verifyToken,
};
