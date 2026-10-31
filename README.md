# NEXUS AI — Enterprise VPS & Cloud Management Platform

<div align="center">
  <h3>Complete AI-Powered DevOps Orchestration for VPS, Telegram Bots, and Cloud Deployments</h3>
  <p>Full-Stack Production Architecture: Next.js (Vercel) + Express/Socket.IO (Ubuntu VPS) + MongoDB Atlas + Secure Agent</p>
</div>

---

## 🌟 Key Highlights

- **Vercel-Deployable Frontend**: Built with Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Recharts, and Lucide icons.
- **Ubuntu VPS Backend**: High-throughput Express + Socket.IO server with modular architecture across 20 production endpoints.
- **Outbound NEXUS VPS Agent**: Lightweight background telemetry daemon that connects outward to the backend, eliminating open root ports.
- **Provider-Independent AI Co-pilot**: Multi-model support for Groq (Llama 3.1 70B), Google Gemini (1.5/2.0), and OpenAI (GPT-4o).
- **English & Hinglish Natural Language Processing**: Understood commands like *"Mera Quiz Bot restart karo"*, *"Show CPU and RAM usage"*, and *"Show why my API crashed"*.
- **Interactive Action Safety Guard**: High-impact server commands require visual confirmation cards before execution.
- **Full Cloud & CI/CD Suite**: Integrated GitHub OAuth, Vercel deployments, Heroku dyno controls, Docker manager, live terminal, and file manager.

---

## 📁 Monorepo Structure

```
nexus-ai/
├── apps/
│   ├── frontend/         # Next.js 14 App Router (Tailwind, Framer Motion, Recharts)
│   ├── backend/          # Express.js, TypeScript, Socket.IO, MongoDB, SSH2
│   └── vps-agent/        # Lightweight VPS telemetry daemon
├── packages/
│   ├── shared/           # Zod validation schemas, AES-256-GCM crypto, constants
│   └── types/            # TypeScript interfaces for all system entities
├── docs/
│   ├── ARCHITECTURE.md       # Full architectural flow diagrams
│   ├── DEPLOYMENT_GUIDE.md   # Step-by-step Vercel + Ubuntu VPS + Nginx setup
│   ├── API_DOCUMENTATION.md  # Complete 20-module API endpoint reference
│   └── SECURITY_CHECKLIST.md # Security audit and compliance
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.agent
│   └── docker-compose.yml
├── scripts/
│   └── install-agent.sh  # Automated one-liner bash installer for Ubuntu VPS
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to respective app configs:
```bash
cp .env.example apps/backend/.env
cp .env.example apps/frontend/.env.local
```

### 3. Run Development Servers
```bash
# Run both Frontend (port 3000) and Backend (port 5000)
npm run dev

# Or run individually:
npm run dev:backend
npm run dev:frontend
npm run dev:agent
```

---

## 🔒 Security Guarantee
- Passwords hashed with bcrypt (salt 10)
- SSH credentials encrypted with AES-256-GCM
- Zero credentials or private keys passed to AI providers
- Sandboxed execution allowlists prevent destructive commands (`rm -rf /`, fork bombs)
- Path traversal guards prevent unauthorized file reads

---

## 📖 Complete Documentation
For detailed production setup with Nginx reverse proxy, Let's Encrypt HTTPS, and MongoDB Atlas, see [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).
