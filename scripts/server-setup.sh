#!/bin/bash
# Athena VPS Server Setup
# Run this on a fresh Ubuntu 24.04 Hetzner VPS
# Usage: ./server-setup.sh https://github.com/username/athena.git

set -euo pipefail

REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: $0 <github-repo-url>"
  echo "Example: $0 https://github.com/janedoe/athena.git"
  exit 1
fi

echo "====================================="
echo "  Athena Server Setup"
echo "====================================="
echo ""
echo "Repo: $REPO_URL"
echo ""

# --- System updates ---
echo "[1/7] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# --- Install Node.js 22 LTS ---
echo "[2/7] Installing Node.js 22..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
echo "  Node $(node -v) installed"

# --- Install PM2 ---
echo "[3/7] Installing PM2..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2 --silent
fi
echo "  PM2 $(pm2 -v) installed"

# --- Install git (should already be there on Ubuntu) ---
echo "[4/7] Checking git..."
if ! command -v git &> /dev/null; then
  apt-get install -y -qq git
fi
echo "  git $(git --version | cut -d' ' -f3) installed"

# --- Create athena user and clone repo ---
echo "[5/7] Setting up athena user and cloning repo..."

# Create user if doesn't exist
if ! id -u athena &>/dev/null; then
  adduser --disabled-password --gecos "" athena
fi

# Clone repo as athena user
if [ ! -d /home/athena/athena ]; then
  su - athena -c "git clone $REPO_URL /home/athena/athena"
else
  echo "  Repo already exists at /home/athena/athena, pulling latest..."
  su - athena -c "cd /home/athena/athena && git pull origin main --ff-only"
fi

# Install bot dependencies
echo "[6/7] Installing bot dependencies..."
su - athena -c "cd /home/athena/athena/bot && npm install --silent"

# --- Set up cron jobs ---
echo "[7/7] Setting up cron jobs (sync + proactive scripts)..."

# Server auto-sync script
cat > /home/athena/server-sync.sh << 'SYNC'
#!/bin/bash
export PATH="/usr/bin:/usr/local/bin:$PATH"
ATHENA_DIR="/home/athena/athena"
cd "$ATHENA_DIR" || exit 1

# Pull remote changes (from Mac/VS Code)
git pull origin main --ff-only 2>/dev/null

# Push local changes (from Telegram bot)
if [ -n "$(git status --porcelain)" ]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    git add personal/ .claude/ decisions/ archives/ logs/
    git add bot/reminders.json 2>/dev/null
    if [ -n "$(git diff --cached --name-only)" ]; then
        git commit -m "Auto-save (server) $TIMESTAMP"
        git push origin main
    fi
fi
SYNC
chmod +x /home/athena/server-sync.sh
chown athena:athena /home/athena/server-sync.sh

# Set up cron jobs for athena user
CRON_CONTENT="# Athena auto-sync: every 60 seconds
* * * * * /home/athena/server-sync.sh >> /tmp/athena-server-sync.log 2>&1

# Athena proactive scripts: run every hour, scripts check timezone internally
0 * * * * cd /home/athena/athena && bash scripts/morning-briefing.sh >> /tmp/athena-morning-briefing.log 2>&1
0 * * * * cd /home/athena/athena && bash scripts/deadline-alert.sh >> /tmp/athena-deadline-alert.log 2>&1
0 * * * * cd /home/athena/athena && bash scripts/calendar-gap.sh >> /tmp/athena-calendar-gap.log 2>&1
0 */3 * * * cd /home/athena/athena && bash scripts/backlog-health.sh >> /tmp/athena-backlog-health.log 2>&1
0 * * * 0 cd /home/athena/athena && bash scripts/weekly-digest.sh >> /tmp/athena-weekly-digest.log 2>&1
"

echo "$CRON_CONTENT" | crontab -u athena -

# Set up PM2 to start on boot
su - athena -c "pm2 startup" 2>/dev/null || true
env PATH=$PATH:/usr/bin pm2 startup systemd -u athena --hp /home/athena 2>/dev/null || true

# Configure git for athena user (needed for auto-commits)
su - athena -c 'git config --global user.email "athena-bot@automated.local"'
su - athena -c 'git config --global user.name "Athena Bot"'

echo ""
echo "====================================="
echo "  Setup Complete"
echo "====================================="
echo ""
echo "Next steps:"
echo "  1. Create bot/.env with Telegram credentials:"
echo "     nano /home/athena/athena/bot/.env"
echo ""
echo "  2. Add these values:"
echo "     TELEGRAM_BOT_TOKEN=your_token"
echo "     TELEGRAM_USER_ID=your_id"
echo "     GROQ_API_KEY=your_key"
echo "     USER_NAME=FirstName"
echo "     ASSISTANT_NAME=Athena"
echo "     ATHENA_DIR=/home/athena/athena"
echo ""
echo "  3. Install and auth Claude Code:"
echo "     npm install -g @anthropic-ai/claude-code"
echo "     su - athena -c 'claude'"
echo ""
echo "  4. Start the bot:"
echo "     su - athena -c 'cd /home/athena/athena/bot && pm2 start bot.js --name athena-bot && pm2 save'"
echo ""
echo "  5. Test: send a Telegram message to your bot"
echo ""
