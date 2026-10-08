const root=document.querySelector('#scroll-root');
const heroAct=document.querySelector('.hero-act');
const heroStage=document.querySelector('.hero-stage');
const heroCopy=document.querySelector('.hero-copy');
const scene=document.querySelector('#garuss-parallax');
const featuredAct=document.querySelector('.featured-act');
const featuredRail=featuredAct.querySelector('.featured-rail');
const lampAnchor=document.querySelector('.lamp-breathe--one ellipse');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const sc=window.ScrollCraft.mount(root,{lerp:.12});
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>n*n*(3-2*n);
const follow=(dt,ms)=>1-Math.exp(-dt/ms);
let cursor=null,mx=.5,my=.45,tx=.5,ty=.45,x=0,y=0,lampPower=0,railProgress=0,heroProgress=0,lastFrame=0;
let viewWidth=innerWidth,viewHeight=innerHeight,railDistance=0,railTravel=1,heroTravel=1,copyBottom=0,maxScroll=0;
let wheelActive=false,wheelTarget=scrollY,wheelY=scrollY,rafId=0,dead=false;
const lastValues=new Map();
function prop(el,key,value){
 const id=el.className+'|'+key;
 if(lastValues.get(id)===value)return;
 lastValues.set(id,value);el.style.setProperty(key,value);
}
function measure(){
 viewWidth=document.documentElement.clientWidth;viewHeight=innerHeight;
 railDistance=Math.max(0,featuredRail.scrollWidth-viewWidth);
 railTravel=Math.max(1,featuredAct.offsetHeight-viewHeight);
 heroTravel=Math.max(1,heroAct.offsetHeight-viewHeight);
 copyBottom=heroCopy.getBoundingClientRect().bottom;
 maxScroll=Math.max(0,document.documentElement.scrollHeight-viewHeight);
}
addEventListener('resize',()=>{sc.layout();measure()},{passive:true});
document.fonts.ready.then(measure);
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
 let lampBox=null;
 if(cursor&&heroVisible&&scene.classList.contains('scene-ready'))lampBox=lampAnchor.getBoundingClientRect();
 heroAct.classList.toggle('scene-paused',!heroVisible);
 const rawHero=clamp(-heroTop/heroTravel);
 const targetRail=clamp((clamp(-redTop/railTravel)-.06)/.88);
 mx+=(tx-mx)*follow(dt,180);my+=(ty-my)*follow(dt,180);
 x+=(((mx-.5)*26)-x)*follow(dt,100);
 y+=(((my-.5)*18)-y)*follow(dt,100);
 heroProgress+=(rawHero-heroProgress)*follow(dt,100);
 railProgress+=(targetRail-railProgress)*follow(dt,150);
 if(Math.abs(targetRail-railProgress)<.0001)railProgress=targetRail;
 const fadeStart=Math.min(viewHeight*.92,copyBottom+260);
 const fadeEnd=Math.min(fadeStart-180,copyBottom+60);
 const fade=clamp((fadeStart-redTop)/(fadeStart-fadeEnd));
 const opacity=(1-ease(fade)).toFixed(3);
 if(heroCopy.style.opacity!==opacity)heroCopy.style.opacity=opacity;
 const inactive=fade>=.98;
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
 if(lampBox){
  const distance=Math.hypot(cursor.x-(lampBox.left+lampBox.width/2),cursor.y-(lampBox.top+lampBox.height/2));
  targetLight=ease(clamp(1-distance/Math.min(300,Math.max(170,viewWidth*.20))));
 }
 lampPower+=(targetLight-lampPower)*follow(dt,240);
 if(Math.abs(targetLight-lampPower)<.001)lampPower=targetLight;
 prop(scene,'--lamp-power',lampPower.toFixed(4));
 if(wheelActive){
  wheelY+=(wheelTarget-wheelY)*follow(dt,105);
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
(()=>{
  const scene=document.getElementById('garuss-parallax');
  const canvas=scene?.querySelector('.garuss-parallax__canvas');
  if(!scene||!canvas)return;
  function fit(){
    const bounds=scene.getBoundingClientRect();
    const scale=Math.max(bounds.width/1672,bounds.height/941)*1.026;
    scene.style.setProperty('--scene-width',(1672*scale).toFixed(2)+'px');
    scene.style.setProperty('--scene-height',(941*scale).toFixed(2)+'px');
  }
  new ResizeObserver(fit).observe(scene);fit();
  const names=['city','room','front','sky'];
  Promise.all(names.map(name=>new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>img.decode().then(resolve,reject);
    img.onerror=reject;
    img.src=new URL('parallax-assets/'+(name==='sky'?'night-v15/':'night-v13/')+name+'.webp',location.href).href;
  }))).then(()=>scene.classList.add('scene-ready')).catch(()=>{
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
