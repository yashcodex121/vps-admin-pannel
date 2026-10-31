# NEXUS AI — Production Security Checklist

- [x] **Zero Plaintext Credentials**: SSH private keys, passwords, and cloud tokens are encrypted with AES-256-GCM using `ENCRYPTION_KEY` before database insertion.
- [x] **AI Model Privacy Guard**: No SSH keys, passwords, database URIs, or server credentials are ever passed into LLM prompt contexts.
- [x] **Strict Action Confirmation**: Destructive operations (stopping services, rebooting servers, deployments) require interactive user approval.
- [x] **Outbound-Only VPS Agent**: The agent connects outward to the backend over WSS. No public inbound root shell or unprotected raw Docker sockets are exposed.
- [x] **Command Allowlist**: Terminal and agent commands are restricted against destructive patterns (`rm -rf /`, fork bombs, raw drive writes).
- [x] **Path Traversal Protection**: File manager strictly prevents directory traversal (`../` escapes) and scopes access to authorized directories (`/home`, `/var/www`, `/etc/nginx`, `/opt`).
- [x] **Audit Trail Ledger**: All user logins, server connections, file modifications, and AI action executions are appended to the immutable audit log.
- [x] **JWT Security**: Access tokens expire in 15 minutes with cryptographic HMAC-SHA256 signature verification.
- [x] **CORS & Helmet**: Helmet headers and strict CORS origin controls configured on all backend API routes.
