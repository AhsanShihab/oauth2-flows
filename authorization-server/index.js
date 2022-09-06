const express = require("express");
const session = require("express-session");
const cors = require('cors')

const oAuthRoutes = require("./routes/oauth2-routes");
const helperRoutes = require("./routes/helper-routes");

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: "very secret",
  })
);

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} :: ${req.method} ${req.url}`)
    next()
})

app.use('/', oAuthRoutes); // must have routes according to the specification: https://www.rfc-editor.org/rfc/rfc6749#section-3
app.use('/', helperRoutes); // other routes I needed for my implementation

app.listen(3001, () =>
  console.log("authorization-server running on port 3001")
);
