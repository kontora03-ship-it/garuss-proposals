const root=document.querySelector('#scroll-root');
const heroAct=document.querySelector('.hero-act');
const heroStage=document.querySelector('.hero-stage');
const heroCopy=document.querySelector('.hero-copy');
const scene=document.querySelector('#garuss-parallax');
const featuredAct=document.querySelector('.featured-act');
const featuredRail=featuredAct.querySelector('.featured-rail');
const featuredProgress=document.querySelector('.featured-scroll-progress>i');
const lampAnchors=[...document.querySelectorAll('[data-lamp-anchor]')];
const lampMeters=[...document.querySelectorAll('.lamp-meter')];
const lampPowers=lampAnchors.map(()=>0);
const lampDistances=lampAnchors.map(()=>Infinity);
const lampTargets=lampAnchors.map(()=>0);
const lampCanvas=scene.querySelector('.garuss-parallax__canvas');
const lampPoints=lampAnchors.map(el=>{
 const [vx,vy,vw,vh]=el.ownerSVGElement.getAttribute('viewBox').trim().split(/\s+/).map(Number);
 return {x:+el.getAttribute('cx'),y:+el.getAttribute('cy'),vx,vy,vw,vh};
});
function fixedLampCenter(point,bounds){
 const scale=Math.min(bounds.width/point.vw,bounds.height/point.vh);
 return {x:bounds.left+(bounds.width-point.vw*scale)/2+(point.x-point.vx)*scale,
 y:bounds.top+(bounds.height-point.vh*scale)/2+(point.y-point.vy)*scale};
}
function stableLampTarget(distance,radius){
 const fullRadius=Math.min(56,Math.max(28,radius*.18));
 return ease(clamp(1-(distance-fullRadius)/(radius-fullRadius)));
}
const traffic=[...document.querySelectorAll('.city-car')].map(el=>({el,path:document.getElementById(el.dataset.route),length:document.getElementById(el.dataset.route).getTotalLength(),duration:+el.dataset.speed,phase:+el.dataset.phase}));
let cityClock=0;
// Random dwell times replace periodic CSS patterns. Each old cycle had eight switches.
const cityWindows=[...document.querySelectorAll('.city-window-activity rect')].map(el=>{
 const formerDuration=parseFloat(el.style.animation.match(/([\d.]+)s/)?.[1]||'12')*1000;
 const dwell=formerDuration*3/8;
 const on=Math.random()<.45;
 el.style.animation='none';el.style.opacity=on?'.82':'0';
 return {el,on,dwell,next:Math.random()*dwell};
});
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const sc=window.ScrollCraft.mount(root,{lerp:.12});
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>n*n*(3-2*n);
const follow=(dt,ms)=>1-Math.exp(-dt/ms);
let cursor=null,mx=.5,my=.45,tx=.5,ty=.45,x=0,y=0,lampPower=0,cityPower=0,railProgress=0,heroProgress=0,lastFrame=0;
let viewWidth=innerWidth,viewHeight=innerHeight,railDistance=0,railTravel=1,heroTravel=1,copyBottom=0,firstCopyBottom=0,maxScroll=0;
let wheelActive=false,wheelTarget=scrollY,wheelY=scrollY,rafId=0,dead=false;
const lastValues=new Map();
const copyParagraph=heroCopy.querySelector('p');
const paragraphText=copyParagraph.textContent.trim();
let copyRows=[],paragraphWidth=-1;
function arrangeCopyRows(force=false){
 const width=copyParagraph.clientWidth;
 if(!force&&width===paragraphWidth)return;
 paragraphWidth=width;
 copyParagraph.textContent=paragraphText;
 const node=copyParagraph.firstChild;
 const range=document.createRange();
 const lines=[];
 for(const match of paragraphText.matchAll(/\S+/g)){
  range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
  const top=range.getBoundingClientRect().top;
  const previous=lines[lines.length-1];
  if(previous&&Math.abs(previous.top-top)<2)previous.words.push(match[0]);
  else lines.push({top,words:[match[0]]});
 }
 const fragment=document.createDocumentFragment();
 lines.forEach((line,index)=>{
  const span=document.createElement('span');
  span.className='copy-fade-line';
  span.textContent=line.words.join(' ')+(index<lines.length-1?' ':'');
  fragment.append(span);
 });
 copyParagraph.replaceChildren(fragment);
 copyRows=[...heroCopy.querySelectorAll('.copy-fade-line')];
}
function prop(el,key,value){
 const id=el.className+'|'+key;
 if(lastValues.get(id)===value)return;
 lastValues.set(id,value);el.style.setProperty(key,value);
}
function measure(){
 arrangeCopyRows();
 viewWidth=document.documentElement.clientWidth;viewHeight=innerHeight;
 railDistance=Math.max(0,featuredRail.scrollWidth-viewWidth);
 railTravel=Math.max(1,featuredAct.offsetHeight-viewHeight);
 heroTravel=Math.max(1,heroAct.offsetHeight-viewHeight);
 copyBottom=heroCopy.getBoundingClientRect().bottom;
 firstCopyBottom=heroCopy.getBoundingClientRect().top+heroCopy.querySelector(".hero-line").offsetHeight;
 maxScroll=Math.max(0,document.documentElement.scrollHeight-viewHeight);
}
addEventListener('resize',()=>{cursor=null;tx=.5;ty=.45;sc.layout();measure()},{passive:true});
document.fonts.ready.then(()=>{arrangeCopyRows(true);measure()});
new ResizeObserver(measure).observe(featuredRail);
measure();
heroStage.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse')return;
 cursor={x:e.clientX,y:e.clientY};
 const b=heroStage.getBoundingClientRect();
 tx=clamp((e.clientX-b.left)/b.width);ty=clamp((e.clientY-b.top)/b.height);
},{passive:true});
heroStage.addEventListener('pointerleave',()=>{cursor=null;tx=.5;ty=.45},{passive:true});
addEventListener('blur',()=>{cursor=null;wheelActive=false});
function cancelWheel(){wheelActive=false;wheelY=wheelTarget=scrollY;}
addEventListener('pointerdown',cancelWheel,{passive:true});
addEventListener('touchstart',cancelWheel,{passive:true});
addEventListener('keydown',cancelWheel,{passive:true});
addEventListener('wheel',e=>{
 if(document.documentElement.classList.contains('intro-pending')){e.preventDefault();return;}
 if(reduce||!finePointer.matches||e.ctrlKey||e.metaKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
 // Keep scrolling within any independently scrollable control native.
 for(let el=e.target instanceof Element?e.target:null;el&&el!==document.body;el=el.parentElement){
  const s=getComputedStyle(el);
  if(/auto|scroll/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+1)return;
 }
 const unit=e.deltaMode===1?32:e.deltaMode===2?viewHeight:1;
 const delta=e.deltaY*unit;
 if(!delta)return;
 if(!wheelActive){wheelY=wheelTarget=scrollY;}
 const target=Math.max(0,Math.min(maxScroll,wheelTarget+delta));
 if(target===wheelTarget&&(target===0||target===maxScroll))return;
 e.preventDefault();wheelTarget=target;wheelActive=true;
},{passive:false});
function frame(now){
 if(dead)return;
 const dt=Math.min(50,Math.max(1,now-(lastFrame||now-16.67)));lastFrame=now;
 if(document.hidden){rafId=requestAnimationFrame(frame);return;}
 // Read geometry before writing transforms. One owner drives the rail and scene.
 const redTop=featuredAct.getBoundingClientRect().top;
 const heroTop=heroAct.getBoundingClientRect().top;
 const heroVisible=heroTop<viewHeight&&heroTop+heroAct.offsetHeight>0;
 // Hit testing uses the unanimated canvas, never the moving/parallax SVG.
 const lampBounds=cursor&&heroVisible&&scene.classList.contains('scene-ready')
  ?lampCanvas.getBoundingClientRect():null;
 heroAct.classList.toggle('scene-paused',!heroVisible);
 const rawHero=clamp(-heroTop/heroTravel);
 const targetRail=clamp((clamp(-redTop/railTravel)-.06)/.88);
 mx+=(tx-mx)*follow(dt,180);my+=(ty-my)*follow(dt,180);
 x+=(((mx-.5)*26)-x)*follow(dt,100);
 y+=(((my-.5)*18)-y)*follow(dt,100);
 heroProgress+=(rawHero-heroProgress)*follow(dt,120);
 railProgress+=(targetRail-railProgress)*follow(dt,175);
 if(Math.abs(targetRail-railProgress)<.0001)railProgress=targetRail;
 const displayedProgress=reduce?clamp(featuredRail.scrollLeft/Math.max(1,railDistance)):railProgress;
 prop(featuredProgress,'transform','scaleX('+displayedProgress.toFixed(4)+')');
 const rowDuration=110;
 const rowPause=10;
 const lastEnd=firstCopyBottom+36;
 const rowStep=rowDuration+rowPause;
 const firstStart=lastEnd+rowDuration+(copyRows.length-1)*rowStep;
 heroCopy.style.opacity='1';
 copyRows.forEach((row,index)=>{
  const order=copyRows.length-1-index;
  const start=firstStart-order*rowStep;
  const progress=clamp((start-redTop)/rowDuration);
  const opacity=(1-ease(progress)).toFixed(3);
  if(row.style.opacity!==opacity)row.style.opacity=opacity;
 });
 const inactive=redTop<=lastEnd;
 if(heroCopy.inert!==inactive){heroCopy.inert=inactive;heroCopy.style.pointerEvents=inactive?'none':'';}
 if(!reduce){
  prop(featuredRail,'transform','translate3d('+(-railDistance*railProgress).toFixed(2)+'px,0,0)');
  if(heroVisible){
   prop(heroStage,'--scene-scroll',(heroProgress*28).toFixed(2)+'px');
   prop(heroStage,'--ruler-shift',((mx-.5)*180).toFixed(2)+'px');
   prop(scene,'--px',x.toFixed(2)+'px');prop(scene,'--py',y.toFixed(2)+'px');
  }
 }
 let targetLight=0;
 lampPowers.forEach((power,index)=>{
  const center=lampBounds?fixedLampCenter(lampPoints[index],lampBounds):null;
  const distance=center?Math.hypot(cursor.x-center.x,cursor.y-center.y):Infinity;
  // Ignore subpixel pointer noise; retain a full-light plateau inside the meter.
  if(!Number.isFinite(distance)||!Number.isFinite(lampDistances[index])||
   Math.abs(distance-lampDistances[index])>=1.5)lampDistances[index]=distance;
  const desired=stableLampTarget(lampDistances[index],Math.min(245,Math.max(145,viewWidth*.16)));
  if(desired===0||desired===1||Math.abs(desired-lampTargets[index])>=.006)lampTargets[index]=desired;
  const target=lampTargets[index];
  lampPowers[index]=power+(target-power)*follow(dt,300);
  if(Math.abs(target-lampPowers[index])<.001)lampPowers[index]=target;
  prop(scene,'--lamp-'+index,lampPowers[index].toFixed(4));
  prop(lampMeters[index],'--local-power',lampPowers[index].toFixed(4));
  prop(scene,'--lamp-1',lampPowers[index].toFixed(4));
  prop(scene,'--lamp-2',lampPowers[index].toFixed(4));
  targetLight=Math.max(targetLight,lampPowers[index]);
 });
 lampPower=targetLight;
 prop(scene,'--lamp-power',lampPower.toFixed(4));
 cityPower+=(lampPower-cityPower)*follow(dt,420);
 if(Math.abs(lampPower-cityPower)<.001)cityPower=lampPower;
 prop(scene,'--city-power',cityPower.toFixed(4));
 if(heroVisible&&!reduce){
  cityClock+=dt;
  cityWindows.forEach(win=>{
   if(cityClock<win.next)return;
   win.on=!win.on;win.el.style.opacity=win.on?'.82':'0';
   win.next=cityClock+win.dwell*(.35+Math.random()*1.3);
  });
  traffic.forEach(car=>{
   const progress=(cityClock/car.duration+car.phase)%1;
   const point=car.path.getPointAtLength(progress*car.length);
   car.el.setAttribute('transform','translate('+point.x.toFixed(2)+' '+point.y.toFixed(2)+')');
   car.el.style.opacity=(Math.min(1,progress*12,(1-progress)*12)*.86).toFixed(3);
  });
 }
 if(wheelActive){
  wheelY+=(wheelTarget-wheelY)*follow(dt,135);
  if(Math.abs(wheelTarget-wheelY)<.4){wheelY=wheelTarget;wheelActive=false;}
  window.scrollTo({top:wheelY,behavior:'instant'});
 }
 rafId=requestAnimationFrame(frame);
}
rafId=requestAnimationFrame(frame);
addEventListener('pagehide',()=>{dead=true;cancelAnimationFrame(rafId)},{once:true});
/* Card reveal */
const cards=[...document.querySelectorAll('.test-grid .presentation-card')];
if('IntersectionObserver' in window&&!reduce){
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  },{threshold:.10,rootMargin:'0px 0px -7% 0px'});
  cards.forEach((c,i)=>{c.style.transitionDelay=(i%3)*80+'ms';io.observe(c)});
}else cards.forEach(c=>c.classList.add('is-in'));

