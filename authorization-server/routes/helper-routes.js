const { Router } = require("express");
const helperRoutesController = require('../controllers/helper-routes-controller')

const router = Router();

router.post("/login", helperRoutesController.handleLogin);
router.get("/clients/:clientId", helperRoutesController.getClientDetails);
router.post("/oauth2/authorization/consent", helperRoutesController.handleAuthorizationConfirmation);

// https://www.rfc-editor.org/rfc/rfc6749#section-2
router.post("/clients", helperRoutesController.registerClients);

// https://www.rfc-editor.org/rfc/rfc6749#section-7
router.get("/token/:token/verification", helperRoutesController.verifyToken);

module.exports = router;
