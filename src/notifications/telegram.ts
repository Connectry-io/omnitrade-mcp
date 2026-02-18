/**
 * Telegram notification channel
 * Uses Telegram Bot API via built-in https — zero extra dependencies
 */

import { request } from 'https';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegram(
  config: TelegramConfig,
  title: string,
  message: string
): Promise<void> {
  const text = `🔔 *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`;

  const body = JSON.stringify({
    chat_id: config.chatId,
    text,
    parse_mode: 'MarkdownV2',
  });

  await httpPost(
    `https://api.telegram.org/bot${config.botToken}/sendMessage`,
    body,
    { 'Content-Type': 'application/json' }
  );
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Simple HTTPS POST using built-in node https module
 */
function httpPost(
  url: string,
  body: string,
  headers: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Verify Telegram credentials work by calling getMe
 */
export async function verifyTelegram(config: TelegramConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`https://api.telegram.org/bot${config.botToken}/getMe`);
    const options = {
      hostname: parsed.hostname,
      port: 443,
      path: parsed.pathname,
      method: 'GET',
    };

    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data) as { ok: boolean; result?: { username?: string }; description?: string };
          if (json.ok && json.result) {
            resolve(json.result.username || 'bot');
          } else {
            reject(new Error(json.description || 'Invalid bot token'));
          }
        } catch {
          reject(new Error('Failed to parse Telegram response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
