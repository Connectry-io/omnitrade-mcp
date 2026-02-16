#!/usr/bin/env node
/**
 * Post-install welcome screen
 * Uses stderr so npm doesn't suppress it
 */

const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  blue: '\x1b[34m',
};

const msg = `
${c.cyan}${c.bright}
    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   ${c.white}█████╗ █████╗█████╗██╗███╗  ██╗██████╗ █████╗ ████╗ █████╗${c.cyan}    ║
    ║   ${c.white}██╔═██╗██╔═██╗██╔═██╗██║████╗██║╚═██╔═╝██╔═██╗██╔═██╗██╔═══╝${c.cyan}   ║
    ║   ${c.white}██║ ██║██║ ██║██║ ██║██║██╔████║  ██║  █████╔╝██████║██████╗${c.cyan}   ║
    ║   ${c.white}██║ ██║██║ ██║██║ ██║██║██║╚███║  ██║  ██╔═██╗██╔═██║██╔═══╝${c.cyan}   ║
    ║   ${c.white}█████╔╝██║ ██║██║ ██║██║██║ ███║  ██║  ██║ ██║██║ ██║█████╗${c.cyan}    ║
    ║   ${c.white}╚════╝ ╚═╝ ╚═╝╚═╝ ╚═╝╚═╝╚═╝ ╚══╝  ╚═╝  ╚═╝ ╚═╝╚═╝ ╚═╝╚════╝${c.cyan}    ║
    ║                                                                   ║
    ║   ${c.magenta}███╗   ███╗ ██████╗██████╗${c.cyan}                                    ║
    ║   ${c.magenta}████╗ ████║██╔════╝██╔══██╗${c.cyan}     ${c.dim}One AI. 107 Exchanges.${c.cyan}       ║
    ║   ${c.magenta}██╔████╔██║██║     ██████╔╝${c.cyan}     ${c.dim}Natural Language Trading.${c.cyan}    ║
    ║   ${c.magenta}██║╚██╔╝██║██║     ██╔═══╝${c.cyan}                                     ║
    ║   ${c.magenta}██║ ╚═╝ ██║╚██████╗██║${c.cyan}                                        ║
    ║   ${c.magenta}╚═╝     ╚═╝ ╚═════╝╚═╝${c.cyan}          ${c.dim}by Connectry Labs${c.cyan}              ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
${c.reset}
${c.green}${c.bright}  ✓ Installation complete!${c.reset}

${c.bright}${c.white}  QUICK START${c.reset}
${c.cyan}  ─────────────────────────────────────────────────────────────────${c.reset}

  ${c.yellow}Step 1:${c.reset} Run the setup wizard
  ${c.dim}$${c.reset} ${c.cyan}omnitrade-mcp init${c.reset}

  ${c.yellow}Step 2:${c.reset} Add to Claude Desktop config
  ${c.dim}Edit: ~/Library/Application Support/Claude/claude_desktop_config.json${c.reset}
  
  ${c.dim}{
    "mcpServers": {
      "omnitrade": { "command": "omnitrade-mcp" }
    }
  }${c.reset}

  ${c.yellow}Step 3:${c.reset} Restart Claude Desktop & start trading!
  ${c.dim}Ask: "What's my balance?" or "Buy $50 of BTC"${c.reset}

${c.cyan}  ─────────────────────────────────────────────────────────────────${c.reset}
  ${c.dim}Commands:${c.reset}  omnitrade-mcp help    ${c.dim}|${c.reset}  omnitrade-mcp test
  ${c.dim}Docs:${c.reset}      ${c.blue}https://github.com/Connectry-io/omnitrade-mcp${c.reset}
${c.cyan}  ─────────────────────────────────────────────────────────────────${c.reset}
`;

// Write to stderr so npm doesn't suppress it during global install
process.stderr.write(msg + '\n');
