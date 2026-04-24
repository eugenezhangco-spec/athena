// Cross-platform launcher for @cocal/google-calendar-mcp
// Resolves credential paths based on OS so .mcp.json works on both Windows and VPS.
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const home = os.homedir();
const isWin = process.platform === 'win32';

process.env.GOOGLE_OAUTH_CREDENTIALS = path.join(home, 'calendar-credentials.json');
process.env.GOOGLE_CALENDAR_MCP_TOKEN_PATH = isWin
  ? path.join(home, '.config', 'google-calendar-mcp', 'tokens.json')
  : path.join(home, '.config', 'google-calendar-mcp-athena', 'tokens.json');

const child = spawn('npx', ['-y', '@cocal/google-calendar-mcp@2.6.1'], {
  env: process.env,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code || 0));
