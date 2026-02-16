#!/usr/bin/env node
/**
 * OmniTrade MCP CLI
 * Beautiful command-line interface with guided setup
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import * as readline from 'readline';

const VERSION = '0.4.0';
const CONFIG_PATH = join(homedir(), '.omnitrade', 'config.json');

// ============================================
// COLORS (Subtle & Professional)
// ============================================

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  
  // Subtle colors
  white: '\x1b[97m',
  gray: '\x1b[90m',
  blue: '\x1b[38;5;75m',      // Soft blue
  cyan: '\x1b[38;5;80m',      // Soft cyan
  green: '\x1b[38;5;114m',    // Soft green
  yellow: '\x1b[38;5;222m',   // Soft yellow
  purple: '\x1b[38;5;141m',   // Soft purple
  orange: '\x1b[38;5;215m',   // Soft orange
  red: '\x1b[38;5;203m',      // Soft red
};

// ============================================
// LOGO & BRANDING
// ============================================

function printLogo(): void {
  console.log(`
${c.blue}${c.bold}
   ╭─────────────────────────────────────────────────────────────────────╮
   │                                                                     │
   │    ██████╗ ███╗   ███╗███╗   ██╗██╗${c.purple}████████╗${c.blue}██████╗  █████╗ ██████╗ ███████╗  │
   │   ██╔═══██╗████╗ ████║████╗  ██║██║${c.purple}╚══██╔══╝${c.blue}██╔══██╗██╔══██╗██╔══██╗██╔════╝  │
   │   ██║   ██║██╔████╔██║██╔██╗ ██║██║${c.purple}   ██║   ${c.blue}██████╔╝███████║██║  ██║█████╗    │
   │   ██║   ██║██║╚██╔╝██║██║╚██╗██║██║${c.purple}   ██║   ${c.blue}██╔══██╗██╔══██║██║  ██║██╔══╝    │
   │   ╚██████╔╝██║ ╚═╝ ██║██║ ╚████║██║${c.purple}   ██║   ${c.blue}██║  ██║██║  ██║██████╔╝███████╗  │
   │    ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝${c.purple}   ╚═╝   ${c.blue}╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝  │
   │                                                                     │
   │   ${c.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.blue}   │
   │                                                                     │
   │   ${c.white}One AI.  107 Exchanges.  Natural Language Trading.${c.blue}            │
   │                                                                     │
   │   ${c.gray}v${VERSION}                                         by Connectry Labs${c.blue}   │
   │                                                                     │
   ╰─────────────────────────────────────────────────────────────────────╯
${c.reset}`);
}

function printCompactLogo(): void {
  console.log(`
${c.blue}${c.bold}   ╭──────────────────────────────────────────────╮
   │  ${c.white}OmniTrade${c.purple} MCP${c.blue}  ${c.gray}·  One AI. 107 Exchanges.${c.blue}  │
   ╰──────────────────────────────────────────────╯${c.reset}
`);
}

// ============================================
// HELP
// ============================================

function printHelp(): void {
  printLogo();
  
  console.log(`
${c.white}${c.bold}  COMMANDS${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

   ${c.green}setup${c.reset}              Guided setup wizard ${c.dim}(recommended for first use)${c.reset}
   ${c.blue}start${c.reset}              Start the MCP server for Claude Desktop
   ${c.blue}test${c.reset}               Test your exchange connections
   ${c.blue}config${c.reset}             View current configuration
   ${c.blue}exchanges${c.reset}          List all 107 supported exchanges
   ${c.blue}help${c.reset}               Show this help message

${c.white}${c.bold}  QUICK START${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

   ${c.yellow}$${c.reset} ${c.cyan}omnitrade setup${c.reset}          ${c.dim}Run the guided setup wizard${c.reset}

${c.white}${c.bold}  LINKS${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

   ${c.dim}Documentation${c.reset}    ${c.blue}https://github.com/Connectry-io/omnitrade-mcp${c.reset}
   ${c.dim}Issues${c.reset}           ${c.blue}https://github.com/Connectry-io/omnitrade-mcp/issues${c.reset}

`);
}

// ============================================
// GUIDED SETUP WIZARD
// ============================================

async function runSetupWizard(): Promise<void> {
  printLogo();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (q: string): Promise<string> => 
    new Promise(resolve => rl.question(q, resolve));

  const clear = () => console.log('\x1b[2J\x1b[H');
  
  // Step 1: Welcome
  console.log(`
${c.white}${c.bold}  WELCOME TO OMNITRADE${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

  This wizard will help you connect your first cryptocurrency exchange
  to Claude. It takes about ${c.green}2 minutes${c.reset}.

${c.white}${c.bold}  WHAT YOU'LL NEED${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

   ${c.cyan}1.${c.reset}  An account on a cryptocurrency exchange ${c.dim}(Binance, Coinbase, etc.)${c.reset}
   ${c.cyan}2.${c.reset}  API keys from that exchange ${c.dim}(we'll show you how)${c.reset}
   ${c.cyan}3.${c.reset}  Claude Desktop installed ${c.dim}(download from claude.ai)${c.reset}

${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}
`);

  await question(`  ${c.dim}Press Enter to continue...${c.reset}`);
  
  // Step 2: Choose Exchange
  console.log(`
${c.white}${c.bold}  STEP 1 OF 4: CHOOSE YOUR EXCHANGE${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

  ${c.dim}Popular exchanges:${c.reset}

   ${c.cyan}[1]${c.reset}  Binance        ${c.dim}Largest exchange, global${c.reset}
   ${c.cyan}[2]${c.reset}  Coinbase       ${c.dim}US-based, beginner friendly${c.reset}
   ${c.cyan}[3]${c.reset}  Kraken         ${c.dim}Security focused, EU/US${c.reset}
   ${c.cyan}[4]${c.reset}  Bybit          ${c.dim}Derivatives, Asia${c.reset}
   ${c.cyan}[5]${c.reset}  OKX            ${c.dim}Full-featured, global${c.reset}
   ${c.cyan}[6]${c.reset}  KuCoin         ${c.dim}Altcoin variety${c.reset}
   ${c.cyan}[7]${c.reset}  Other          ${c.dim}Enter exchange name manually${c.reset}

`);

  const exchangeChoice = await question(`  ${c.yellow}?${c.reset} Select exchange ${c.dim}[1-7]${c.reset}: `);
  
  const exchangeMap: Record<string, string> = {
    '1': 'binance',
    '2': 'coinbase',
    '3': 'kraken',
    '4': 'bybit',
    '5': 'okx',
    '6': 'kucoin',
  };
  
  let exchange = exchangeMap[exchangeChoice.trim()];
  
  if (!exchange) {
    exchange = await question(`  ${c.yellow}?${c.reset} Enter exchange name: `);
  }
  
  exchange = exchange.toLowerCase().trim();
  
  // Step 3: API Key Instructions
  console.log(`
${c.white}${c.bold}  STEP 2 OF 4: GET YOUR API KEYS${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

  ${c.dim}You need to create API keys on ${c.white}${exchange}${c.dim}. Here's how:${c.reset}
`);

  // Show exchange-specific instructions
  if (exchange === 'binance') {
    console.log(`
   ${c.cyan}1.${c.reset}  Go to ${c.blue}https://testnet.binance.vision/${c.reset} ${c.dim}(for testnet)${c.reset}
       Or ${c.blue}https://www.binance.com/en/my/settings/api-management${c.reset} ${c.dim}(real)${c.reset}
   ${c.cyan}2.${c.reset}  Click "${c.white}Generate HMAC_SHA256 Key${c.reset}"
   ${c.cyan}3.${c.reset}  Enable permissions: ${c.green}✓ Read${c.reset}  ${c.green}✓ Trade${c.reset}  ${c.red}✗ Withdraw${c.reset}
   ${c.cyan}4.${c.reset}  Copy the ${c.white}API Key${c.reset} and ${c.white}Secret Key${c.reset}
`);
  } else if (exchange === 'coinbase') {
    console.log(`
   ${c.cyan}1.${c.reset}  Go to ${c.blue}https://portal.cdp.coinbase.com/${c.reset}
   ${c.cyan}2.${c.reset}  Create a new project
   ${c.cyan}3.${c.reset}  Generate API credentials
   ${c.cyan}4.${c.reset}  Copy ${c.white}API Key${c.reset}, ${c.white}Secret${c.reset}, and ${c.white}Passphrase${c.reset}
`);
  } else if (exchange === 'kraken') {
    console.log(`
   ${c.cyan}1.${c.reset}  Go to ${c.blue}https://www.kraken.com/u/security/api${c.reset}
   ${c.cyan}2.${c.reset}  Click "Generate new key"
   ${c.cyan}3.${c.reset}  Enable: ${c.green}✓ Query${c.reset}  ${c.green}✓ Trade${c.reset}  ${c.red}✗ Withdraw${c.reset}
   ${c.cyan}4.${c.reset}  Copy the ${c.white}API Key${c.reset} and ${c.white}Private Key${c.reset}
`);
  } else {
    console.log(`
   ${c.cyan}1.${c.reset}  Log in to ${c.white}${exchange}${c.reset}
   ${c.cyan}2.${c.reset}  Go to API settings ${c.dim}(usually in Settings or Security)${c.reset}
   ${c.cyan}3.${c.reset}  Create a new API key
   ${c.cyan}4.${c.reset}  Enable: ${c.green}✓ Read${c.reset}  ${c.green}✓ Trade${c.reset}  ${c.red}✗ Withdraw${c.reset} ${c.dim}(never enable withdraw!)${c.reset}
   ${c.cyan}5.${c.reset}  Copy the ${c.white}API Key${c.reset} and ${c.white}Secret${c.reset}
`);
  }

  console.log(`
${c.orange}  ⚠  SECURITY TIP: Never enable withdrawal permissions!${c.reset}
`);

  await question(`  ${c.dim}Press Enter when you have your API keys ready...${c.reset}`);

  // Step 4: Enter API Keys
  console.log(`
${c.white}${c.bold}  STEP 3 OF 4: ENTER YOUR API KEYS${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

  ${c.dim}Your keys are stored locally at ~/.omnitrade/config.json${c.reset}
  ${c.dim}They never leave your machine.${c.reset}

`);

  const apiKey = await question(`  ${c.yellow}?${c.reset} API Key: `);
  const secret = await question(`  ${c.yellow}?${c.reset} Secret Key: `);
  
  let password = '';
  if (['coinbase', 'kucoin', 'okx'].includes(exchange)) {
    password = await question(`  ${c.yellow}?${c.reset} Passphrase ${c.dim}(required for ${exchange})${c.reset}: `);
  }
  
  const testnetAnswer = await question(`  ${c.yellow}?${c.reset} Use testnet/sandbox mode? ${c.dim}(recommended)${c.reset} [Y/n]: `);
  const testnet = testnetAnswer.toLowerCase() !== 'n';

  rl.close();

  // Save config
  const config: Record<string, unknown> = {
    exchanges: {
      [exchange]: {
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

  const configDir = join(homedir(), '.omnitrade');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

  try {
    const { chmodSync } = await import('fs');
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // Ignore on Windows
  }

  // Step 5: Claude Desktop Setup
  console.log(`
${c.green}${c.bold}  ✓ CONFIGURATION SAVED${c.reset}

${c.white}${c.bold}  STEP 4 OF 4: CONNECT TO CLAUDE DESKTOP${c.reset}
${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

  ${c.dim}Add OmniTrade to Claude Desktop:${c.reset}

   ${c.cyan}1.${c.reset}  Open this file in a text editor:
       ${c.blue}~/Library/Application Support/Claude/claude_desktop_config.json${c.reset}

   ${c.cyan}2.${c.reset}  Add this configuration:

       ${c.gray}{
         "mcpServers": {
           "omnitrade": {
             "command": "omnitrade",
             "args": ["start"]
           }
         }
       }${c.reset}

   ${c.cyan}3.${c.reset}  Save the file and ${c.white}restart Claude Desktop${c.reset}

   ${c.cyan}4.${c.reset}  Start chatting! Try asking:
       ${c.dim}"What's my balance on ${exchange}?"${c.reset}
       ${c.dim}"Show me the price of Bitcoin"${c.reset}
       ${c.dim}"Buy $10 of ETH"${c.reset}

${c.gray}  ────────────────────────────────────────────────────────────────${c.reset}

${c.white}${c.bold}  NEXT STEPS${c.reset}

   ${c.cyan}•${c.reset}  Test your connection:     ${c.yellow}omnitrade test${c.reset}
   ${c.cyan}•${c.reset}  View your config:         ${c.yellow}omnitrade config${c.reset}
   ${c.cyan}•${c.reset}  Add more exchanges:       ${c.yellow}omnitrade setup${c.reset} ${c.dim}(run again)${c.reset}
   ${c.cyan}•${c.reset}  Get help:                 ${c.yellow}omnitrade help${c.reset}

${c.green}${c.bold}  ✓ Setup complete! You're ready to trade with AI.${c.reset}

`);
}

// ============================================
// OTHER COMMANDS
// ============================================

async function showExchanges(): Promise<void> {
  printCompactLogo();
  
  const ccxt = await import('ccxt');
  const exchanges = ccxt.default.exchanges;
  
  console.log(`${c.white}${c.bold}  SUPPORTED EXCHANGES${c.reset} ${c.dim}(${exchanges.length} total)${c.reset}\n`);
  
  const tier1 = ['binance', 'bybit', 'okx', 'gate', 'kucoin', 'bitget', 'htx', 'mexc', 'cryptocom', 'bitmex', 'woo', 'coinex', 'bitmart', 'bingx'];
  const tier2 = ['coinbase', 'kraken', 'bitstamp', 'gemini', 'bitfinex', 'poloniex', 'deribit', 'upbit', 'bithumb', 'bitvavo', 'phemex', 'ascendex', 'lbank'];
  
  console.log(`  ${c.green}★ TIER 1 - CERTIFIED${c.reset}`);
  console.log(`  ${c.dim}${tier1.filter(e => exchanges.includes(e)).join(', ')}${c.reset}`);
  
  console.log(`\n  ${c.yellow}★ TIER 2 - MAJOR${c.reset}`);
  console.log(`  ${c.dim}${tier2.filter(e => exchanges.includes(e)).join(', ')}${c.reset}`);
  
  const others = exchanges.filter(e => !tier1.includes(e) && !tier2.includes(e));
  console.log(`\n  ${c.gray}★ ALL OTHERS (${others.length})${c.reset}`);
  
  const cols = 8;
  for (let i = 0; i < others.length; i += cols) {
    const row = others.slice(i, i + cols);
    console.log(`  ${c.dim}${row.map(e => e.padEnd(12)).join('')}${c.reset}`);
  }
  
  console.log('');
}

async function showConfig(): Promise<void> {
  printCompactLogo();
  
  console.log(`${c.white}${c.bold}  CONFIGURATION${c.reset}\n`);
  console.log(`  ${c.dim}Location:${c.reset} ${c.blue}${CONFIG_PATH}${c.reset}\n`);
  
  if (!existsSync(CONFIG_PATH)) {
    console.log(`  ${c.red}✗ No configuration found${c.reset}`);
    console.log(`\n  Run ${c.cyan}omnitrade setup${c.reset} to get started.\n`);
    return;
  }
  
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    const exchanges = Object.keys(config.exchanges || {});
    
    console.log(`  ${c.green}✓ Config loaded${c.reset}\n`);
    console.log(`  ${c.white}${c.bold}Exchanges:${c.reset}`);
    
    for (const ex of exchanges) {
      const cfg = config.exchanges[ex];
      const mode = cfg.testnet ? `${c.yellow}testnet${c.reset}` : `${c.green}live${c.reset}`;
      console.log(`   ${c.cyan}•${c.reset} ${ex} (${mode})`);
    }
    
    if (config.security) {
      console.log(`\n  ${c.white}${c.bold}Security:${c.reset}`);
      if (config.security.maxOrderSize) {
        console.log(`   ${c.cyan}•${c.reset} Max order: $${config.security.maxOrderSize}`);
      }
    }
    
    console.log('');
  } catch (error) {
    console.log(`  ${c.red}✗ Error:${c.reset} ${(error as Error).message}\n`);
  }
}

async function testConnections(): Promise<void> {
  printCompactLogo();
  
  console.log(`${c.white}${c.bold}  TESTING CONNECTIONS${c.reset}\n`);
  
  if (!existsSync(CONFIG_PATH)) {
    console.log(`  ${c.red}✗ No configuration found${c.reset}`);
    console.log(`\n  Run ${c.cyan}omnitrade setup${c.reset} to get started.\n`);
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

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'setup':
    case 'init':
    case 'configure':
      await runSetupWizard();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
      
    case 'version':
    case '--version':
    case '-v':
      console.log(`omnitrade v${VERSION}`);
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
      
    case 'start':
    case 'serve':
    case 'run':
      await import('./index.js');
      break;
      
    default:
      console.log(`${c.red}Unknown command: ${command}${c.reset}`);
      console.log(`Run ${c.cyan}omnitrade help${c.reset} for usage.\n`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${c.red}Error:${c.reset}`, error.message);
  process.exit(1);
});
