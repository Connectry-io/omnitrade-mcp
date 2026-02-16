#!/usr/bin/env node
/**
 * OmniTrade MCP CLI
 * Beautiful command-line interface for setup and management
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import * as readline from 'readline';

const VERSION = '0.3.2';
const CONFIG_PATH = join(homedir(), '.omnitrade', 'config.json');

// ============================================
// BRANDING
// ============================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

const c = COLORS;

function printLogo(): void {
  console.log(`
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
    ║   ${c.magenta}██║ ╚═╝ ██║╚██████╗██║${c.cyan}          ${c.dim}v${VERSION}${c.cyan}                        ║
    ║   ${c.magenta}╚═╝     ╚═╝ ╚═════╝╚═╝${c.cyan}          ${c.dim}by Connectry Labs${c.cyan}              ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
${c.reset}`);
}

function printHelp(): void {
  printLogo();
  
  console.log(`
${c.bright}${c.white}USAGE${c.reset}
    ${c.cyan}omnitrade-mcp${c.reset} ${c.dim}<command>${c.reset}

${c.bright}${c.white}COMMANDS${c.reset}
    ${c.green}start${c.reset}           Start the MCP server (default)
    ${c.green}init${c.reset}            Interactive setup wizard
    ${c.green}config${c.reset}          Show current configuration
    ${c.green}test${c.reset}            Test exchange connections
    ${c.green}exchanges${c.reset}       List all 107 supported exchanges
    ${c.green}help${c.reset}            Show this help message
    ${c.green}version${c.reset}         Show version

${c.bright}${c.white}EXAMPLES${c.reset}
    ${c.dim}# First time setup${c.reset}
    ${c.cyan}omnitrade-mcp init${c.reset}

    ${c.dim}# Start the server (for Claude Desktop)${c.reset}
    ${c.cyan}omnitrade-mcp start${c.reset}

    ${c.dim}# Test your connections${c.reset}
    ${c.cyan}omnitrade-mcp test${c.reset}

${c.bright}${c.white}CONFIGURATION${c.reset}
    Config file: ${c.yellow}~/.omnitrade/config.json${c.reset}

${c.bright}${c.white}DOCUMENTATION${c.reset}
    ${c.blue}https://github.com/Connectry-io/omnitrade-mcp${c.reset}

${c.bright}${c.white}SUPPORT${c.reset}
    ${c.blue}https://github.com/Connectry-io/omnitrade-mcp/issues${c.reset}
`);
}

function printVersion(): void {
  console.log(`${c.cyan}omnitrade-mcp${c.reset} v${VERSION}`);
}

// ============================================
// COMMANDS
// ============================================

async function showExchanges(): Promise<void> {
  printLogo();
  
  // Import ccxt dynamically
  const ccxt = await import('ccxt');
  const exchanges = ccxt.default.exchanges;
  
  console.log(`${c.bright}${c.white}SUPPORTED EXCHANGES (${exchanges.length})${c.reset}\n`);
  
  // Tier 1 - Certified
  const tier1 = ['binance', 'bybit', 'okx', 'gate', 'kucoin', 'bitget', 'htx', 'mexc', 'cryptocom', 'bitmex', 'woo', 'coinex', 'bitmart', 'bingx'];
  
  console.log(`${c.green}${c.bright}★ TIER 1 - CERTIFIED${c.reset}`);
  console.log(`  ${tier1.filter(e => exchanges.includes(e)).join(', ')}`);
  
  // Tier 2 - Major
  const tier2 = ['coinbase', 'kraken', 'bitstamp', 'gemini', 'bitfinex', 'poloniex', 'deribit', 'upbit', 'bithumb', 'bitvavo', 'phemex', 'ascendex', 'lbank'];
  
  console.log(`\n${c.yellow}${c.bright}★ TIER 2 - MAJOR${c.reset}`);
  console.log(`  ${tier2.filter(e => exchanges.includes(e)).join(', ')}`);
  
  // All others
  const others = exchanges.filter(e => !tier1.includes(e) && !tier2.includes(e));
  
  console.log(`\n${c.dim}★ ALL OTHERS (${others.length})${c.reset}`);
  
  // Print in columns
  const cols = 6;
  for (let i = 0; i < others.length; i += cols) {
    const row = others.slice(i, i + cols);
    console.log(`  ${c.dim}${row.map(e => e.padEnd(15)).join('')}${c.reset}`);
  }
  
  console.log(`\n${c.bright}Total: ${c.cyan}${exchanges.length}${c.reset} exchanges supported\n`);
}

async function showConfig(): Promise<void> {
  printLogo();
  
  console.log(`${c.bright}${c.white}CONFIGURATION${c.reset}\n`);
  console.log(`${c.dim}Location:${c.reset} ${c.yellow}${CONFIG_PATH}${c.reset}\n`);
  
  if (!existsSync(CONFIG_PATH)) {
    console.log(`${c.red}✗ Config file not found${c.reset}`);
    console.log(`\n  Run ${c.cyan}omnitrade-mcp init${c.reset} to create one.\n`);
    return;
  }
  
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const exchanges = Object.keys(config.exchanges || {});
    
    console.log(`${c.green}✓ Config loaded${c.reset}\n`);
    console.log(`${c.bright}Exchanges configured:${c.reset}`);
    
    for (const ex of exchanges) {
      const cfg = config.exchanges[ex];
      const mode = cfg.testnet ? `${c.yellow}testnet${c.reset}` : `${c.green}production${c.reset}`;
      console.log(`  ${c.cyan}•${c.reset} ${ex} (${mode})`);
    }
    
    if (config.security) {
      console.log(`\n${c.bright}Security settings:${c.reset}`);
      if (config.security.maxOrderSize) {
        console.log(`  ${c.cyan}•${c.reset} Max order size: $${config.security.maxOrderSize}`);
      }
      if (config.security.allowedPairs) {
        console.log(`  ${c.cyan}•${c.reset} Allowed pairs: ${config.security.allowedPairs.join(', ')}`);
      }
      if (config.security.testnetOnly) {
        console.log(`  ${c.cyan}•${c.reset} Testnet only: ${c.yellow}enabled${c.reset}`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.log(`${c.red}✗ Error reading config:${c.reset} ${(error as Error).message}\n`);
  }
}

async function testConnections(): Promise<void> {
  printLogo();
  
  console.log(`${c.bright}${c.white}TESTING CONNECTIONS${c.reset}\n`);
  
  if (!existsSync(CONFIG_PATH)) {
    console.log(`${c.red}✗ Config file not found${c.reset}`);
    console.log(`\n  Run ${c.cyan}omnitrade-mcp init${c.reset} to create one.\n`);
    return;
  }
  
  const ccxt = await import('ccxt');
  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
  const exchanges = Object.entries(config.exchanges || {});
  
  for (const [name, cfg] of exchanges) {
    process.stdout.write(`  Testing ${c.cyan}${name}${c.reset}... `);
    
    try {
      const ExchangeClass = (ccxt.default as any)[name];
      if (!ExchangeClass) {
        console.log(`${c.red}✗ Unknown exchange${c.reset}`);
        continue;
      }
      
      const ex = new ExchangeClass({
        apiKey: (cfg as any).apiKey,
        secret: (cfg as any).secret,
        password: (cfg as any).password,
        enableRateLimit: true,
      });
      
      if ((cfg as any).testnet) {
        ex.setSandboxMode(true);
      }
      
      // Test by fetching balance
      const balance = await ex.fetchBalance();
      const assets = Object.entries(balance.total)
        .filter(([_, v]) => (v as number) > 0)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      
      const mode = (cfg as any).testnet ? `${c.yellow}testnet${c.reset}` : `${c.green}live${c.reset}`;
      console.log(`${c.green}✓${c.reset} Connected (${mode})`);
      if (assets) {
        console.log(`    ${c.dim}Balances: ${assets}${c.reset}`);
      }
    } catch (error) {
      console.log(`${c.red}✗ ${(error as Error).message.substring(0, 50)}${c.reset}`);
    }
  }
  
  console.log('');
}

async function initConfig(): Promise<void> {
  printLogo();
  
  console.log(`${c.bright}${c.white}SETUP WIZARD${c.reset}\n`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (q: string): Promise<string> => 
    new Promise(resolve => rl.question(q, resolve));
  
  console.log(`${c.dim}Let's set up your first exchange connection.${c.reset}\n`);
  
  // Get exchange name
  const exchange = await question(`${c.cyan}?${c.reset} Exchange name (e.g., binance, coinbase, kraken): `);
  
  if (!exchange.trim()) {
    console.log(`${c.red}✗ Exchange name required${c.reset}`);
    rl.close();
    return;
  }
  
  // Get API key
  const apiKey = await question(`${c.cyan}?${c.reset} API Key: `);
  
  // Get secret
  const secret = await question(`${c.cyan}?${c.reset} Secret Key: `);
  
  // Get password/passphrase (optional)
  const password = await question(`${c.cyan}?${c.reset} Passphrase (press Enter if none): `);
  
  // Testnet?
  const testnetAnswer = await question(`${c.cyan}?${c.reset} Use testnet/sandbox? (Y/n): `);
  const testnet = testnetAnswer.toLowerCase() !== 'n';
  
  rl.close();
  
  // Build config
  const config: any = {
    exchanges: {
      [exchange.toLowerCase().trim()]: {
        apiKey: apiKey.trim(),
        secret: secret.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        testnet,
      },
    },
    security: {
      maxOrderSize: 100,
      confirmTrades: true,
    },
  };
  
  // Create directory and file
  const configDir = join(homedir(), '.omnitrade');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  
  // Set permissions (Unix only)
  try {
    const { chmodSync } = await import('fs');
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // Ignore on Windows
  }
  
  console.log(`\n${c.green}✓ Configuration saved to ${CONFIG_PATH}${c.reset}`);
  console.log(`\n${c.bright}Next steps:${c.reset}`);
  console.log(`  1. Test connection: ${c.cyan}omnitrade-mcp test${c.reset}`);
  console.log(`  2. Add to Claude:   ${c.cyan}Add "omnitrade-mcp" to Claude Desktop config${c.reset}`);
  console.log(`  3. Start trading:   ${c.cyan}Ask Claude "What's my balance?"${c.reset}\n`);
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
      
    case 'version':
    case '--version':
    case '-v':
      printVersion();
      break;
      
    case 'exchanges':
    case 'list':
      await showExchanges();
      break;
      
    case 'config':
    case 'status':
      await showConfig();
      break;
      
    case 'test':
      await testConnections();
      break;
      
    case 'init':
    case 'setup':
      await initConfig();
      break;
      
    case 'start':
    case 'serve':
    case 'run':
      // Import and run the MCP server
      await import('./index.js');
      break;
      
    default:
      console.log(`${c.red}Unknown command: ${command}${c.reset}`);
      console.log(`Run ${c.cyan}omnitrade-mcp help${c.reset} for usage.\n`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${c.red}Error:${c.reset}`, error.message);
  process.exit(1);
});
