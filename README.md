# OAuth 2.0 flows

This repository contains an example implementation of the OAuth 2.0 authorization Protocol as described in the [OAuth 2.0 Authorization framework Specification](https://www.rfc-editor.org/rfc/rfc6749)

In OAuth 2.0 protocol, there are four parties that are involed - 
1. `Authorization Server`: Authorizes access
2. `Resource Server`: Server that has the protected resources
3. `Client`: A party that wants to access the protected resources
4. `Resource Owner`: The user who has some protected resource stored in the resource server

In this repo, I have implemented the `Authorization Server` as described in the specification. I have also added a `Client` app and a `Resource Server` to test the full flow.

To run this project,
1. install the dependecies first
```
cd <project-directory>
npm install
```
2. then run the three services in three different terminal tab/window
```
npm run resource-server                 # uses port 3000
npm run authorization-server            # uses port 3001
npm run client-app                      # uses port 3002
```

The OAuth 2.0 framework describes 4 grant types through which the authorization can happen - `authorization code grant`, `implicit grant`, `resource owner password grant` and `client credentials grant`.

The `client-app` in this project can collect access token through any of these 4 flows. Go to http://localhost:3002 in your browser and you will see a table with the four options and description of each flow.

For simplicity, I haven't used any database system. There is only one fixed user. This is the login credentials for that user,
```
username: me
password: password
```