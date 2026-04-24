#!/bin/bash
# ──────────────────────────────────────────────────────
# Athena Setup — Run once after cloning.
# Gets your machine ready so Athena can do her thing.
# ──────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ISSUES=0
WARNINGS=0

echo ""
echo -e "${BOLD}Athena Setup${NC}"
echo "Getting your machine ready. This takes about 2 minutes."

# ── 1. Prerequisites ─────────────────────────────────
echo ""
echo -e "${BOLD}Checking prerequisites...${NC}"
echo ""

# Claude Code
if command -v claude &> /dev/null; then
    ok "Claude Code installed"
else
    fail "Claude Code not found"
    echo ""
    echo "    Install it by pasting this into your terminal:"
    echo ""
    echo "      curl -fsSL https://claude.ai/install.sh | bash"
    echo ""
    echo "    Then run this setup script again."
    ISSUES=$((ISSUES + 1))
fi

# Node.js (needed for Telegram bot, not required for core)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        ok "Node.js $(node -v)"
    else
        warn "Node.js $(node -v) found, but v20+ is needed for the Telegram bot"
        echo "    Update: https://nodejs.org"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    warn "Node.js not found (only needed if you want Athena on your phone via Telegram)"
    WARNINGS=$((WARNINGS + 1))
fi

# Python 3 (needed for long-term memory)
if command -v python3 &> /dev/null; then
    ok "Python 3 ($(python3 --version 2>&1 | cut -d' ' -f2))"
else
    warn "Python 3 not found (only needed for long-term memory)"
    echo "    Install: brew install python3 (Mac) or https://python.org"
    WARNINGS=$((WARNINGS + 1))
fi

# ── 2. Long-term memory ──────────────────────────────
echo ""
echo -e "${BOLD}Setting up long-term memory...${NC}"
echo ""

MEMPALACE_INSTALLED=false

if command -v mempalace-mcp &> /dev/null 2>&1; then
    ok "MemPalace already installed"
    MEMPALACE_INSTALLED=true
elif python3 -c "import mempalace" 2>/dev/null; then
    ok "MemPalace already installed"
    MEMPALACE_INSTALLED=true
elif command -v python3 &> /dev/null; then
    # Try pipx first (cleanest on modern macOS)
    if command -v pipx &> /dev/null; then
        echo "  Installing long-term memory (mempalace) via pipx..."
        if pipx install mempalace &> /dev/null 2>&1; then
            ok "MemPalace installed via pipx"
            MEMPALACE_INSTALLED=true
        else
            warn "Auto-install failed"
        fi
    fi

    # Fallback: pip with --user
    if [ "$MEMPALACE_INSTALLED" = false ]; then
        echo "  Trying pip install..."
        if pip3 install --user mempalace &> /dev/null 2>&1; then
            ok "MemPalace installed via pip"
            MEMPALACE_INSTALLED=true
        elif python3 -m pip install --user mempalace &> /dev/null 2>&1; then
            ok "MemPalace installed via python3 -m pip"
            MEMPALACE_INSTALLED=true
        else
            warn "Could not install MemPalace automatically"
            echo ""
            echo "    Try one of these manually:"
            echo "      pipx install mempalace"
            echo "      python3 -m pip install --user mempalace"
            echo ""
            echo "    This is optional. Athena works without it,"
            echo "    she just won't remember things between sessions."
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    warn "Skipping (Python 3 not found)"
    WARNINGS=$((WARNINGS + 1))
fi

# ── 3. MCP config (baseline: mempalace, calendar, notion, gmail) ─────────────
echo ""
echo -e "${BOLD}Setting up tool connections...${NC}"
echo ""

MCP_FILE="$SCRIPT_DIR/.mcp.json"
MCP_TEMPLATE="$SCRIPT_DIR/.mcp.json.template"

if [ -f "$MCP_FILE" ]; then
    ok ".mcp.json already exists (existing config preserved — edit manually to change)"
    SKIP_OPTIONAL_MCPS=true
elif [ -f "$MCP_TEMPLATE" ]; then
    cp "$MCP_TEMPLATE" "$MCP_FILE"
    ok "Created .mcp.json with baseline servers (mempalace, calendar, notion, gmail)"
    SKIP_OPTIONAL_MCPS=false
else
    cat > "$MCP_FILE" << 'MCPEOF'
{
  "mcpServers": {}
}
MCPEOF
    ok "Created empty .mcp.json"
    SKIP_OPTIONAL_MCPS=false
