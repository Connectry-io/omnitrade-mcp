import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ExchangeManager } from '../exchanges/manager.js';
import type { Price, PriceComparison, ToolResponse } from '../types/index.js';

/**
 * Register price-related MCP tools
 */
export function registerPriceTools(
  server: McpServer,
  exchangeManager: ExchangeManager
): void {
  // Get current prices
  server.tool(
    'get_prices',
    'Get current market prices for a trading pair across exchanges. Returns bid, ask, and last traded price.',
    {
      symbol: z
        .string()
        .describe('Trading pair in format "BASE/QUOTE" (e.g., "BTC/USDT", "ETH/USD")'),
      exchange: z
        .string()
        .optional()
        .describe('Specific exchange name. Omit to query all exchanges.'),
    },
    async ({ symbol, exchange }): Promise<ToolResponse> => {
      const prices: Price[] = [];
      const errors: string[] = [];

      // Normalize symbol format
      const normalizedSymbol = symbol.toUpperCase();

      // Determine which exchanges to query
      const exchangesToQuery = exchange
        ? [[exchange.toLowerCase(), exchangeManager.get(exchange)] as const].filter(
            ([, ex]) => ex !== undefined
          )
        : Array.from(exchangeManager.getAll().entries());

      if (exchangesToQuery.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: exchange
                ? `Exchange not configured: ${exchange}`
                : 'No exchanges configured.',
            },
          ],
          isError: true,
        };
      }

      // Query each exchange
      for (const [name, ex] of exchangesToQuery) {
        if (!ex) continue;

        try {
          const ticker = await ex.fetchTicker(normalizedSymbol);

          prices.push({
            exchange: name,
            symbol: normalizedSymbol,
            bid: ticker.bid ?? 0,
            ask: ticker.ask ?? 0,
            last: ticker.last ?? 0,
            timestamp: ticker.timestamp ?? Date.now(),
          });
        } catch (error) {
          // Symbol might not exist on this exchange - don't treat as fatal
          errors.push(`${name}: ${(error as Error).message}`);
        }
      }

      if (prices.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No prices found for ${normalizedSymbol}. Errors: ${errors.join('; ')}`,
            },
          ],
          isError: true,
        };
      }

      // Sort by last price
      prices.sort((a, b) => b.last - a.last);

      const result = {
        symbol: normalizedSymbol,
        priceCount: prices.length,
        prices,
        errors: errors.length > 0 ? errors : undefined,
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

  // Compare prices across exchanges
  server.tool(
    'compare_prices',
    'Find the best price for buying or selling across all connected exchanges. Identifies arbitrage opportunities.',
    {
      symbol: z
        .string()
        .describe('Trading pair in format "BASE/QUOTE" (e.g., "BTC/USDT")'),
      side: z
        .enum(['buy', 'sell'])
        .describe('"buy" to find lowest ask price, "sell" to find highest bid price'),
    },
    async ({ symbol, side }): Promise<ToolResponse> => {
      const normalizedSymbol = symbol.toUpperCase();
      const prices: Price[] = [];

      // Fetch prices from all exchanges
      for (const [name, ex] of exchangeManager.getAll()) {
        try {
          const ticker = await ex.fetchTicker(normalizedSymbol);

          if (ticker.bid && ticker.ask) {
            prices.push({
              exchange: name,
              symbol: normalizedSymbol,
              bid: ticker.bid,
              ask: ticker.ask,
              last: ticker.last ?? 0,
              timestamp: ticker.timestamp ?? Date.now(),
            });
          }
        } catch {
          // Skip exchanges that don't have this pair
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

      if (prices.length === 1) {
        const only = prices[0]!;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  recommendation: `${side.toUpperCase()} on ${only.exchange} (only exchange with this pair)`,
                  bestExchange: only.exchange,
                  bestPrice: side === 'buy' ? only.ask : only.bid,
                  note: 'Only one exchange has this trading pair.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Sort by best price
      const sorted = [...prices].sort((a, b) => {
        if (side === 'buy') {
          // For buying, lower ask is better
          return a.ask - b.ask;
        } else {
          // For selling, higher bid is better
          return b.bid - a.bid;
        }
      });

      const best = sorted[0]!;
      const worst = sorted[sorted.length - 1]!;
      const bestPrice = side === 'buy' ? best.ask : best.bid;
      const worstPrice = side === 'buy' ? worst.ask : worst.bid;
      const savings = Math.abs(worstPrice - bestPrice);
      const savingsPercent = (savings / worstPrice) * 100;

      const comparison: PriceComparison = {
        recommendation: `${side.toUpperCase()} on ${best.exchange} for best price`,
        bestExchange: best.exchange,
        bestPrice,
        allPrices: sorted.map((p) => ({
          exchange: p.exchange,
          price: side === 'buy' ? p.ask : p.bid,
        })),
        savings: {
          amount: parseFloat(savings.toFixed(8)),
          percent: savingsPercent.toFixed(2) + '%',
          vs: worst.exchange,
        },
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(comparison, null, 2),
          },
        ],
      };
    }
  );
}
