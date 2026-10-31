# NEXUS AI — API Specification Reference

All endpoints (except `/api/auth/register` and `/api/auth/login`) require Bearer authentication:
```
Authorization: Bearer <ACCESS_TOKEN>
```

## 1. Authentication
- `POST /api/auth/register` - Create new admin or operator account
- `POST /api/auth/login` - Authenticate with email/password; returns access & refresh tokens
- `POST /api/auth/refresh` - Rotate expired access tokens
- `GET /api/auth/me` - Get authenticated profile

## 2. Servers & VPS Manager
- `GET /api/servers` - List registered VPS servers with real-time status
- `POST /api/servers/connect` - Connect VPS via SSH probe or Agent token
- `GET /api/servers/:id` - Get server details, specs, and telemetry history
- `DELETE /api/servers/:id` - Disconnect and remove VPS
- `GET /api/servers/:id/install-script` - Generate one-liner bash installer

## 3. Services & Telegram Bots
- `GET /api/services` - List discovered PM2, Docker, systemd, and bot processes
- `GET /api/services/:id` - Fetch single service metadata
- `POST /api/services/action` - Trigger `start`, `stop`, or `restart`
- `PATCH /api/services/:id` - Update labels, display name, or bot categorization
- `GET /api/services/:id/logs` - Fetch recent stdout/stderr snippets

## 4. AI Assistant & Natural Language Co-pilot
- `POST /api/ai/chat` - Process conversational command in English or Hinglish
- `POST /api/ai/confirm` - Confirm and execute structured action
- `GET /api/ai/providers` - Check status of Groq, Gemini, and OpenAI keys

## 5. Deployment Center & Terminal
- `GET /api/deployments` - List pipeline runs and statuses
- `POST /api/deployments` - Trigger build to VPS, Vercel, or Heroku
- `GET /api/deployments/:id` - Deployment logs and stage progress
- `POST /api/deployments/:id/rollback` - Rollback to previous build
- `GET /api/deployments/:id/ai-diagnose` - AI analysis of build failures

## 6. Integrations
- `GET /api/github/repos` - List connected GitHub repositories
- `GET /api/vercel/projects` - List Vercel deployments & domains
- `POST /api/vercel/redeploy` - Queue Vercel redeployment
- `GET /api/heroku/apps` - List Heroku dynos
- `POST /api/heroku/restart` - Restart Heroku dynos

## 7. Docker Manager
- `GET /api/docker/containers` - List containers
- `POST /api/docker/containers/:id/action` - Start, stop, or restart container
- `GET /api/docker/containers/:id/logs` - Stream container logs
- `GET /api/docker/images` - List cached images

## 8. File Manager
- `GET /api/files/list?path=<DIR>` - List authorized directory
- `GET /api/files/read?path=<FILE>` - Read text file
- `POST /api/files/write` - Save edited text file

## 9. VPS Terminal
- `POST /api/terminal/exec` - Execute allowlisted command safely

## 10. Monitoring & Logs
- `GET /api/monitoring/metrics` - Live and historical telemetry
- `GET /api/monitoring/alerts` - System threshold alerts
- `POST /api/monitoring/alerts/:id/ack` - Acknowledge alert
- `GET /api/monitoring/logs` - Unified daemon logs

## 11. Backups & Restore
- `GET /api/backups` - List archives
- `POST /api/backups` - Create new snapshot
- `POST /api/backups/:id/restore` - Restore snapshot to target directory

## 12. Security Center & Settings
- `GET /api/security/audit-logs` - View audit trail
- `GET /api/security/overview` - Posture score and active sessions
- `GET /api/settings` - User settings and provider keys
- `PATCH /api/settings` - Update default AI provider and alert thresholds
