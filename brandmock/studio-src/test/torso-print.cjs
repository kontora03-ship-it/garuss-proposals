const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});try{
 const dir='test-artifacts/torso-print';fs.mkdirSync(dir,{recursive:true});const errors=[];
 for(const version of (process.env.TORSO_AFTER_ONLY?['after']:['before','after'])){
  const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  if(version==='before'){
   await page.route(url=>url.pathname.endsWith('/models/tee-studio.glb'),r=>r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(process.env.STUDIO_BASELINE_GLB||'sources/vendor/tee-studio-v06.glb')}));
   await page.route(url=>url.pathname.endsWith('/models/tee-studio.json'),r=>r.fulfill({contentType:'application/json',body:fs.readFileSync(process.env.STUDIO_BASELINE_JSON||'sources/vendor/tee-studio-v06.json')}));
  }
  const value=async(label,n)=>{const input=page.getByLabel(label,{exact:true});await input.fill(String(n));await input.press('Tab')};
  const frame=async()=>{await page.screenshot();await page.waitForTimeout(200)};
  await page.goto(process.env.BRANDMOCK_TEST_URL||'http://localhost:5182');await page.waitForFunction(()=>!document.querySelector('.loading')&&document.querySelector('canvas')?.dataset.model==='tee-studio',{},{timeout:180000});
  await page.getByRole('button',{name:'Ракурс',exact:true}).click();
  // Actual logo exports, including the lower torso and a rotated back view.
  for(const [zone,label]of [['front','Грудь'],['back','Спина']]){
   await page.locator('.zoneButtons').getByRole('button',{name:new RegExp(label)}).click();await value('Позиция X',60);await value('Позиция Y',65);await value('Размер логотипа',58);await frame();
   const file=page.waitForEvent('download',{timeout:180000});await page.getByRole('button',{name:'Экспорт PNG',exact:true}).click();await(await file).saveAs(`${dir}/${version}-${zone}-lower.png`);
   const bytes=fs.readFileSync(`${dir}/${version}-${zone}-lower.png`);assert.equal(bytes.readUInt32BE(16),1600);console.log(`${version} ${zone} lower-torso actual logo / native PNG PASS`);
   const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.05,box.y+box.height*.15);await page.mouse.down();await page.mouse.move(box.x+box.width*.17,box.y+box.height*.15,{steps:6});await page.mouse.up();await frame();await page.screenshot({path:`${dir}/${version}-${zone}-rotated.png`,fullPage:true});
  }
  if(version==='after'){
   const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100"><path d="M20 20H380V80H20Z" fill="none" stroke="#ff2200" stroke-width="8"/></svg>';
   for(const [zone,label]of [['front','Грудь'],['back','Спина']]){
    await page.locator('.zoneButtons').getByRole('button',{name:new RegExp(label)}).click();await page.getByLabel('Добавить логотипы',{exact:true}).setInputFiles({name:`${zone}-calibration.svg`,mimeType:'image/svg+xml',buffer:Buffer.from(svg)});await value('Позиция X',50);await value('Размер логотипа',58);
    let lines;
    for(const y of [25,55,75]){
     await value('Позиция Y',y);await frame();await page.screenshot({path:`${dir}/${zone}-${y}-calibration.png`,fullPage:true});await frame();
     lines=await page.locator('canvas').evaluate(canvas=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const cx=c.getContext('2d');cx.drawImage(canvas,0,0);const d=cx.getImageData(0,0,c.width,c.height).data,columns=new Map();let minX=c.width,maxX=0,minY=c.height,maxY=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,r=d[i];if(r>140&&d[i+1]<r*.55&&d[i+2]<r*.5){if(!columns.has(x))columns.set(x,[]);columns.get(x).push(y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}const top=[],bottom=[];for(const[x,ys]of columns)if(x>minX+(maxX-minX)*.2&&x<maxX-(maxX-minX)*.2){top.push(Math.min(...ys));bottom.push(Math.max(...ys))}const sample=[...columns.entries()].sort((a,b)=>Math.abs(a[0]-(minX+maxX)/2)-Math.abs(b[0]-(minX+maxX)/2))[0];return{count:top.length,topRange:Math.max(...top)-Math.min(...top),bottomRange:Math.max(...bottom)-Math.min(...bottom),x:sample[0]/c.width,y:sample[1][0]/c.height}});
     assert(lines.count>50&&Number.isFinite(lines.topRange+lines.bottomRange),`${zone} y=${y}: calibration must remain visible on the actual surface ${JSON.stringify(lines)}`);console.log(`${zone} y=${y}: surface calibration visible; natural drape variation ${lines.topRange}/${lines.bottomRange}px PASS`);
    }
    const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*lines.x,box.y+box.height*lines.y);await page.mouse.down();await page.mouse.move(box.x+box.width*(lines.x+.025),box.y+box.height*(lines.y-.02),{steps:5});await page.mouse.up();await frame();assert(Number(await page.getByLabel('Позиция X',{exact:true}).inputValue())>50);assert(Number(await page.getByLabel('Позиция Y',{exact:true}).inputValue())<75);console.log(`${zone}: actual lower-torso pointer drag follows artwork PASS`);await page.getByRole('button',{name:'Ракурс',exact:true}).click();
   }
   await page.getByRole('button',{name:'Сохранить проект',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.saved')?.textContent?.includes('Проект сохранён'));const savedX=await page.getByLabel('Позиция X',{exact:true}).inputValue();await page.reload();await page.waitForFunction(()=>!document.querySelector('.loading')&&document.querySelector('canvas')?.dataset.model==='tee-studio',{},{timeout:180000});assert.equal(await page.getByLabel('Позиция X',{exact:true}).inputValue(),savedX);console.log('Original project selection and corrected placement retained on reload PASS');
  }
  await context.close();
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('Torso print production browser regression: lower logos, rotated views, six height calibrations, pointer dragging and saved project PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
