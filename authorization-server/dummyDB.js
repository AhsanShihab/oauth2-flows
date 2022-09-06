const registeredClients = [
    {
        "clientId": "5bcae47d-c91a-478d-b205-196efe11c9e0",
        "clientSecret": "c7669b18-60a7-48b6-9d43-8aa2c25d086d",
        "clientType": "confidential",
        "appName": "A Fishy App",
        "redirectUrls": [
            "http://localhost:3002/oauth2/callback"
        ]
    }
]
const codes = []
const tokens = []
const refreshTokens = []

module.exports = {
    refreshTokens,
    codes,
    tokens,
    registeredClients
}