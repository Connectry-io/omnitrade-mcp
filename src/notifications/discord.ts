/**
 * Discord webhook notification channel
 * Uses Discord Webhook API via built-in https — zero extra dependencies
 */

import { request } from 'https';

export interface DiscordConfig {
  webhookUrl: string;
}

/**
 * Send a message via Discord webhook
 */
export async function sendDiscord(
  config: DiscordConfig,
  title: string,
  message: string
): Promise<void> {
  const body = JSON.stringify({
    embeds: [
      {
        title: `🔔 ${title}`,
        description: message,
        color: 0x00d4aa, // OmniTrade teal
        timestamp: new Date().toISOString(),
        footer: {
          text: 'OmniTrade by Connectry',
        },
      },
    ],
  });

  await httpPost(config.webhookUrl, body, { 'Content-Type': 'application/json' });
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
        // Discord returns 204 No Content on success
        if (res.statusCode && (res.statusCode === 204 || (res.statusCode >= 200 && res.statusCode < 300))) {
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
 * Verify Discord webhook works by sending a test ping
 */
export async function verifyDiscord(config: DiscordConfig): Promise<void> {
  // Discord doesn't have a dedicated "test" endpoint for webhooks
  // We GET the webhook URL to validate it exists
  return new Promise((resolve, reject) => {
    const parsed = new URL(config.webhookUrl);
    if (!parsed.hostname.endsWith('discord.com') && !parsed.hostname.endsWith('discordapp.com')) {
      reject(new Error('Webhook URL must be a Discord URL'));
      return;
    }

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
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Invalid webhook: HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
