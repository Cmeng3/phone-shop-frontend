import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';

const localPython = path.resolve('../venv/Scripts/python.exe');
const python = process.env.PYTHON || (existsSync(localPython) ? localPython : 'python');
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  timeout: 45000,
  workers: 1,
  use: {
    actionTimeout: 10000,
    baseURL: 'http://127.0.0.1:8011',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 1100 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [['list']],
  webServer: {
    command: `"${python}" tests/start-backend.py`,
    url: 'http://127.0.0.1:8011',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
