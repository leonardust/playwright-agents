#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function candidatePaths() {
  const paths = [];
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) paths.push(process.env.PLAYWRIGHT_BROWSERS_PATH);
  if (process.env.LOCALAPPDATA) paths.push(path.join(process.env.LOCALAPPDATA, 'ms-playwright'));
  if (process.env.USERPROFILE)
    paths.push(path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright'));
  if (process.env.HOME) paths.push(path.join(process.env.HOME, '.cache', 'ms-playwright'));
  if (process.env.USERPROFILE)
    paths.push(path.join(process.env.USERPROFILE, '.cache', 'ms-playwright'));
  return paths.filter(Boolean);
}

const candidates = candidatePaths();
for (const p of candidates) {
  if (fs.existsSync(p)) {
    console.log('Playwright browsers already installed at', p);
    process.exit(0);
  }
}

console.log('Playwright browsers not found in candidates:', candidates.join(', '));
console.log('Installing Playwright browsers...');
try {
  execSync('npx playwright install --with-deps', { stdio: 'inherit' });
  console.log('Playwright browsers installed successfully.');
} catch (err) {
  console.error('Failed to install Playwright browsers:', err.message || err);
  process.exit(1);
}