/* Subtle image movement on hover */
document.querySelectorAll('.test-grid .presentation-link').forEach(link=>{
  const cover=link.querySelector('.cover');
  if(!cover)return;
  cover.addEventListener('pointermove',e=>{
    if(reduce||e.pointerType!=='mouse')return;
    const r=cover.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-.5)*8;
    const y=((e.clientY-r.top)/r.height-.5)*6;
    link.style.setProperty('--card-x',x.toFixed(1)+'px');
    link.style.setProperty('--card-y',y.toFixed(1)+'px');
  },{passive:true});
  cover.addEventListener('pointerleave',()=>{
    link.style.setProperty('--card-x','0px');
    link.style.setProperty('--card-y','0px');
  },{passive:true});
});

/* Existing catalogue filters, isolated from production */
const buttons=[...document.querySelectorAll('[data-category]')];
buttons.forEach(button=>button.addEventListener('click',()=>{
  buttons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  const category=button.dataset.category;
  let count=0;
  cards.forEach(card=>{
    const show=category==='Все кейсы'||card.dataset.categories.split('|').includes(category);
    card.hidden=!show;
    if(show){count++;requestAnimationFrame(()=>card.classList.add('is-in'))}
  });
  document.querySelector('#result-count').textContent=count;
}));

addEventListener('pagehide',()=>sc?.destroy?.(),{once:true});


