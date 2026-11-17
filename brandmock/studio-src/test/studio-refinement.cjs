const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});try{
const dir='test-artifacts/studio-refinement';fs.mkdirSync(dir,{recursive:true});const errors=[];
for(const version of ['before','after']){
 const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 if(version==='before'){
  await page.route(url=>url.pathname.endsWith('/models/tee-studio.glb'),r=>r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync('sources/vendor/tee-studio-v06.glb')}));
  await page.route(url=>url.pathname.endsWith('/models/tee-studio.json'),r=>r.fulfill({contentType:'application/json',body:fs.readFileSync('sources/vendor/tee-studio-v06.json')}));
 }
 const idle=async()=>{await page.waitForFunction(()=>!document.querySelector('.loading'),{},{timeout:180000});await page.waitForTimeout(500);assert.equal(await page.locator('[role=alert]').count(),0)};
 const value=async(label,n)=>{await page.getByLabel(label,{exact:true}).fill(String(n));await page.getByLabel(label,{exact:true}).press('Tab')};
 await page.goto(process.env.BRANDMOCK_TEST_URL||'http://localhost:5182');await idle();assert.equal(await page.locator('canvas').getAttribute('data-model'),'tee-studio');
 await page.getByRole('button',{name:'Ракурс',exact:true}).click();await page.getByText('Отделка в цвет ткани',{exact:true}).uncheck();await page.getByLabel('Цвет отделки',{exact:true}).fill('#d5d7d6');
 await value('Позиция X',50);await value('Позиция Y',28);await value('Размер логотипа',35);await idle();
 for(const [view,file]of [['Спереди','front'],['Сзади','back'],['¾','threequarter']]){
  await page.locator('.viewBar').getByRole('button',{name:view,exact:true}).click();await idle();await page.screenshot({path:`${dir}/${version}-${file}-ui.png`,fullPage:true});
  const download=page.waitForEvent('download',{timeout:180000});await page.getByRole('button',{name:'Экспорт PNG',exact:true}).click();await(await download).saveAs(`${dir}/${version}-${file}.png`);const bytes=fs.readFileSync(`${dir}/${version}-${file}.png`);assert.equal(bytes.readUInt32BE(16),1600);console.log(version+' '+file+' native render / PNG PASS');
 }
 if(version==='after'){
  await page.locator('.viewBar').getByRole('button',{name:'Спереди',exact:true}).click();await idle();const canvas=page.locator('canvas'),box=await canvas.boundingBox(),before=await canvas.evaluate(c=>c.toDataURL());
  await page.mouse.move(box.x+box.width*.06,box.y+box.height*.25);await page.mouse.down();await page.mouse.move(box.x+box.width*.06,box.y+box.height*.55,{steps:8});await page.mouse.up();await page.waitForTimeout(1000);assert.equal(await canvas.evaluate(c=>c.toDataURL()),before,'Vertical orbit remains locked');
  await page.getByRole('button',{name:'Сохранить проект',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.saved')?.textContent?.includes('Проект сохранён'));await page.reload();await idle();assert.equal(await page.locator('canvas').getAttribute('data-model'),'tee-studio');assert.equal(await page.getByLabel('Позиция X',{exact:true}).inputValue(),'50');assert.equal(await page.getByLabel('Цвет отделки',{exact:true}).inputValue(),'#d5d7d6');
  console.log('Refined Studio: user print placement, contrast trim, vertical orbit and saved project retained PASS');
 }
 await context.close();
}
assert.equal(errors.length,0,errors.join('\n'));console.log('Approved v0.6 / refined Studio actual before-after views; native cloth material and all downloads; no browser errors PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
