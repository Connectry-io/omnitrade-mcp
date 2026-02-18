/**
 * Native OS notification channel
 * Zero setup — uses OS-native notification systems via child_process
 * 
 * macOS:   osascript (built-in)
 * Linux:   notify-send (libnotify, common on most distros)
 * Windows: PowerShell (built-in)
 */

import { exec } from 'child_process';

/**
 * Send a native OS desktop notification
 */
export async function sendNative(title: string, message: string): Promise<void> {
  const platform = process.platform;

  switch (platform) {
    case 'darwin':
      await sendMacOS(title, message);
      break;
    case 'linux':
      await sendLinux(title, message);
      break;
    case 'win32':
      await sendWindows(title, message);
      break;
    default:
      throw new Error(`Native notifications not supported on platform: ${platform}`);
  }
}

/**
 * macOS notification via osascript
 */
function sendMacOS(title: string, message: string): Promise<void> {
  // Escape single quotes for AppleScript
  const safeTitle = title.replace(/'/g, "'\\''");
  const safeMsg = message.replace(/'/g, "'\\''");
  const script = `display notification "${safeMsg}" with title "${safeTitle}" sound name "Default"`;
  return runCommand(`osascript -e '${script}'`);
}

/**
 * Linux notification via notify-send
 */
function sendLinux(title: string, message: string): Promise<void> {
  // Escape for shell
  const safeTitle = shellEscape(title);
  const safeMsg = shellEscape(message);
  return runCommand(`notify-send ${safeTitle} ${safeMsg} --icon=dialog-information --expire-time=10000`);
}

/**
 * Windows notification via PowerShell
 */
function sendWindows(title: string, message: string): Promise<void> {
  // Escape for PowerShell strings
  const safeTitle = title.replace(/"/g, '`"').replace(/'/g, "''");
  const safeMsg = message.replace(/"/g, '`"').replace(/'/g, "''");
  const ps = [
    `Add-Type -AssemblyName System.Windows.Forms`,
    `$n = New-Object System.Windows.Forms.NotifyIcon`,
    `$n.Icon = [System.Drawing.SystemIcons]::Information`,
    `$n.BalloonTipTitle = "${safeTitle}"`,
    `$n.BalloonTipText = "${safeMsg}"`,
    `$n.Visible = $True`,
    `$n.ShowBalloonTip(10000)`,
    `Start-Sleep -Seconds 12`,
    `$n.Dispose()`,
  ].join('; ');
  return runCommand(`powershell -Command "${ps}"`);
}

/**
 * Shell-escape a string value
 */
function shellEscape(str: string): string {
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Run a shell command, resolving on success, rejecting on error
 */
function runCommand(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 15000 }, (error) => {
      if (error) {
        reject(new Error(`Native notification failed: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Check if native notifications are available on this system
 */
export async function checkNativeAvailable(): Promise<boolean> {
  const platform = process.platform;
  
  if (platform === 'darwin' || platform === 'win32') {
    return true; // osascript and PowerShell are always available
  }

  if (platform === 'linux') {
    // Check if notify-send is installed
    return new Promise((resolve) => {
      exec('which notify-send', (error) => {
        resolve(!error);
      });
    });
  }

  return false;
}