/* Register all raster layers in the same source-coordinate canvas. */
const sceneAssetsReady=(()=>{
  const scene=document.getElementById('garuss-parallax');
  const canvas=scene?.querySelector('.garuss-parallax__canvas');
  if(!scene||!canvas)return;
  function fit(){
    const bounds=scene.getBoundingClientRect();
    const scale=Math.max(bounds.width/2048,bounds.height/1152)*1.026;
    scene.style.setProperty('--scene-width',(2048*scale).toFixed(2)+'px');
    scene.style.setProperty('--scene-height',(1152*scale).toFixed(2)+'px');
  }
  new ResizeObserver(fit).observe(scene);fit();
  // Decode the actual displayed layers; no obsolete photographic placeholder.
  const layers=[...canvas.querySelectorAll('img')];
  const masks=["v34/outdoor-mask.webp","v34/city-mask-v37.svg"].map(name=>{const img=new Image();img.src="parallax-assets/"+name;return img.decode()});
  return Promise.all([...layers.map(img=>img.decode()),...masks]).then(()=>{
    scene.classList.add('scene-ready');
  }).catch(()=>{
    scene.classList.add('scene-fallback');
  });
})();
/* Native smooth anchor navigation; wheel input can interrupt it immediately. */
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{
 const target=document.querySelector(link.getAttribute('href'));
 if(!target)return;
 e.preventDefault();cancelWheel();
 target.scrollIntoView({behavior:reduce?'instant':'smooth',block:'start'});
 history.replaceState(null,'',link.getAttribute('href'));
}));
/* Keep focused cards visible now that the page owns horizontal rail motion. */
featuredRail.addEventListener('focusin',e=>{
 const card=e.target.closest('.featured-card');if(!card||reduce)return;
 const index=[...featuredRail.children].indexOf(card);
 const gap=parseFloat(getComputedStyle(featuredRail).gap)||0;
 const fraction=clamp(index*(card.offsetWidth+gap)/Math.max(1,railDistance));
 const targetY=featuredAct.getBoundingClientRect().top+scrollY+(.06+fraction*.88)*railTravel;
 cancelWheel();window.scrollTo({top:targetY,behavior:'smooth'});
});

