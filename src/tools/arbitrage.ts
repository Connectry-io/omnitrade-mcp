import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ExchangeManager } from '../exchanges/manager.js';
import type { ArbitrageOpportunity, ArbitrageResult, ToolResponse } from '../types/index.js';

// Common trading pairs to check for arbitrage
const DEFAULT_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'DOT/USDT',
  'MATIC/USDT',
  'LTC/USDT',
];

/**
 * Register arbitrage-related MCP tools
 */
export function registerArbitrageTools(
  server: McpServer,
  exchangeManager: ExchangeManager
): void {
  server.tool(
    'get_arbitrage',
    'Find arbitrage opportunities by comparing prices across exchanges. Identifies pairs where you can buy low on one exchange and sell high on another.',
    {
      symbols: z
        .array(z.string())
        .optional()
        .describe(
          'Trading pairs to check (e.g., ["BTC/USDT", "ETH/USDT"]). Defaults to top 10 pairs.'
        ),
      minSpread: z
        .number()
        .min(0)
        .max(100)
        .default(0.5)
        .describe('Minimum spread percentage to report (default: 0.5%)'),
    },
    async ({ symbols, minSpread }): Promise<ToolResponse> => {
      const checkSymbols = symbols ?? DEFAULT_SYMBOLS;
      const opportunities: ArbitrageOpportunity[] = [];
      const exchangeNames = exchangeManager.getNames();

      if (exchangeNames.length < 2) {
        return {
          content: [
            {
              type: 'text',
              text: 'Arbitrage requires at least 2 exchanges configured. Currently have: ' +
                exchangeNames.length,
            },
          ],
          isError: true,
        };
      }

      // Check each symbol
      for (const symbol of checkSymbols) {
        const normalizedSymbol = symbol.toUpperCase();
        const prices: Array<{ exchange: string; bid: number; ask: number }> = [];

        // Fetch prices from all exchanges
        for (const [name, ex] of exchangeManager.getAll()) {
          try {
            const ticker = await ex.fetchTicker(normalizedSymbol);

            if (ticker.bid && ticker.ask && ticker.bid > 0 && ticker.ask > 0) {
              prices.push({
                exchange: name,
                bid: ticker.bid,
                ask: ticker.ask,
              });
            }
          } catch {
            // Symbol might not exist on this exchange
            continue;
          }
        }

        // Need at least 2 exchanges with this pair
        if (prices.length < 2) continue;

        // Find best buy (lowest ask) and best sell (highest bid)
        const bestBuy = prices.reduce((a, b) => (a.ask < b.ask ? a : b));
        const bestSell = prices.reduce((a, b) => (a.bid > b.bid ? a : b));

        // Check if arbitrage exists (can buy for less than sell price)
        if (bestSell.bid > bestBuy.ask) {
          const spread = bestSell.bid - bestBuy.ask;
          const spreadPercent = (spread / bestBuy.ask) * 100;

          // Only report if spread meets minimum threshold
          if (spreadPercent >= minSpread) {
            opportunities.push({
              symbol: normalizedSymbol,
              buyExchange: bestBuy.exchange,
              buyPrice: bestBuy.ask,
              sellExchange: bestSell.exchange,
              sellPrice: bestSell.bid,
              spreadPercent: parseFloat(spreadPercent.toFixed(3)),
              potentialProfit: parseFloat(spread.toFixed(8)),
            });
          }
        }
      }

      // Sort by spread percentage (best opportunities first)
      opportunities.sort((a, b) => b.spreadPercent - a.spreadPercent);

      const result: ArbitrageResult = {
        found: opportunities.length,
        opportunities,
        note:
          'Spreads shown BEFORE trading fees. Always account for:\n' +
          '• Trading fees on both exchanges (typically 0.1-0.2% each)\n' +
          '• Transfer fees if moving funds between exchanges\n' +
          '• Slippage on larger orders\n' +
          '• Price movement during execution',
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // Quick spread check for a single pair
  server.tool(
    'check_spread',
    'Check the price spread for a single trading pair across all exchanges.',
    {
      symbol: z.string().describe('Trading pair to check (e.g., "BTC/USDT")'),
    },
    async ({ symbol }): Promise<ToolResponse> => {
      const normalizedSymbol = symbol.toUpperCase();
      const prices: Array<{
        exchange: string;
        bid: number;
        ask: number;
        spread: number;
        spreadPercent: number;
      }> = [];

      for (const [name, ex] of exchangeManager.getAll()) {
        try {
          const ticker = await ex.fetchTicker(normalizedSymbol);

          if (ticker.bid && ticker.ask) {
            const spread = ticker.ask - ticker.bid;
            const spreadPercent = (spread / ticker.bid) * 100;

            prices.push({
              exchange: name,
              bid: ticker.bid,
              ask: ticker.ask,
              spread: parseFloat(spread.toFixed(8)),
              spreadPercent: parseFloat(spreadPercent.toFixed(3)),
            });
          }
        } catch {
          continue;
        }
      }

      if (prices.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No prices found for ${normalizedSymbol} on any exchange.`,
            },
          ],
          isError: true,
        };
      }

      // Sort by ask price (best buy price first)
      prices.sort((a, b) => a.ask - b.ask);

      // Calculate cross-exchange arbitrage if possible
      let arbitrage = null;
      if (prices.length >= 2) {
        const bestBuy = prices[0]!; // Lowest ask
        const bestSell = prices.reduce((a, b) => (a.bid > b.bid ? a : b)); // Highest bid

        if (bestSell.bid > bestBuy.ask && bestSell.exchange !== bestBuy.exchange) {
          const profit = bestSell.bid - bestBuy.ask;
          const profitPercent = (profit / bestBuy.ask) * 100;

          arbitrage = {
            exists: true,
            buyOn: bestBuy.exchange,
            buyAt: bestBuy.ask,
            sellOn: bestSell.exchange,
            sellAt: bestSell.bid,
            profit: parseFloat(profit.toFixed(8)),
            profitPercent: parseFloat(profitPercent.toFixed(3)) + '%',
          };
        } else {
          arbitrage = {
            exists: false,
            reason: 'Best bid is not higher than best ask across exchanges',
          };
        }
      }

      const result = {
        symbol: normalizedSymbol,
        exchanges: prices.length,
        prices,
        arbitrage,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