fi

# ── 4. bot/.env ──────────────────────────────────────────────────────────────
BOT_ENV="$SCRIPT_DIR/bot/.env"
BOT_ENV_EXAMPLE="$SCRIPT_DIR/bot/.env.example"
if [ ! -f "$BOT_ENV" ] && [ -f "$BOT_ENV_EXAMPLE" ]; then
    cp "$BOT_ENV_EXAMPLE" "$BOT_ENV"
    ok "Created bot/.env from example"
fi

# Helper — only prompt if we created .mcp.json fresh AND running interactively.
INTERACTIVE=true
if [ ! -t 0 ]; then
    INTERACTIVE=false
fi

ask_yn() {
    # $1 = prompt, $2 = default (y or n). Echoes "y" or "n".
    local default="$2"
    local reply
    local suffix="[y/N]"
    if [ "$default" = "y" ]; then suffix="[Y/n]"; fi
    if [ "$INTERACTIVE" = false ]; then
        echo "$default"
        return
    fi
    read -r -p "$1 $suffix: " reply
    reply=${reply:-$default}
    case "$reply" in
        y|Y|yes|YES) echo "y" ;;
        *) echo "n" ;;
    esac
}

# Inject a server block into .mcp.json using python3 (most reliable JSON edit).
# Args: $1 = server name, $2 = JSON blob for server config.
add_mcp_server() {
    local name="$1"
    local config="$2"
    if ! command -v python3 &> /dev/null; then
        warn "python3 not available — can't edit .mcp.json automatically. Add '$name' manually."
        return 1
    fi
    python3 - "$MCP_FILE" "$name" "$config" << 'PYEOF'
import json, sys
path, name, cfg = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    data = json.load(f)
data.setdefault("mcpServers", {})[name] = json.loads(cfg)
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PYEOF
}

set_env_var() {
    # $1 = key, $2 = value. Appends or replaces in bot/.env.
    local key="$1"
    local value="$2"
    if [ ! -f "$BOT_ENV" ]; then return; fi
    if grep -q "^${key}=" "$BOT_ENV"; then
        # Replace existing line (BSD sed on macOS needs '' after -i)
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$BOT_ENV"
    else
        echo "${key}=${value}" >> "$BOT_ENV"
    fi
}

if [ "$SKIP_OPTIONAL_MCPS" = true ]; then
    ok "Skipping optional-tool prompts (existing .mcp.json preserved)"
