import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',timeout:60000,workers:1,retries:0,
 use:{baseURL:process.env.E2E_BASE_URL||'http://localhost:3010',headless:true,trace:'retain-on-failure'},
 reporter:[['list'],['json',{outputFile:'docs/evidence/playwright-results.json'}]]});
