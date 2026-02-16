# OmniTrade MCP

> **One AI. 107 Exchanges. Natural language trading.**

Connect Claude to Binance, Coinbase, Kraken, and 104 more cryptocurrency exchanges through the Model Context Protocol (MCP).

[![npm version](https://img.shields.io/npm/v/omnitrade-mcp)](https://www.npmjs.com/package/omnitrade-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔗 **107 Exchanges** — Connect to any exchange supported by CCXT
- 🤖 **Natural Language** — Ask Claude to trade in plain English
- 🔒 **Local-Only** — API keys never leave your machine
- ⚡ **Arbitrage Detection** — Find price differences across exchanges
- 📊 **Unified Portfolio** — See all holdings in one view
- 🛡️ **Safety First** — Order limits, pair whitelists, testnet mode

## Quick Start

### 1. Install

```bash
npm install -g omnitrade-mcp
```

### 2. Configure

Create `~/.omnitrade/config.json`:

```json
{
  "exchanges": {
    "binance": {
      "apiKey": "YOUR_API_KEY",
      "secret": "YOUR_SECRET",
      "testnet": true
    },
    "coinbase": {
      "apiKey": "YOUR_API_KEY",
      "secret": "YOUR_SECRET",
      "password": "YOUR_PASSPHRASE",
      "testnet": true
    }
  },
  "security": {
    "maxOrderSize": 100,
    "confirmTrades": true
  }
}
```

Set proper permissions:

```bash
chmod 600 ~/.omnitrade/config.json
```

### 3. Add to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "omnitrade": {
      "command": "omnitrade-mcp"
    }
  }
}
```

### 4. Trade

Restart Claude Desktop and start chatting:

- *"What's my balance on Binance?"*
- *"Show me ETH prices across all exchanges"*
- *"Buy $50 of BTC on the cheapest exchange"*
- *"Are there any arbitrage opportunities for SOL?"*

## Available Tools

| Tool | Description |
|------|-------------|
| `get_balances` | Get portfolio balances across exchanges |
| `get_portfolio` | Unified portfolio summary |
| `get_prices` | Current prices for a trading pair |
| `compare_prices` | Find best price across exchanges |
| `place_order` | Execute buy/sell orders |
| `get_orders` | View open and recent orders |
| `cancel_order` | Cancel an open order |
| `get_arbitrage` | Find arbitrage opportunities |
| `check_spread` | Check spread for a specific pair |

## Supported Exchanges

OmniTrade supports **107 exchanges** through [CCXT](https://github.com/ccxt/ccxt), including:

**Tier 1 (Certified):** Binance, Bybit, OKX, Gate.io, KuCoin, Bitget, HTX, Crypto.com, MEXC, WOO X, Hyperliquid

**Tier 2:** Coinbase, Kraken, Bitstamp, Gemini, Bitfinex, Poloniex, Deribit, Upbit, Bithumb, Bitvavo, and 80+ more

## Security

### Local-Only Architecture

```
┌─────────────────────────────────────┐
│       YOUR MACHINE                  │
│                                     │
│  Claude ←→ OmniTrade MCP           │
│              ↓                      │
│         config.json (your keys)    │
│              ↓                      │
│         Exchange APIs              │
└─────────────────────────────────────┘
          (HTTPS to exchanges)
```

- ✅ API keys stay on your machine
- ✅ No cloud storage
- ✅ No telemetry
- ✅ Open source — audit the code

### API Key Best Practices

**Always:**
- Enable only View + Trade permissions
- **Disable** withdrawal permissions
- Use IP restrictions when available
- Use testnet for testing

**Never:**
- Share your config file
- Commit config to git
- Enable withdrawal permissions

### Safety Features

```json
{
  "security": {
    "maxOrderSize": 100,        // Max $100 per order
    "allowedPairs": ["BTC/USDT", "ETH/USDT"],  // Whitelist
    "testnetOnly": true,        // Force testnet
    "confirmTrades": true       // Require confirmation
  }
}
```

## Configuration

### Full Config Example

```json
{
  "exchanges": {
    "binance": {
      "apiKey": "xxx",
      "secret": "xxx",
      "testnet": true
    },
    "coinbase": {
      "apiKey": "xxx",
      "secret": "xxx", 
      "password": "xxx",
      "testnet": true
    },
    "kraken": {
      "apiKey": "xxx",
      "secret": "xxx",
      "testnet": false
    }
  },
  "defaultExchange": "binance",
  "security": {
    "maxOrderSize": 100,
    "allowedPairs": ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    "testnetOnly": false,
    "confirmTrades": true
  }
}
```

### Config Locations

The config file is searched in order:

1. `~/.omnitrade/config.json` (recommended)
2. `./omnitrade.config.json`
3. `./.omnitrade.json`

## Testnet Setup

### Binance Testnet

1. Go to https://testnet.binance.vision/
2. Login with GitHub
3. Generate API keys
4. Get free testnet coins from faucet

### Coinbase Sandbox

1. Go to https://portal.cdp.coinbase.com/
2. Create new project
3. Enable sandbox mode
4. Generate API keys

## Disclaimer

```
⚠️ IMPORTANT

This software is provided "as is" without warranty of any kind.

Cryptocurrency trading involves substantial risk of loss. 
Past performance does not guarantee future results.

This software does NOT provide financial, investment, or trading advice.
You are solely responsible for your trading decisions.

Always test with testnet before using real funds.
Never trade more than you can afford to lose.
```

## License

MIT © [Connectry Labs](https://connectry.io)

## Links

- [GitHub](https://github.com/Connectry-io/omnitrade-mcp)
- [npm](https://www.npmjs.com/package/omnitrade-mcp)
- [CCXT Documentation](https://docs.ccxt.com/)
- [MCP Specification](https://modelcontextprotocol.io/)

---

Made with ⚡ by [Connectry Labs](https://connectry.io)
