# Changelog

## [0.8.0] - 2025-01-XX

### 🎉 Major Release: Advanced Trading Features

This release adds **19 new MCP tools** across 6 major feature categories, transforming OmniTrade from a basic trading interface into a comprehensive crypto trading automation platform.

### ✨ New Features

#### 1. Price Alerts 🔔
Track cryptocurrency prices and get notified when they hit your targets.

**New Tools:**
- `set_price_alert` - Set alerts for price going above/below targets
- `list_alerts` - View all active and triggered alerts
- `check_alerts` - Manually check if any alerts have triggered
- `remove_alert` - Remove specific alerts
- `clear_triggered_alerts` - Clear alert history

**Usage:**
```
"Alert me when BTC drops below $40000"
"Alert me when ETH goes above $4000 on Binance"
```

**Storage:** `~/.omnitrade/alerts.json`

---

#### 2. ASCII Price Charts 📈
Visualize price history directly in your terminal with beautiful ASCII art charts.

**New Tools:**
- `get_chart` - Display price charts with OHLCV data

**Features:**
- Multiple timeframes: 1h, 4h, 24h, 7d
- Visual trend indicators
- Price range and percentage change
- Works with any exchange that supports OHLCV data

**Usage:**
```
"Show me a 24h chart for BTC"
"Display ETH price chart for the last week"
```

---

#### 3. Portfolio History & P&L 📊
Track your portfolio value over time and calculate profit/loss.

**New Tools:**
- `record_portfolio_snapshot` - Record current portfolio value
- `get_portfolio_history` - View historical performance with P&L
- `clear_portfolio_history` - Clear history data

**Features:**
- Automatic USD value calculation for all assets
- P&L calculations with percentage changes
- Historical snapshots with timestamps
- Support for multiple time periods (1d, 1w, 1m, 3m, 1y, all)
- High/low value tracking

**Usage:**
```
"Record my portfolio value"
"How has my portfolio performed this week?"
"Show me my portfolio history for the last month"
```

**Storage:** `~/.omnitrade/history.json`

---

#### 4. Auto-Rebalance ⚖️
Automatically rebalance your portfolio to target allocations.

**New Tools:**
- `rebalance_portfolio` - Create and execute rebalancing plans

**Features:**
- Preview mode (default) shows trades before execution
- Calculates required trades to reach target allocations
- Shows current vs target percentages
- Supports multiple assets
- Respects security settings

**Usage:**
```
"Rebalance my portfolio to 50% BTC, 30% ETH, 20% SOL"
"Preview a rebalance to equal weights for BTC, ETH, and ADA"
```

---

#### 5. DCA (Dollar Cost Averaging) 💰
Setup recurring buy orders to automate your investment strategy.

**New Tools:**
- `setup_dca` - Create DCA configurations
- `list_dca_configs` - View all DCA strategies
- `execute_dca_orders` - Execute pending DCA orders
- `toggle_dca` - Enable/disable DCA configs
- `remove_dca` - Delete DCA configurations

**Features:**
- Multiple frequencies: hourly, daily, weekly, monthly
- Tracks total executions and spent amounts
- Last execution timestamps
- Enable/disable without deleting configs
- Works with external schedulers (cron)

**Usage:**
```
"Setup DCA to buy $10 of BTC every day"
"Create a weekly DCA of $50 for ETH on Binance"
"Execute my DCA orders"
```

**Storage:** `~/.omnitrade/dca.json`

---

#### 6. Conditional Orders 🎯
Execute trades automatically when price conditions are met.

**New Tools:**
- `set_conditional_order` - Create price-triggered orders
- `list_conditional_orders` - View all conditional orders
- `check_conditional_orders` - Check and execute triggered orders
- `remove_conditional_order` - Delete conditional orders

**Features:**
- Three condition types:
  - `price_above` - Trigger when price goes above target
  - `price_below` - Trigger when price goes below target
  - `price_change_percent` - Trigger on % change (up or down)
- Support for market and limit orders
- Records base price for percentage-based conditions
- Execution tracking with order IDs

**Usage:**
```
"Buy 0.5 ETH if it drops 5%"
"Sell 1 BTC if price goes above $50000"
"Set a conditional order to buy SOL if it drops below $100"
```

