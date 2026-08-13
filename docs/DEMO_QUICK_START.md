# Demo Quick Start

Use this when you want to try Incident Bridge from a facilitator laptop and one or more phones.

## 1. Install Tunnel Tool

```sh
brew install cloudflared
```

If it is already installed, this is enough:

```sh
cloudflared --version
```

## 2. Start Two Tunnels

In one terminal:

```sh
cloudflared tunnel --url http://127.0.0.1:5173
```

In another terminal:

```sh
cloudflared tunnel --url http://127.0.0.1:8000
```

Copy both `https://...trycloudflare.com` URLs. The `5173` URL is the frontend URL. The `8000`
URL is the backend URL.

## 3. Start Backend

Replace `FRONTEND_TUNNEL_URL` with the `5173` tunnel URL:

```sh
INCIDENT_BRIDGE_PUBLIC_FRONTEND_URL=FRONTEND_TUNNEL_URL \
INCIDENT_BRIDGE_CORS_ORIGINS=FRONTEND_TUNNEL_URL \
make backend-dev
```

## 4. Start Frontend

Replace `BACKEND_TUNNEL_URL` with the `8000` tunnel URL:

```sh
VITE_INCIDENT_BRIDGE_API_URL=BACKEND_TUNNEL_URL make frontend-dev
```

## 5. Try It

Open the frontend tunnel URL on the facilitator laptop:

```text
FRONTEND_TUNNEL_URL/facilitator/create
```

Create a quick-mode room, scan the lobby QR code from a phone, join with a fictional nickname, pick
a role, and play through the rounds.

## Stop

Press `Ctrl+C` in the frontend, backend, and both tunnel terminals.

Use fictional data only. Quick tunnels are public temporary demo links, not production hosting.
