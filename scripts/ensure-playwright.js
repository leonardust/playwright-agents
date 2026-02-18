#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getCacheDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;
  return path.join(home, '.cache', 'ms-playwright');
}

const cacheDir = getCacheDir();
if (!cacheDir) {
  console.error('Cannot determine home directory to check Playwright cache.');
  process.exit(1);
}

if (fs.existsSync(cacheDir)) {
  console.log('Playwright browsers already installed at', cacheDir);
  process.exit(0);
}

console.log('Playwright browsers not found, installing...');
try {
  execSync('npx playwright install --with-deps', { stdio: 'inherit' });
  console.log('Playwright browsers installed successfully.');
} catch (err) {
  console.error('Failed to install Playwright browsers:', err.message || err);
  process.exit(1);
}
