const root=document.querySelector('#scroll-root');
const heroAct=document.querySelector('.hero-act');
const heroStage=document.querySelector('.hero-stage');
const heroCopy=document.querySelector('.hero-copy');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const sc=window.ScrollCraft.mount(root,{lerp:.18});

/* Hero progress + pointer depth */
let mx=.5,my=.45,tx=.5,ty=.45;
heroStage.addEventListener('pointermove',e=>{
  if(reduce||e.pointerType!=='mouse')return;
  const r=heroStage.getBoundingClientRect();
  tx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  ty=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
},{passive:true});
heroStage.addEventListener('pointerleave',()=>{tx=.5;ty=.45},{passive:true});

function frame(){
  mx+=(tx-mx)*.07;my+=(ty-my)*.07;
  heroStage.style.setProperty('--mx',mx.toFixed(3));
  heroStage.style.setProperty('--my',my.toFixed(3));

  const p=Math.max(0,Math.min(1,parseFloat(getComputedStyle(heroAct).getPropertyValue('--sc-p'))||0));
  heroStage.style.setProperty('--hero-p',p.toFixed(4));
  heroStage.style.setProperty('--process-progress',reduce?'1':Math.min(1,p*3.5).toFixed(3));
  heroStage.style.setProperty('--scene-scroll',reduce?'0px':(p*28).toFixed(2)+'px');
  heroStage.style.setProperty('--draw-progress',reduce?'1':Math.min(1,.18+p*2.2).toFixed(3));
  // Copy holds its exact size and position, then fades before the stage releases.
  const fade=Math.max(0,Math.min(1,(p-.46)/.46));
  const eased=fade*fade*(3-2*fade);
  heroCopy.style.opacity=(1-eased).toFixed(3);
  heroCopy.style.pointerEvents=fade>=.98?'none':'';
  heroCopy.inert=fade>=.98;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

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
    img.src=new URL('parallax-assets/night-v13/'+name+'.webp',location.href).href;
  }))).then(()=>scene.classList.add('scene-ready')).catch(()=>{
    scene.classList.add('scene-fallback');
  });
  let targetX=0,targetY=0,x=0,y=0;
  heroStage.addEventListener('pointermove',e=>{
    if(reduce||e.pointerType!=='mouse')return;
    const b=heroStage.getBoundingClientRect();
    targetX=((e.clientX-b.left)/b.width-.5)*26;
    targetY=((e.clientY-b.top)/b.height-.5)*18;
  },{passive:true});
  heroStage.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});
  if(reduce)return;
  function tick(){
    if(!document.hidden){
      x+=(targetX-x)*.055;y+=(targetY-y)*.055;
      scene.style.setProperty('--px',x.toFixed(2)+'px');
      scene.style.setProperty('--py',y.toFixed(2)+'px');
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