/* Load the page before revealing the scene and restarting copy entrances. */
(async()=>{
 const overlay=document.getElementById('page-intro');
 if(!overlay)return;
 const html=document.documentElement;
 const protectedContent=[document.querySelector('.test-main-header'),root,document.querySelector('.test-footer')];
 protectedContent.forEach(el=>el.inert=true);
 const meter=overlay.querySelector('.page-intro-progress');
 const fill=meter.querySelector('i');
 const tileCanvas=overlay.querySelector('canvas');
 const ctx=tileCanvas.getContext('2d');
 const began=performance.now();
 let width=0,height=0,tiles=[];
 function prepareTiles(){
  width=innerWidth;height=innerHeight;
  const dpr=Math.min(devicePixelRatio||1,1.5);
  tileCanvas.width=Math.round(width*dpr);tileCanvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const side=24,cols=Math.ceil(width/side),rows=Math.ceil(height/side);
  tiles=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const fromBottom=1-row/Math.max(1,rows-1);
   const delay=fromBottom*640+Math.random()*680;
   tiles.push({x:col*side,y:row*side,side,delay});
  }
  ctx.fillStyle='#BE1622';ctx.fillRect(0,0,width,height);
 }
 prepareTiles();
 addEventListener('resize',prepareTiles,{passive:true});
 const images=[...document.images];
 images.forEach(img=>{img.loading='eager'});
 const fontTask=Promise.all([
  document.fonts.load('700 100px "Halvar"'),
  document.fonts.load('400 17px "CoFo Sans"')
 ]).then(()=>document.fonts.ready);
 const loadTask=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>addEventListener('load',resolve,{once:true}));
 const tasks=[...images.map(img=>img.decode()),fontTask,loadTask,sceneAssetsReady];
 let completed=0;
 await Promise.allSettled(tasks.map(task=>Promise.resolve(task).finally(()=>{
  completed++;
  const progress=completed/tasks.length;
  fill.style.transform='scaleX('+progress+')';
  meter.setAttribute('aria-valuenow',String(Math.round(progress*100)));
 })));
 // Let the completed white line settle; cached visits still get a short intro.
 await new Promise(resolve=>setTimeout(resolve,Math.max(320,900-(performance.now()-began))));
 html.classList.add('intro-revealing');
 overlay.classList.add('is-dissolving');
 if(!reduce){
  await new Promise(resolve=>{
   const started=performance.now();
   function dissolve(now){
    const elapsed=now-started;
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#BE1622';
    for(const tile of tiles){
     if(elapsed<tile.delay)ctx.fillRect(tile.x,tile.y,tile.side,tile.side);
    }
    if(elapsed<1360)requestAnimationFrame(dissolve);else resolve();
   }
   requestAnimationFrame(dissolve);
  });
 }
 removeEventListener('resize',prepareTiles);
 overlay.remove();
 html.classList.remove('intro-pending','intro-revealing');
 protectedContent.forEach(el=>el.inert=false);
 sc.layout();arrangeCopyRows(true);measure();cancelWheel();
})();




