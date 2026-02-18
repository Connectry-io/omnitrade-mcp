/**
 * Notification dispatcher
 * Routes alerts to all configured notification channels
 */

import type { NotificationConfig } from '../types/index.js';
import { sendTelegram } from './telegram.js';
import { sendDiscord } from './discord.js';
import { sendNative } from './native.js';

export interface NotificationResult {
  channel: string;
  success: boolean;
  error?: string;
}

/**
 * Send a notification to all configured and enabled channels
 * 
 * Fires all channels in parallel and collects results.
 * Individual channel failures don't stop others from firing.
 */
export async function sendNotification(
  config: NotificationConfig | undefined,
  title: string,
  message: string
): Promise<NotificationResult[]> {
  if (!config) {
    return [];
  }

  const tasks: Promise<NotificationResult>[] = [];

  // Telegram
  if (config.telegram?.enabled && config.telegram.botToken && config.telegram.chatId) {
    tasks.push(
      sendTelegram(
        { botToken: config.telegram.botToken, chatId: config.telegram.chatId },
        title,
        message
      )
        .then(() => ({ channel: 'telegram', success: true }))
        .catch((err: Error) => ({ channel: 'telegram', success: false, error: err.message }))
    );
  }

  // Discord
  if (config.discord?.enabled && config.discord.webhookUrl) {
    tasks.push(
      sendDiscord({ webhookUrl: config.discord.webhookUrl }, title, message)
        .then(() => ({ channel: 'discord', success: true }))
        .catch((err: Error) => ({ channel: 'discord', success: false, error: err.message }))
    );
  }

  // Native OS notifications
  if (config.native?.enabled) {
    tasks.push(
      sendNative(title, message)
        .then(() => ({ channel: 'native', success: true }))
        .catch((err: Error) => ({ channel: 'native', success: false, error: err.message }))
    );
  }

  if (tasks.length === 0) {
    return [];
  }

  return Promise.all(tasks);
}

/**
 * Check which notification channels are configured and enabled
 */
export function getEnabledChannels(config: NotificationConfig | undefined): string[] {
  if (!config) return [];

  const channels: string[] = [];
  if (config.telegram?.enabled && config.telegram.botToken && config.telegram.chatId) {
    channels.push('telegram');
  }
  if (config.discord?.enabled && config.discord.webhookUrl) {
    channels.push('discord');
  }
  if (config.native?.enabled) {
    channels.push('native');
  }
  return channels;
}
