# NEXUS AI — Production Deployment Guide

This guide provides end-to-end instructions for deploying NEXUS AI across:
- **Frontend**: Vercel
- **Backend**: Ubuntu 24.04 LTS VPS (with Nginx & Let's Encrypt HTTPS)
- **Database**: MongoDB Atlas
- **Daemon**: NEXUS VPS Agent

---

## 1. Local Development Setup

### Prerequisites
- Node.js 20+ installed
- Git installed

### Clone and Install Dependencies
```bash
git clone https://github.com/your-org/nexus-ai.git
cd nexus-ai

# Install root and workspace dependencies
npm install
```

### Running Backend Locally
```bash
npm run dev --workspace=backend
# Backend runs on http://localhost:5000
```

### Running Frontend Locally
```bash
npm run dev --workspace=frontend
# Frontend runs on http://localhost:3000
```

### Running VPS Agent Locally (for testing)
```bash
npm run dev --workspace=vps-agent
```

---

## 2. MongoDB Atlas Configuration

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Security > Database Access**, create a user `nexus_user` with read/write permissions.
3. Under **Security > Network Access**, add the IP address of your Ubuntu VPS (or `0.0.0.0/0` with secure password).
4. Under **Database > Connect**, copy the SRV URI:
   ```
   mongodb+srv://nexus_user:<PASSWORD>@cluster0.abcde.mongodb.net/nexus_ai?retryWrites=true&w=majority
   ```
5. Paste this URI into `apps/backend/.env` under `MONGODB_URI`.

---

## 3. Ubuntu VPS Backend Deployment (api.yourdomain.com)

### Step 1: Provision Node.js on Ubuntu 24.04
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential nginx

# Install PM2 process manager
sudo npm install -g pm2
```

### Step 2: Clone and Build Backend
```bash
sudo mkdir -p /var/www/nexus-ai
sudo chown -R $USER:$USER /var/www/nexus-ai
cd /var/www/nexus-ai

git clone https://github.com/your-org/nexus-ai.git .
npm install

# Build shared types and backend
npm run build --workspace=@nexus/types
npm run build --workspace=@nexus/shared
npm run build --workspace=backend
```

### Step 3: Configure Production `.env`
Create `/var/www/nexus-ai/apps/backend/.env`:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://nexus_user:YOUR_PASSWORD@cluster0.abcde.mongodb.net/nexus_ai?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_32_character_crypto_random_secret_here
JWT_REFRESH_SECRET=your_32_character_crypto_random_secret_here
FRONTEND_ORIGIN=https://nexus.yourdomain.com
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Multi-Model AI Keys
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=AIzaSy_your_gemini_key
OPENAI_API_KEY=sk-proj-your_openai_key
DEFAULT_AI_PROVIDER=groq
```

### Step 4: Start Backend with PM2
```bash
cd /var/www/nexus-ai/apps/backend
pm2 start dist/server.js --name nexus-backend
pm2 save
pm2 startup
```

---

## 4. Nginx Reverse Proxy & Let's Encrypt HTTPS

Create Nginx site configuration `/etc/nginx/sites-available/nexus-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for persistent agent sockets
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and install Certbot SSL:
```bash
sudo ln -s /etc/nginx/sites-available/nexus-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 5. Frontend Deployment to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import your repository.
3. Configure the Project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
4. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_WS_URL`: `https://api.yourdomain.com`
5. Click **Deploy**. Vercel will build and assign your production domain (`https://nexus.yourdomain.com`).

---

## 6. Installing the NEXUS VPS Agent

On any VPS you wish to monitor (including the host VPS or additional server instances):

Run the one-liner installer provided by your backend:
```bash
curl -sSL https://api.yourdomain.com/install-agent.sh | sudo bash -s -- \
  --backend "https://api.yourdomain.com" \
  --server "<SERVER_ID_FROM_DASHBOARD>" \
  --token "<AGENT_TOKEN_FROM_DASHBOARD>"
```

Verify agent daemon status:
```bash
sudo systemctl status nexus-agent
journalctl -u nexus-agent -f
```

The server will automatically display as **ONLINE** in your NEXUS AI dashboard with live CPU, RAM, disk, and process telemetry streaming.
