/**
 * PID file management for the OmniTrade daemon
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const OMNITRADE_DIR = join(homedir(), '.omnitrade');
export const PID_FILE = join(OMNITRADE_DIR, 'daemon.pid');
export const UPTIME_FILE = join(OMNITRADE_DIR, 'daemon-started.txt');

/**
 * Write the current process PID to the PID file.
 * Guards with mkdirSync so the directory is always present before writing.
 */
export function writePid(pid: number): void {
  mkdirSync(OMNITRADE_DIR, { recursive: true });
  writeFileSync(PID_FILE, String(pid), 'utf-8');
  writeFileSync(UPTIME_FILE, String(Date.now()), 'utf-8');
}

/**
 * Read PID from file. Returns null if file doesn't exist or is invalid.
 */
export function readPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  try {
    const raw = readFileSync(PID_FILE, 'utf-8').trim();
    const pid = parseInt(raw, 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Remove PID file (called on clean shutdown)
 */
export function removePid(): void {
  try {
    if (existsSync(PID_FILE)) unlinkSync(PID_FILE);
    if (existsSync(UPTIME_FILE)) unlinkSync(UPTIME_FILE);
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Check if a process with the given PID is still running
 */
export function isProcessRunning(pid: number): boolean {
  try {
    // Signal 0 = check if process exists, doesn't actually send a signal
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get daemon uptime in seconds. Returns null if not running or no uptime file.
 */
export function getDaemonUptime(): number | null {
  if (!existsSync(UPTIME_FILE)) return null;
  try {
    const started = parseInt(readFileSync(UPTIME_FILE, 'utf-8').trim(), 10);
    if (isNaN(started)) return null;
    return Math.floor((Date.now() - started) / 1000);
  } catch {
    return null;
  }
}

/**
 * Format uptime seconds as human-readable string
 */
export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
