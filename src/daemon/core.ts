/**
 * OmniTrade Background Daemon — Core Loop
 *
 * This module contains the actual daemon polling logic.
 * It is started as a detached child process by `omnitrade daemon start`.
 *
 * Responsibilities:
 *  - Write PID file on startup
 *  - Poll exchange prices on configurable interval (default 60s)
 *  - Check active price alerts against live prices
 *  - Fire notifications via all configured channels when alerts trigger
 *  - Clean up PID file on graceful shutdown
 *  - Log activity to ~/.omnitrade/daemon.log
 */

import { promises as fs, existsSync, appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import ccxt, { type Exchange } from 'ccxt';
import { loadConfig } from '../config/loader.js';
import { writePid, removePid } from './pid.js';
import { sendNotification } from '../notifications/index.js';

// ============================================
// Types
// ============================================

interface PriceAlert {
  id: string;
  symbol: string;
  exchange?: string;
  condition: 'above' | 'below';
  targetPrice: number;
  createdAt: number;
  triggered?: boolean;
  triggeredAt?: number;
}

interface AlertsData {
  alerts: PriceAlert[];
}

// ============================================
// File paths
// ============================================

const OMNITRADE_DIR = join(homedir(), '.omnitrade');
const ALERTS_FILE = join(OMNITRADE_DIR, 'alerts.json');
const LOG_FILE = join(OMNITRADE_DIR, 'daemon.log');

// ============================================
// Logging
// ============================================

function log(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  // When running detached (daemon mode), stderr is redirected to the log file
  // by the parent process spawn. Writing to stderr IS writing to the log file.
  // We only also write via appendFileSync when stderr is a terminal (dev mode).
  process.stderr.write(line);
  if (process.stderr.isTTY) {
    // Running interactively (not detached) — also write to log file directly
    try {
      appendFileSync(LOG_FILE, line);
    } catch {
      // Log file write failures are silent
    }
  }
}

// ============================================
// Alert loading / saving
// ============================================

async function loadAlerts(): Promise<AlertsData> {
  if (!existsSync(ALERTS_FILE)) {
    return { alerts: [] };
  }
  try {
    const raw = await fs.readFile(ALERTS_FILE, 'utf-8');
    return JSON.parse(raw) as AlertsData;
  } catch {
    return { alerts: [] };
  }
}

async function saveAlerts(data: AlertsData): Promise<void> {
  await fs.mkdir(OMNITRADE_DIR, { recursive: true });
  await fs.writeFile(ALERTS_FILE, JSON.stringify(data, null, 2));
}

// ============================================
// Exchange utilities
// ============================================

function createPublicExchange(name: string): Exchange | null {
  const id = name.toLowerCase();
  if (!ccxt.exchanges.includes(id)) return null;
  const ExchangeClass = (ccxt as unknown as Record<string, new (opts: object) => Exchange>)[id];
  if (!ExchangeClass) return null;
  return new ExchangeClass({ enableRateLimit: true });
}

// ============================================
// Core poll function
// ============================================

async function pollAndCheckAlerts(
  exchanges: Map<string, Exchange>,
  config: Awaited<ReturnType<typeof loadConfig>>
): Promise<void> {
  const data = await loadAlerts();
  const activeAlerts = data.alerts.filter((a) => !a.triggered);

  if (activeAlerts.length === 0) {
    log(`Poll complete — no active alerts`);
    return;
  }

  log(`Checking ${activeAlerts.length} active alert(s)...`);
  const triggered: PriceAlert[] = [];

  for (const alert of activeAlerts) {
    // Determine which exchanges to check
    const exchangesToCheck: [string, Exchange][] = alert.exchange
      ? ([[alert.exchange, exchanges.get(alert.exchange)]] as [string, Exchange][]).filter(([, ex]) => !!ex)
      : Array.from(exchanges.entries());

    for (const [exchangeName, exchange] of exchangesToCheck) {
      if (!exchange) continue;

      try {
        const ticker = await exchange.fetchTicker(alert.symbol);
        const currentPrice = ticker.last ?? 0;

        const conditionMet =
          (alert.condition === 'below' && currentPrice <= alert.targetPrice) ||
          (alert.condition === 'above' && currentPrice >= alert.targetPrice);

        if (conditionMet) {
          log(`🚨 ALERT TRIGGERED: ${alert.symbol} ${alert.condition} $${alert.targetPrice} on ${exchangeName} (current: $${currentPrice})`);
          alert.triggered = true;
          alert.triggeredAt = Date.now();
          alert.exchange = exchangeName;
          triggered.push(alert);

          // Fire notifications
          const title = `OmniTrade Alert: ${alert.symbol}`;
          const message = `${alert.symbol} is ${alert.condition} $${alert.targetPrice.toFixed(2)}\nCurrent price: $${currentPrice.toFixed(2)} on ${exchangeName}`;

          const results = await sendNotification(config.notifications, title, message);
          for (const result of results) {
            if (result.success) {
              log(`  ✓ Notification sent via ${result.channel}`);
            } else {
              log(`  ✗ Notification failed via ${result.channel}: ${result.error}`);
            }
          }

          if (results.length === 0) {
            log(`  ℹ No notification channels configured. Run 'omnitrade setup' to add Telegram/Discord/native.`);
          }

          break; // Alert triggered — don't check other exchanges for same alert
        }
      } catch (err) {
        log(`  ⚠ Failed to fetch ${alert.symbol} from ${exchangeName}: ${(err as Error).message}`);
      }
    }
  }

  if (triggered.length > 0) {
    await saveAlerts(data);
    log(`${triggered.length} alert(s) triggered and saved`);
  } else {
    log(`Poll complete — no conditions met`);
  }
}

// ============================================
// Main daemon entry point
// ============================================

export async function startDaemon(): Promise<void> {
  // Write PID file
  writePid(process.pid);
  log(`OmniTrade daemon started (PID: ${process.pid})`);

  // Load config
  type OmniConfig = ReturnType<typeof loadConfig>;
  let config: OmniConfig;
  try {
    config = loadConfig();
    log(`Config loaded — exchanges: ${Object.keys(config.exchanges).join(', ')}`);
  } catch (err) {
    log(`FATAL: Failed to load config: ${(err as Error).message}`);
    removePid();
    process.exit(1);
    return; // TypeScript flow control
  }

  // Initialize exchange connections (public price data doesn't need credentials,
  // but we have them configured so use authenticated clients for reliability)
  const exchanges = new Map<string, Exchange>();
  for (const [name] of Object.entries(config.exchanges)) {
    const ex = createPublicExchange(name);
    if (ex) {
      exchanges.set(name, ex);
      log(`Exchange ready: ${name}`);
    } else {
      log(`⚠ Could not initialize exchange: ${name}`);
    }
  }

  if (exchanges.size === 0) {
    log(`FATAL: No exchanges could be initialized`);
    removePid();
    process.exit(1);
  }

  const pollInterval = (config.daemon?.pollInterval ?? 60) * 1000; // Convert to ms
  log(`Poll interval: ${config.daemon?.pollInterval ?? 60}s`);

  const enabledChannels: string[] = [];
  const nc = config.notifications;
  if (nc?.telegram?.enabled && nc.telegram.botToken && nc.telegram.chatId) enabledChannels.push('telegram');
  if (nc?.discord?.enabled && nc.discord.webhookUrl) enabledChannels.push('discord');
  if (nc?.native?.enabled) enabledChannels.push('native');
  log(`Notification channels: ${enabledChannels.length > 0 ? enabledChannels.join(', ') : 'none'}`);

  // Graceful shutdown handler
  const shutdown = (signal: string) => {
    log(`Received ${signal} — shutting down gracefully`);
    removePid();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Initial poll immediately on start
  try {
    await pollAndCheckAlerts(exchanges, config);
  } catch (err) {
    log(`Poll error: ${(err as Error).message}`);
  }

  // Schedule regular polling
  const timer = setInterval(async () => {
    try {
      await pollAndCheckAlerts(exchanges, config);
    } catch (err) {
      log(`Poll error: ${(err as Error).message}`);
    }
  }, pollInterval);

  // Keep the process alive
  timer.unref(); // Allow process to exit if nothing else is holding it
  // But we still want it running, so re-ref it:
  timer.ref();

  log(`Daemon running — next poll in ${config.daemon?.pollInterval ?? 60}s`);
}
