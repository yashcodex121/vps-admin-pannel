# NEXUS AI — System Architecture Specification

## 1. High-Level Architecture Overview

```
                      +-----------------------------+
                      |       Next.js Frontend      |
                      |     (Hosted on Vercel)      |
                      +--------------+--------------+
                                     |
               HTTPS REST API        |        WSS WebSockets
            (NEXT_PUBLIC_API_URL)    |     (NEXT_PUBLIC_WS_URL)
                                     v
                      +-----------------------------+
                      |      Nginx Reverse Proxy    |
                      |   (Ubuntu VPS - Port 443)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   NEXUS AI Backend Server   |
                      |    (Node.js / Express / IO) |
                      +-------+-------------+-------+
                              |             |
           +------------------+             +------------------+
           |                                                   |
           v                                                   v
+---------------------+                             +---------------------+
|    MongoDB Atlas    |                             |   AI Adapter Layer  |
| (Database Cluster)  |                             | Groq | Gemini | GPT |
+---------------------+                             +---------------------+
                                     ^
                                     | Outbound TLS WebSocket
                                     | (/agent namespace)
                      +--------------+--------------+
                      |       NEXUS VPS Agent       |
                      |   (User Ubuntu VPS Daemon)  |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
      +--------------+        +--------------+        +--------------+
      |  PM2 & Bots  |        |    Docker    |        |   Systemd    |
      | (Quiz Bot)   |        |  Containers  |        |   Services   |
      +--------------+        +--------------+        +--------------+
```

## 2. Key Architectural Guarantees

1. **Decoupled Frontend & Backend**:
   - The frontend is an independent Next.js single-page application configured with runtime environment variables `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
   - The backend runs permanently on the user's Ubuntu VPS, maintaining long-lived telemetry collectors and WebSocket dispatchers.

2. **Secure Outbound VPS Agent**:
   - The VPS agent initiates an **outbound** persistent WebSocket connection to the backend.
   - The user's VPS does **not** need to open public inbound SSH ports to the public internet or expose the raw Docker daemon socket.
   - Commands are strictly filtered against an allowlist (`pm2`, `docker`, `systemctl`, `uptime`, `df`, `free`, `ps`, `cat`).

3. **Multi-Model Provider-Independent AI**:
   - The AI assistant uses an abstracted engine supporting Groq (Llama 3.1), Google Gemini (1.5 Flash/Pro), and OpenAI (GPT-4o).
   - Natural language commands in **English or Hinglish** ("Mera Quiz Bot restart karo", "Show CPU and RAM usage") are parsed into structured intent actions.
   - High-impact operations (restarting services, stopping servers, deployments) require explicit visual user confirmation in the UI.
   - **Zero Secrets Leakage**: Credentials and private keys are never passed to AI prompts.
