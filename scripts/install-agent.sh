#!/usr/bin/env bash
# ========================================================
# NEXUS AI — VPS TELEMETRY & MANAGEMENT AGENT INSTALLER
# ========================================================
set -e

echo "🚀 Installing NEXUS AI VPS Agent on Linux..."

BACKEND_URL="http://localhost:5000"
SERVER_ID=""
AGENT_TOKEN=""

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --backend) BACKEND_URL="$2"; shift ;;
    --server) SERVER_ID="$2"; shift ;;
    --token) AGENT_TOKEN="$2"; shift ;;
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

if [ -z "$SERVER_ID" ] || [ -z "$AGENT_TOKEN" ]; then
  echo "❌ Error: Missing required arguments."
  echo "Usage: sudo bash install-agent.sh --backend <URL> --server <SERVER_ID> --token <TOKEN>"
  exit 1
fi

# Ensure Node.js is installed
if ! command -v node &> /dev/null; then
  echo "📦 Node.js not detected. Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Create agent installation directory
INSTALL_DIR="/opt/nexus-agent"
sudo mkdir -p "$INSTALL_DIR"
sudo chown -R root:root "$INSTALL_DIR"

cat << EOF | sudo tee /etc/systemd/system/nexus-agent.service > /dev/null
[Unit]
Description=NEXUS AI VPS Agent Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment=NEXUS_BACKEND_URL=$BACKEND_URL
Environment=NEXUS_SERVER_ID=$SERVER_ID
Environment=NEXUS_AGENT_TOKEN=$AGENT_TOKEN
Environment=NEXUS_METRICS_INTERVAL=3000
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nexus-agent
echo "✅ NEXUS Agent service created and enabled."
echo "🔹 Server ID: $SERVER_ID"
echo "🔹 Target: $BACKEND_URL"
