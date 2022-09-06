const { Router } = require("express");
const oauth2Controller = require('../controllers/oauth2-routes-controller')

const router = Router();

// https://www.rfc-editor.org/rfc/rfc6749#section-3
router.get("/oauth2/authorization", oauth2Controller.authorizationRequestHandler); // must support 'GET', may support 'POST'
router.post("/oauth2/token", oauth2Controller.handleTokenRequest); // should be protected against brute force attack


module.exports = router;
