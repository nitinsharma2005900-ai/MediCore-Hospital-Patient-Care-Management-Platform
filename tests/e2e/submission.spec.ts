import{test,expect}from'@playwright/test';
for(const width of [390,1440])test(`landing page at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.getByRole('link',{name:'MediCore'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
 await page.screenshot({path:`docs/screenshots/landing-${width}.png`,fullPage:true});
});
test('authorized invoice produces a printable PDF',async({page})=>{
 await page.goto('/login');await page.locator('input[type=email]').fill('billing@medicore.health');await page.locator('input[type=password]').fill('Password123!');await page.locator('button[type=submit]').click();await expect(page).toHaveURL(/\/dashboard$/);
 const invoice=await page.evaluate(async()=>{const r=await fetch('/api/v1/billing/invoices',{headers:{Authorization:'Bearer '+sessionStorage.getItem('medicore_token')}});return(await r.json()).data[0].id;});
 await page.goto('/invoices/'+invoice);await expect(page.getByRole('button',{name:'Print invoice'})).toBeEnabled();await expect(page.getByText(/Total: \$/)).toBeVisible();
 await page.emulateMedia({media:'print'});await page.pdf({path:'.runtime/sample-invoice.pdf',format:'A4'});
});
