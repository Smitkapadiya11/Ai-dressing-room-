import { chromium } from 'playwright';

const B = 'http://localhost:3410';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required'],
});
const errs = [];

// ---- kiosk flow, 1080x1920 portrait ----
const kiosk = await browser.newContext({ viewport:{width:1080,height:1920}, deviceScaleFactor:1, permissions:['camera'] });
const p = await kiosk.newPage();
p.on('console', m => m.type()==='error' && errs.push('[kiosk] '+m.text()));
p.on('pageerror', e => errs.push('[kiosk pageerror] '+e.message));

await p.goto(B, { waitUntil:'networkidle' });
await p.waitForTimeout(2200);
await p.screenshot({ path:'/tmp/shots/01-attract.png' });

await p.click('body');                       // attract -> consent
await p.waitForTimeout(900);
await p.screenshot({ path:'/tmp/shots/02-consent.png' });

await p.getByText('I understand — begin').click();
await p.waitForTimeout(1800);
await p.screenshot({ path:'/tmp/shots/03-mirror.png' });

await p.getByText('Crimson Zardozi Lehenga').first().click();
await p.waitForTimeout(700);
await p.screenshot({ path:'/tmp/shots/04-countdown.png' });

await p.waitForTimeout(2600);                 // countdown finishes, capture
await p.screenshot({ path:'/tmp/shots/05-working.png' });

await p.waitForSelector('text=Try another', { timeout:20000 });
await p.waitForTimeout(1600);                 // let the 1100ms hero land
await p.screenshot({ path:'/tmp/shots/06-result.png' });

await p.getByText('Compare').click();
await p.waitForTimeout(600);
await p.screenshot({ path:'/tmp/shots/07-compare.png' });

// second garment, then the look book
await p.getByText('Try another').click();
await p.waitForTimeout(900);
await p.getByText('Ivory Banarasi Saree').first().click();
await p.waitForSelector('text=Try another', { timeout:25000 });
await p.waitForTimeout(1400);
await p.getByText('Try another').click();
await p.waitForTimeout(900);
await p.getByText(/looks tried/).click();
await p.waitForTimeout(1000);
await p.screenshot({ path:'/tmp/shots/12-lookbook.png' });

// ---- shop side, desktop ----
const shop = await browser.newContext({ viewport:{width:1440,height:1000} });
for (const [route,name] of [['/shop','08-today'],['/shop/collection','09-collection'],['/shop/month','10-month']]) {
  const q = await shop.newPage();
  q.on('pageerror', e => errs.push(`[${route}] `+e.message));
  q.on('console', m => m.type()==='error' && errs.push(`[${route}] `+m.text()));
  const r = await q.goto(B+route, { waitUntil:'networkidle' });
  if (r.status() !== 200) errs.push(`${route} -> HTTP ${r.status()}`);
  await q.waitForTimeout(900);
  await q.screenshot({ path:`/tmp/shots/${name}.png`, fullPage:true });
  await q.close();
}

// ---- phone view of a shared look ----
const phone = await browser.newContext({ viewport:{width:390,height:844} });
const ph = await phone.newPage();
await ph.goto(B+'/look/nonexistent', { waitUntil:'networkidle' });
await ph.screenshot({ path:'/tmp/shots/11-look-expired.png' });

await browser.close();
console.log(errs.length ? 'ERRORS:\n'+errs.join('\n') : 'NO CONSOLE ERRORS');
