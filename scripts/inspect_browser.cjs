const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3010/login');await page.locator('button[type=submit]').click();await page.waitForURL('**/dashboard');await page.waitForTimeout(2000);
 await page.screenshot({path:'docs/screenshots/initial-dashboard.png',fullPage:true});console.log(JSON.stringify({title:await page.title(),errors,heading:await page.locator('h1').allTextContents()}));await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1);});
