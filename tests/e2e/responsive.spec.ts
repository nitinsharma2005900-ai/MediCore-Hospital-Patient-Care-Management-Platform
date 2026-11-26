import {test,expect} from '@playwright/test';
const roles=[['patient','Patient Portal'],['doctor','Clinical Workspace'],['receptionist','Reception'],['nurse','Nurse'],['labtech','Lab'],['billing','Billing'],['admin','Operations']];
const sessionCache=new Map<string,Record<string,string>>();
for(const [role] of roles)for(const width of [360,390,768,1024,1440,1920]){
 test(`${role} dashboard at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  const failures:string[]=[];page.on('response',r=>{if(r.status()>=400&&/\/api\/v1\/|\/analytics\//.test(r.url()))failures.push(`${r.status()} ${new URL(r.url()).pathname}`);});
  if(sessionCache.has(role)){
    await page.addInitScript(data=>{for(const [k,v] of Object.entries(data))sessionStorage.setItem(k,v);},sessionCache.get(role)!);await page.goto('/dashboard');
  }else{
    await page.goto('/login');await page.locator('input[type="email"]').fill(`${role}@medicore.health`);await page.locator('input[type="password"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();await expect(page).toHaveURL(/\/dashboard$/);
    sessionCache.set(role,await page.evaluate(()=>Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)!]))));
  }
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('button',{name:'Notifications',exact:true})).toBeVisible();
  await page.waitForTimeout(1000);
  const dimensions=await page.locator('main').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client+2);
  expect(errors).toEqual([]);expect(failures).toEqual([]);
  if(width<1024){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await expect(page.getByRole('button',{name:'Close navigation',exact:true})).toBeVisible();await page.keyboard.press('Escape');}
  if(width===390||width===1440)await page.screenshot({path:`docs/screenshots/${role}-${width}.png`,fullPage:true});
 });
}
test('unauthenticated nested role route redirects to login',async({page})=>{await page.goto('/dashboard/doctor');await expect(page).toHaveURL(/\/login$/);});
test('patient cannot open administrator dashboard',async({page})=>{
 await page.goto('/login');await page.locator('input[type=email]').fill('patient@medicore.health');await page.locator('input[type=password]').fill('Password123!');await page.locator('button[type=submit]').click();await expect(page).toHaveURL(/\/dashboard$/);await page.goto('/dashboard/admin');await expect(page).toHaveURL(/\/dashboard$/);await expect(page.getByText('Patient Portal',{exact:true})).toBeVisible();
});
test('patient books a real available appointment in the browser',async({page})=>{
 await page.goto('/login');await page.locator('input[type=email]').fill('patient@medicore.health');await page.locator('input[type=password]').fill('Password123!');await page.locator('button[type=submit]').click();await expect(page).toHaveURL(/\/dashboard$/);
 await page.getByRole('link',{name:'Book Specialist',exact:true}).click();await expect(page).toHaveURL(/\/appointments\/book$/);
 await page.locator('textarea').fill('Synthetic browser scheduling verification');
 await expect(page.getByRole('button',{name:/Confirm.*Booking|Book Appointment|Confirm.*Appointment/i})).toBeEnabled();
 await page.getByRole('button',{name:/Confirm.*Booking|Book Appointment|Confirm.*Appointment/i}).click();await expect(page.getByText(/Appointment booked successfully/)).toBeVisible();
 await page.screenshot({path:'docs/screenshots/appointment-booking.png',fullPage:true});
});
