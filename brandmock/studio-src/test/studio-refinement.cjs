const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});try{
const dir='test-artifacts/studio-refinement';fs.mkdirSync(dir,{recursive:true});const errors=[];
for(const version of (process.env.STUDIO_AFTER_ONLY?['after']:['before','after'])){
 const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 if(version==='before'){
  await page.route(url=>url.pathname.endsWith('/models/tee-studio.glb'),r=>r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(process.env.STUDIO_BASELINE_GLB||'sources/vendor/tee-studio-v06.glb')}));
  await page.route(url=>url.pathname.endsWith('/models/tee-studio.json'),r=>r.fulfill({contentType:'application/json',body:fs.readFileSync(process.env.STUDIO_BASELINE_JSON||'sources/vendor/tee-studio-v06.json')}));
 }
 const idle=async()=>{await page.waitForFunction(()=>!document.querySelector('.loading'),{},{timeout:180000});await page.waitForTimeout(500);assert.equal(await page.locator('[role=alert]').count(),0)};
 const value=async(label,n)=>{await page.getByLabel(label,{exact:true}).fill(String(n));await page.getByLabel(label,{exact:true}).press('Tab')};
 await page.goto(process.env.BRANDMOCK_TEST_URL||'http://localhost:5182');await idle();assert.equal(await page.locator('canvas').getAttribute('data-model'),'tee-studio');
 await page.getByRole('button',{name:'Ракурс',exact:true}).click();await page.getByText('Отделка в цвет ткани',{exact:true}).uncheck();await page.getByLabel('Цвет отделки',{exact:true}).fill('#d5d7d6');
 await value('Позиция X',50);await value('Позиция Y',28);await value('Размер логотипа',35);await idle();
 for(const [view,file]of (process.env.STUDIO_FRONT_ONLY?[['Спереди','front'],['¾','threequarter']]:[['Спереди','front'],['Сзади','back'],['¾','threequarter']])){
  await page.locator('.viewBar').getByRole('button',{name:view,exact:true}).click();await idle();await page.screenshot({path:`${dir}/${version}-${file}-ui.png`,fullPage:true});
  const download=page.waitForEvent('download',{timeout:180000});await page.getByRole('button',{name:'Экспорт PNG',exact:true}).click();await(await download).saveAs(`${dir}/${version}-${file}.png`);const bytes=fs.readFileSync(`${dir}/${version}-${file}.png`);assert.equal(bytes.readUInt32BE(16),1600);console.log(version+' '+file+' native render / PNG PASS');
 }
 if(version==='after'){
  let retainedX='50';
  await page.locator('.zoneButtons').getByRole('button',{name:/Спина/}).click();await idle();
  const calibration='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><path d="M20 20H380V80H20Z" fill="none" stroke="#ff2200" stroke-width="8"/></svg>';
  await page.getByLabel('Добавить логотипы',{exact:true}).setInputFiles({name:'back-calibration.svg',mimeType:'image/svg+xml',buffer:Buffer.from(calibration)});await idle();await value('Позиция X',50);await value('Позиция Y',20);await value('Размер логотипа',58);await idle();
  await page.screenshot({path:`${dir}/after-back-calibration.png`,fullPage:true});await idle();
  const lines=await page.locator('canvas').evaluate(canvas=>{
   const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data,columns=new Map();let minX=c.width,maxX=0,minY=c.height,maxY=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,r=d[i],g=d[i+1],b=d[i+2];if(r>140&&g<r*.55&&b<r*.5){if(!columns.has(x))columns.set(x,[]);columns.get(x).push(y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
   const top=[],bottom=[];for(const[x,ys]of columns)if(x>minX+(maxX-minX)*.2&&x<maxX-(maxX-minX)*.2){top.push(Math.min(...ys));bottom.push(Math.max(...ys))}
   return{count:top.length,topRange:Math.max(...top)-Math.min(...top),bottomRange:Math.max(...bottom)-Math.min(...bottom),x:(minX+maxX)/2/c.width,y:(minY+maxY)/2/c.height};
  });
  assert(lines.count>60&&lines.topRange<=5&&lines.bottomRange<=5,'Rendered back print baselines must stay straight: '+JSON.stringify(lines));console.log('Back print actual pixel baselines: top '+lines.topRange+'px / bottom '+lines.bottomRange+'px variation PASS');
  const dragBox=await page.locator('canvas').boundingBox();await page.mouse.move(dragBox.x+dragBox.width*lines.x,dragBox.y+dragBox.height*lines.y);await page.mouse.down();await page.mouse.move(dragBox.x+dragBox.width*(lines.x+.035),dragBox.y+dragBox.height*(lines.y+.018),{steps:5});await page.mouse.up();await idle();retainedX=await page.getByLabel('Позиция X',{exact:true}).inputValue();assert(Number(retainedX)>50&&Number(await page.getByLabel('Позиция Y',{exact:true}).inputValue())>20,'Drag on recalibrated back surface must follow the pointer');console.log('Recalibrated back actual surface dragging PASS');
  await page.getByRole('button',{name:'Ракурс',exact:true}).click();

  await page.locator('.viewBar').getByRole('button',{name:'Спереди',exact:true}).click();await idle();await page.screenshot();const canvas=page.locator('canvas'),box=await canvas.boundingBox(),before=await canvas.evaluate(c=>c.toDataURL());
  await page.mouse.move(box.x+box.width*.06,box.y+box.height*.25);await page.mouse.down();await page.mouse.move(box.x+box.width*.06,box.y+box.height*.55,{steps:8});await page.mouse.up();await page.waitForTimeout(1000);await page.screenshot();assert(await canvas.evaluate(c=>c.toDataURL())===before,'Vertical orbit remains locked');
  await page.getByRole('button',{name:'Сохранить проект',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.saved')?.textContent?.includes('Проект сохранён'));await page.reload();await idle();assert.equal(await page.locator('canvas').getAttribute('data-model'),'tee-studio');assert.equal(await page.getByLabel('Позиция X',{exact:true}).inputValue(),retainedX);assert.equal(await page.getByLabel('Цвет отделки',{exact:true}).inputValue(),'#d5d7d6');
  console.log('Refined Studio: user print placement, contrast trim, vertical orbit and saved project retained PASS');
 }
 await context.close();
}
assert.equal(errors.length,0,errors.join('\n'));console.log('Configured Studio baseline / refined Studio actual before-after views; native cloth material and all downloads; no browser errors PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
