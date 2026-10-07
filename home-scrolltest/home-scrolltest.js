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
  if(!reduce){
    const scale=1-p*.055;
    const y=-p*42;
    const opacity=1-Math.max(0,(p-.60)/.40)*.72;
    heroCopy.style.transform=`translate3d(0,${y.toFixed(1)}px,0) scale(${scale.toFixed(4)})`;
    heroCopy.style.opacity=opacity.toFixed(3);
  }
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