else
    echo ""
    echo -e "${BOLD}Optional powerful tools — pick what you want enabled${NC}"
    echo ""
    echo "Each has real capabilities and real risks. Default is NO for all three."
    echo "You can change your mind later by editing .mcp.json and bot/.env."
    echo ""

    # ── 4a. Filesystem MCP ────────────────────────────────────────────────────
    echo -e "${BOLD}Filesystem access${NC}  (read/write files on your computer under an allowlist)"
    echo ""
    echo "  Enables:"
    echo "    - \"Read that PDF on my Desktop and summarize it\""
    echo "    - \"Save this screenshot to Downloads\""
    echo "    - \"Edit this CSV for me\""
    echo ""
    echo -e "  ${YELLOW}Risk:${NC}"
    echo "    - Athena can read/write any file under the allowlist you set."
    echo "    - If the allowlist covers folders with secrets or financial docs,"
    echo "      Athena can read those too. Scope tightly."
    echo ""
    FS_ANSWER=$(ask_yn "  Enable filesystem access?" "n")

    if [ "$FS_ANSWER" = "y" ]; then
        DEFAULT_ALLOWED="$HOME/Desktop:$HOME/Documents:$HOME/Downloads"
        if [ "$INTERACTIVE" = true ]; then
            echo ""
            echo "  Allowed directories (colon-separated absolute paths)."
            echo "  Default: $DEFAULT_ALLOWED"
            read -r -p "  Custom, or ENTER for default: " FS_ALLOWED
            FS_ALLOWED="${FS_ALLOWED:-$DEFAULT_ALLOWED}"
        else
            FS_ALLOWED="$DEFAULT_ALLOWED"
        fi

        FS_CONFIG='{"command":"npx","args":["tsx","./bot/src/fs-mcp/server.ts"],"env":{}}'
        add_mcp_server "filesystem" "$FS_CONFIG"
        set_env_var "ATHENA_FS_ALLOWED" "$FS_ALLOWED"
        ok "Filesystem MCP enabled. Allowed: $FS_ALLOWED"
    else
        ok "Filesystem access: OFF"
    fi

    # ── 4b. Playwright MCP ────────────────────────────────────────────────────
    echo ""
    echo -e "${BOLD}Playwright browser${NC}  (headless browser automation)"
    echo ""
    echo "  Enables:"
    echo "    - \"Research X and summarize the top 5 results\""
    echo "    - \"Take a screenshot of this URL\""
    echo "    - \"Log into my dashboard and check the metric\" (if approved)"
    echo ""
    echo -e "  ${YELLOW}Risk:${NC}"
    echo "    - Can submit forms to any site. Can make purchases if logged in."
    echo "    - Can read content from sites behind auth you're logged into elsewhere."
    echo "    - First run downloads browser binaries (~300MB)."
    echo ""
    PW_ANSWER=$(ask_yn "  Enable Playwright?" "n")

    if [ "$PW_ANSWER" = "y" ]; then
        PW_CONFIG='{"command":"npx","args":["@playwright/mcp@latest"],"env":{}}'
        add_mcp_server "playwright" "$PW_CONFIG"
        ok "Playwright MCP enabled"
    else
        ok "Playwright: OFF"
    fi

    # ── 4c. Computer-use MCP ──────────────────────────────────────────────────
    echo ""
    echo -e "${BOLD}Computer use${NC}  (full mouse + keyboard + screen control on macOS)"
    echo ""
    echo "  Enables:"
    echo "    - \"Open my Excel file and update row 23\""
    echo "    - \"Automate a task I do every Monday\""
    echo "    - \"Screenshot my whole screen and tell me what I'm looking at\""
    echo ""
    echo -e "  ${RED}RISK — read before enabling:${NC}"
    echo "    - Athena can click anything on your screen, including Delete/Send/Confirm."
    echo "    - Athena can see everything on screen — passwords, private messages,"
    echo "      bank pages, anything visible at the time."
    echo "    - If the bot is unattended, scheduled tasks could perform actions"
    echo "      you didn't explicitly approve."
    echo "    - macOS only. Requires Rust/Cargo (first-run build), plus Accessibility"
    echo "      and Screen Recording permissions in System Settings."
    echo "    - Uses the community package @zavora-ai/computer-use-mcp."
    echo ""
    CU_ANSWER=$(ask_yn "  Enable computer use?" "n")

    if [ "$CU_ANSWER" = "y" ]; then
        if ! command -v cargo &> /dev/null; then
            warn "Rust/Cargo not installed — computer-use MCP needs it to build."
            echo "    Install with: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
            echo "    Then re-run ./setup.sh or enable manually."
        fi
        CU_CONFIG='{"command":"npx","args":["-y","@zavora-ai/computer-use-mcp"],"env":{}}'
        add_mcp_server "computer" "$CU_CONFIG"
        set_env_var "ATHENA_COMPUTER_USE" "true"
        ok "Computer use MCP enabled"
        echo "    Grant Accessibility + Screen Recording permissions to your terminal"
        echo "    in System Settings > Privacy & Security before first use."
    else
        ok "Computer use: OFF"
    fi
fi

# ── 5. File permissions ──────────────────────────────

# Make hooks executable
chmod +x "$SCRIPT_DIR"/.claude/hooks/*.sh 2>/dev/null && true

# ── Summary ───────────────────────────────────────────
echo ""
echo -e "${BOLD}────────────────────────────────────${NC}"
echo ""

if [ $ISSUES -gt 0 ]; then
    echo -e "  ${RED}$ISSUES issue(s) to fix before starting.${NC} See above."
    echo ""
    echo "  After fixing, run this script again:  ./setup.sh"
elif [ $WARNINGS -gt 0 ]; then
    echo -e "  ${GREEN}Ready to go.${NC} $WARNINGS optional item(s) skipped (see above)."
    echo ""
    echo "  Next steps:"
    echo ""
    echo "    1. Open this folder in VS Code:  code ."
    echo "    2. Open Claude Code inside VS Code"
    echo "    3. Say hi. Athena handles the rest."
else
    echo -e "  ${GREEN}Everything is set up.${NC}"
    echo ""
    echo "  Next steps:"
    echo ""
    echo "    1. Open this folder in VS Code:  code ."
    echo "    2. Open Claude Code inside VS Code"
    echo "    3. Say hi. Athena handles the rest."
fi

echo ""
