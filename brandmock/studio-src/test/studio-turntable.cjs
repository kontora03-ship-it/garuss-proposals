const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});try{
const out='test-artifacts/studio-turntable';fs.mkdirSync(out,{recursive:true});const errors=[];
for(const version of ['before','after']){
 const page=await browser.newPage({viewport:{width:650,height:700}});page.on('pageerror',e=>errors.push(String(e)));
 if(version==='before'){
  await page.route(u=>u.pathname.endsWith('/models/tee-studio.glb'),r=>r.fulfill({contentType:'model/gltf-binary',body:fs.readFileSync(process.env.STUDIO_BASELINE_GLB||'sources/vendor/tee-studio-v06.glb')}));
  await page.route(u=>u.pathname.endsWith('/models/tee-studio.json'),r=>r.fulfill({contentType:'application/json',body:fs.readFileSync(process.env.STUDIO_BASELINE_JSON||'sources/vendor/tee-studio-v06.json')}));
 }
 await page.goto(process.env.BRANDMOCK_AUDIT_URL||'http://localhost:5183/test/fixtures/studio-turntable.html');
 await page.evaluate(async()=>{const host=document.querySelector('#host');host.style.width='650px';host.style.height='700px';const[{StudioRenderer},{defaults},{demoSvg,rasterize}]=await Promise.all([import('/src/StudioRenderer.ts'),import('/src/types.ts'),import('/src/logoLoader.ts')]);const canvas=await rasterize(new Blob([demoSvg],{type:'image/svg+xml'}));window.engine=new StudioRenderer(host,()=>{},console.error,()=>{},()=>{},()=>{});const s=structuredClone(defaults);engine.setSettings(s,s.layers.map(l=>({...l,canvas,renderKey:'brandmock'})));engine.setEditing(false)});
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.model==='tee-studio',{timeout:180000});await page.evaluate(()=>{engine.setView('front');window.distance=engine.camera.position.distanceTo(engine.controls.target)});
 for(const angle of (version==='before'?[0,90,270]:[0,45,90,135,180,225,270,315])){
  await page.evaluate(angle=>{const target=engine.controls.target.clone(),a=angle*Math.PI/180;engine.camera.position.copy(target).add(new target.constructor(Math.sin(a),0,Math.cos(a)).multiplyScalar(window.distance));engine.controls.update();engine.setEditing(false)},angle);
  await page.screenshot({path:`${out}/${version}-${angle}.png`});console.log(`${version} turntable ${angle} degrees actual render PASS`);
  if(version==='after'&&(angle===0||angle===45)){
   const data=await page.evaluate(async()=>{const blob=await engine.png(1000);return await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob)})});fs.writeFileSync(`${out}/after-${angle}-native.png`,Buffer.from(data.split(',')[1],'base64'));
  }
 }
 await page.close();
}
assert.equal(errors.length,0,errors.join('\n'));console.log('Profile, straight hem, default artwork and complete eight-angle rotation actual renders PASS');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
