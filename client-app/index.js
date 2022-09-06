const express = require("express");
const axios = require("axios");
const cors = require("cors");

const CLIENT_ID = "5bcae47d-c91a-478d-b205-196efe11c9e0";
const CLIENT_SECRET = "c7669b18-60a7-48b6-9d43-8aa2c25d086d";

const AUTH_SERVER_BASE_URL = "http://localhost:3001/oauth2";
const RESOURCE_SERVER_BASE_URL = "http://localhost:3000/api";

// for simplicity, just holding one access_token and refresh token.
// ofcourse in a real app, these tokens will be mapped to the corresponding user and used accordingly
let accessToken = null;
let refreshToken = null;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} :: ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/view/index.html");
});

app.get("/authorization-code-flow", (req, res) => {
  const url = `${AUTH_SERVER_BASE_URL}/authorization?client_id=${CLIENT_ID}&response_type=code&scope=${req.query.scope}`;
  res.redirect(url);
});

app.get("/implicit-grant-flow", (req, res) => {
  const url = `${AUTH_SERVER_BASE_URL}/authorization?client_id=${CLIENT_ID}&response_type=token&scope=${req.query.scope}`;
  res.redirect(url);
});

app.post("/resource-owner-password-credential-flow", async (req, res) => {
  const { username, password, scope } = req.body;
  try {
    const response = await axios.post(
      "http://localhost:3001/oauth2/token",
      {
        grant_type: "password",
        client_id: CLIENT_ID,
        username,
        password,
        scope,
      },
      {
        headers: {
          Authorization: `Basic ${CLIENT_SECRET}`,
        },
      }
    );
    const { access_token, refresh_token } = response.data;
    accessToken = access_token;
    refreshToken = refresh_token;
    return res.redirect("/success");
  } catch (err) {
    res.redirect(`/failed?error=${err.response?.data.error}`);
  }
});

app.get("/client-credentials-flow", async (req, res) => {
  try {
    const response = await axios.post(
      `${AUTH_SERVER_BASE_URL}/token`,
      {
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        scope: req.query.scope,
      },
      {
        headers: {
          Authorization: `Basic ${CLIENT_SECRET}`,
        },
      }
    );
    const { access_token } = response.data;
    accessToken = access_token;
    refreshToken = null;
    return res.redirect("/success");
  } catch (err) {
    res.redirect(`/failed?error=${err.response?.data.error}`);
  }
});

app.get("/oauth2/callback", async (req, res) => {
  const { error, state, code, access_token } = req.query;
  if (error) return res.sendFile(__dirname + "/view/unsuccessful.html");
  if (code) {
    try {
      const response = await axios.post(
        `${AUTH_SERVER_BASE_URL}/token`,
        {
          grant_type: "authorization_code",
          client_id: CLIENT_ID,
          code,
        },
        {
          headers: {
            Authorization: `Basic ${CLIENT_SECRET}`,
          },
        }
      );
      const { access_token, refresh_token } = response.data;
      accessToken = access_token;
      refreshToken = refresh_token;
      return res.redirect("/success");
    } catch (err) {
      res.redirect(`/failed?error=${err.response?.data.error}`);
    }
  } else if (access_token) {
    accessToken = access_token;
    refreshToken = null;
    return res.sendFile(__dirname + "/view/successful.html");
  }
});

app.get("/success", async (req, res) => {
  return res.sendFile(__dirname + "/view/successful.html");
});

app.get("/failed", async (req, res) => {
  return res.sendFile(__dirname + "/view/unsuccessful.html");
});

app.get("/posts", async (req, res) => {
  try {
    const response = await axios.get(`${RESOURCE_SERVER_BASE_URL}/posts`, {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    });
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(err.response.status || 500).json(err.response.data);
  }
});

app.post("/posts", async (req, res) => {
  try {
    const response = await axios.post(
      `${RESOURCE_SERVER_BASE_URL}/posts`,
      { ...req.body },
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
        },
      }
    );
    return res.status(201).json(response.data);
  } catch (err) {
    return res.status(err.response.status || 500).json(err.response.data);
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const response = await axios.delete(
      `${RESOURCE_SERVER_BASE_URL}/posts/${req.params.id}`,
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
        },
      }
    );
    return res.status(203).end();
  } catch (err) {
    return res.status(err.response.status || 500).json(err.response.data);
  }
});

app.listen(3002, () => console.log("third-party-app running on port 3002"));
