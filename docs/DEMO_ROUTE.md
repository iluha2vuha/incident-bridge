# Demo Route

Incident Bridge needs both the frontend and backend reachable from participant phones. A phone
cannot use `127.0.0.1` or `localhost` from the facilitator laptop because those addresses point
back to the phone itself.

## Recommended First Demo Route

Use a temporary HTTPS tunnel such as Cloudflare Tunnel for the first real-device rehearsal. This is
usually simpler than debugging venue Wi-Fi, guest-network isolation, or firewall rules during a
facilitated exercise.

Suggested shape:

1. Start the backend on the facilitator laptop:

   ```sh
   INCIDENT_BRIDGE_PUBLIC_FRONTEND_URL=https://YOUR-FRONTEND-TUNNEL.example \
   INCIDENT_BRIDGE_CORS_ORIGINS=https://YOUR-FRONTEND-TUNNEL.example \
   make backend-dev
   ```

2. Start the frontend with a backend URL reachable by phones:

   ```sh
   VITE_INCIDENT_BRIDGE_API_URL=https://YOUR-BACKEND-TUNNEL.example make frontend-dev
   ```

3. Expose the frontend and backend with tunnel URLs that map to local ports:

   ```sh
   cloudflared tunnel --url http://127.0.0.1:5173
   cloudflared tunnel --url http://127.0.0.1:8000
   ```

4. Create a session from the tunneled frontend URL.
5. Confirm the facilitator lobby shows a QR code and a join URL using the frontend tunnel.
6. Scan the QR code from at least one phone before rehearsal starts.

Use the tunnel URLs only for temporary rehearsal/demo sessions. Do not treat this as production
hosting.

## Secondary Demo Route

Use a local private network only if the tunnel route is unavailable or internet access is
unreliable.

1. Put the facilitator laptop and participant phones on the same trusted Wi-Fi or phone hotspot.
2. Find the laptop LAN IP, for example `192.168.1.25`.
3. Start the backend on all interfaces:

   ```sh
   INCIDENT_BRIDGE_PUBLIC_FRONTEND_URL=http://192.168.1.25:5173 \
   INCIDENT_BRIDGE_CORS_ORIGINS=http://192.168.1.25:5173 \
   cd backend && python3 -m uvicorn incident_bridge.app:app --reload --host 0.0.0.0 --port 8000
   ```

4. Start the frontend on all interfaces:

   ```sh
   VITE_INCIDENT_BRIDGE_API_URL=http://192.168.1.25:8000 \
   npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173
   ```

5. Open `http://192.168.1.25:5173/facilitator/create` on the facilitator laptop.
6. Scan the generated QR code from a phone.

If phones cannot connect, the likely causes are client isolation on the Wi-Fi, macOS firewall
prompts, or using the wrong laptop IP.

## Rehearsal Checklist

- Create a quick-mode room.
- Join from at least two phones using the QR code.
- Confirm HR and IT Helpdesk can both choose roles.
- Open, vote, lock, reveal, and advance through all quick-mode rounds.
- Refresh one participant phone during a round and confirm it restores the session.
- Refresh the facilitator view and confirm it restores the session.
- End the room and confirm late joins are rejected.
