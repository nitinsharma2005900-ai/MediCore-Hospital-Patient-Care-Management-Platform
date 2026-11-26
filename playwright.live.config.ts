import {defineConfig} from '@playwright/test';
import base from './playwright.config';
if(!process.env.E2E_BASE_URL?.startsWith('https://'))throw new Error('Set E2E_BASE_URL to the live HTTPS frontend');
process.env.E2E_SCREENSHOT_DIR='docs/screenshots/live';
export default defineConfig({...base,timeout:120000,
 reporter:[['list'],['json',{outputFile:'docs/evidence/live-playwright-results.json'}]],
 use:{...base.use,baseURL:process.env.E2E_BASE_URL}});
