# Architecture Diagram

Incident Bridge version 1 is a single-instance local demo. The backend is authoritative for session
state, role visibility, votes, metrics, and progression. Clients send intentions and receive
filtered snapshots.

```mermaid
flowchart TD
    subgraph "Players"
        participant["Participant phones"]
        facilitator["Facilitator laptop"]
    end

    subgraph "Frontend"
        react["React + TypeScript + Vite"]
        routes["Facilitator and participant routes"]
        storage["Local token storage for refresh recovery"]
    end

    subgraph "Backend"
        api["FastAPI HTTP endpoints"]
        ws["FastAPI WebSocket lobby updates"]
        sessions["In-memory SessionManager"]
        engine["Scenario-driven game engine"]
        filters["Role and facilitator snapshot filtering"]
    end

    subgraph "Content"
        scenario["Validated Friday Pay Run JSON"]
        validator["Pydantic scenario validation"]
    end

    participant --> react
    facilitator --> react
    react --> routes
    routes -->|"create, join, role, start, vote, advance, reconnect"| api
    routes -->|"subscribe to live lobby updates"| ws
    api --> sessions
    ws --> sessions
    sessions --> engine
    engine --> scenario
    validator --> scenario
    sessions --> filters
    filters -->|"role-appropriate snapshots"| routes
```

## Version 1 Boundaries

- Active sessions are in memory and are lost on backend restart.
- One backend instance owns all live state.
- Scenario content is data, not executable code.
- No database, account system, runtime AI, chat, leaderboard, or long-term analytics.
- Multi-device rehearsal should use a temporary tunnel or a trusted local network route.