**Storage:** `~/.omnitrade/conditional-orders.json`

---

#### 7. Arbitrage Execution ⚡ (Enhanced)
Existing arbitrage detection now includes automatic execution.

**New Tools:**
- `execute_arbitrage` - Execute arbitrage trades automatically

**Features:**
- Shows gross and net profit (including estimated fees)
- Preview mode by default (safety first)
- Validates profitability before execution
- Handles partial execution failures gracefully
- Real-time price checks before execution

**Usage:**
```
"Execute arbitrage for 0.01 BTC between Kraken and Binance"
"Preview arbitrage for ETH buying on Coinbase and selling on Binance"
```

---

### 🔧 Technical Improvements

- **Version:** Bumped to 0.8.0
- **Data Storage:** All user data stored in `~/.omnitrade/`
  - `alerts.json` - Price alerts
  - `history.json` - Portfolio snapshots
  - `dca.json` - DCA configurations
  - `conditional-orders.json` - Conditional orders
- **Security:** All execution features respect `security.confirmTrades` config
- **Error Handling:** Comprehensive error handling for all new features
- **Preview Mode:** All trade execution features default to preview mode
- **Type Safety:** Full TypeScript support with Zod schemas

---

### 📖 Documentation

- Updated README with:
  - New features section
  - Complete tool reference (organized by category)
  - Usage examples for all new features
  - ASCII chart examples
- Enhanced code comments
- Added this CHANGELOG

---

### 🔒 Security Considerations

**All execution features:**
- Default to preview mode
- Require `security.confirmTrades: false` for auto-execution
- Respect `maxOrderSize` limits
- Work with testnet mode
- Show warnings before execution

**Data Files:**
Stored in `~/.omnitrade/` with standard file permissions. Consider setting:
```bash
chmod 700 ~/.omnitrade/
chmod 600 ~/.omnitrade/*.json
```

---

### 📊 Statistics

- **Total Tools:** 35 (up from 16)
- **New Tools:** 19
- **New Files:** 6 tool files
- **Lines Added:** ~2,890
- **Feature Categories:** 7 (Core Trading, Advanced Trading, Alerts, Charts, Portfolio, DCA, Conditional Orders)

---

### 🎯 Future Enhancements (Not in this release)

**Considered but not implemented:**
- News Sentiment Integration (requires external API keys)
- Wallet Tracking (requires blockchain API integration)

These features can be added in future releases if there's demand.

---

### 🐛 Known Limitations

- **DCA Execution:** Requires external scheduler (cron) or manual execution via `execute_dca_orders`
- **Alert Checking:** Alerts only checked when `check_alerts` is called
- **Conditional Orders:** Must call `check_conditional_orders` periodically
- **OHLCV Support:** Charts only work on exchanges that support OHLCV data
- **Portfolio History:** USD values depend on availability of USDT/USD trading pairs

**Recommendation:** Use a cron job to periodically run:
```bash
# Check alerts every 5 minutes
*/5 * * * * omnitrade-mcp check_alerts

# Execute DCA orders every hour
0 * * * * omnitrade-mcp execute_dca_orders

# Check conditional orders every 15 minutes
*/15 * * * * omnitrade-mcp check_conditional_orders
```

---

### 📝 Migration Notes

No breaking changes. All existing tools continue to work as before.

If upgrading from 0.7.x:
1. Run `npm update -g omnitrade-mcp`
2. Restart Claude Desktop
3. New tools will be available immediately
4. No config changes required

---

### 🙏 Credits

Built by the Connectry Labs team as part of the OmniTrade MCP project.

Thanks to:
- CCXT for exchange connectivity
- Anthropic for the MCP specification
- The open source community

---

## [0.7.5] - 2025-01-XX

### Initial Release
- Basic trading tools (get_balances, get_portfolio, get_prices, compare_prices)
- Order management (place_order, get_orders, cancel_order)
- Arbitrage detection (get_arbitrage, check_spread)
- Multi-exchange support (107 exchanges via CCXT)
- Security features (order limits, testnet mode, pair whitelists)
