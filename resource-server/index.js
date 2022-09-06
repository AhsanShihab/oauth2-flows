const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { randomUUID } = require("crypto");

let protectedResource = [];

const requirePermision = (permission) => {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).end();
    }
    const [type, token] = authorization.split(" ");
    if (type.toLowerCase() !== "bearer") {
      return res.status(401).end();
    }
    try {
      const response = await axios.get(
        `http://localhost:3001/token/${token}/verification`
      );
      if (response.data.scope.split(" ").includes(permission)) return next();
      else
        return res
          .status(403)
          .json({ error: `${permission} permission needed` });
    } catch (err) {
      return res.status(401).json({ error: "invalid token" });
    }
  };
};

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} :: ${req.method} ${req.url}`);
  next();
});

app.get("/api/posts", requirePermision("read"), (req, res) => {
  res.json(protectedResource);
});

app.post("/api/posts", requirePermision("write"), (req, res) => {
  const post = req.body;
  post.id = randomUUID();
  protectedResource.push(post);
  res.json(post);
});

app.put("/api/posts/:id", requirePermision("write"), (req, res) => {
  const { id } = req.params;
  protectedResource = protectedResource.map((resource) =>
    resource.id === id ? { ...req.body, id } : resource
  );
  res.json({ ...req.body, id });
});

app.delete("/api/posts/:id", requirePermision("delete"), (req, res) => {
  const { id } = req.params;
  protectedResource = protectedResource.filter(
    (resource) => resource.id !== id
  );
  res.status(203).end();
});

app.listen(3000, () => console.log("resource-server running on port 3000"));
