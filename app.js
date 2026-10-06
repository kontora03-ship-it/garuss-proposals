const root=document.documentElement;
const logo=document.querySelector('#brand-logo');
const canvas=document.querySelector('#intro-canvas');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let frame,logoAnimation,finished=false;
function finish(){if(finished)return;finished=true;cancelAnimationFrame(frame);logoAnimation?.cancel();logo.style.transform='';logo.classList.add('positioned');root.classList.remove('intro-pending');root.classList.add('intro-complete');canvas.remove();}
function entrance(){
 if(motion.matches||!root.classList.contains('intro-pending')){finish();return;}
 try{
 const ctx=canvas.getContext('2d');if(!ctx){finish();return;}
 const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.scale(dpr,dpr);
 const rect=logo.getBoundingClientRect();
 const scale=Math.min(width*.64,520)/rect.width;
 const dx=width/2-(rect.left+rect.width/2),dy=height/2-(rect.top+rect.height/2);
 const initial=`translate(${dx}px,${dy}px) scale(${scale})`;
 logo.style.transform=initial;logo.classList.add('positioned');
 const cell=width<=980?16:22;
 const tiles=[];
 for(let y=0;y<height;y+=cell)for(let x=0;x<width;x+=cell){
  const distance=Math.hypot((x-width/2)/width,(y-height/2)/height);
  tiles.push({x,y,delay:Math.random()*1750+distance*250});
 }
 ctx.fillStyle='#BE1622';ctx.fillRect(0,0,width,height);canvas.style.background='transparent';
 let start;
 function draw(now){
  if(!root.classList.contains('intro-pending')){finish();return;}
  if(start===undefined)start=now;
  const elapsed=now-start;
  ctx.clearRect(0,0,width,height);
  for(const tile of tiles){
   // Each full-size, opaque square disappears in a single frame.
   if(elapsed>=850+tile.delay)continue;
   ctx.fillRect(tile.x,tile.y,cell,cell);
  }
  ctx.globalAlpha=1;
  if(elapsed>=3000&&!logoAnimation){logoAnimation=logo.animate([{transform:initial},{transform:'translate(0,0) scale(1)'}],{duration:1550,easing:'cubic-bezier(.45,0,.15,1)',fill:'forwards'});}
  if(elapsed>=4670){finish();return;}
  frame=requestAnimationFrame(draw);
 }
 frame=requestAnimationFrame(draw);
 }catch(error){finish();}
}
if(logo.complete)entrance();else{logo.addEventListener('load',entrance,{once:true});logo.addEventListener('error',finish,{once:true});}
addEventListener('resize',finish,{once:true});
addEventListener('pagehide',finish,{once:true});
motion.addEventListener('change',event=>{if(event.matches)finish();});
const buttons=[...document.querySelectorAll('[data-category]')];
const cards=[...document.querySelectorAll('.presentation-card')];
buttons.forEach(button=>button.addEventListener('click',()=>{
 buttons.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
 const category=button.dataset.category;
 let count=0;
 cards.forEach(card=>{
  const show=category==='Все кейсы'||card.dataset.categories.split('|').includes(category);
  card.hidden=!show;
  if(show){count++;if(!motion.matches)card.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'cubic-bezier(.22,1,.36,1)'});}
 });
 document.querySelector('#result-count').textContent=count;
 document.querySelector('#category-empty').hidden=count!==0;
}));

const returning=new URLSearchParams(location.search).has('return');
function readCatalogState(){try{return JSON.parse(sessionStorage.getItem('garuss-catalog-state')||'null');}catch{return null;}}
if(returning){
 const state=readCatalogState();
 if(state){const button=buttons.find(b=>b.dataset.category===state.category);button?.click();requestAnimationFrame(()=>requestAnimationFrame(()=>scrollTo({top:state.scroll||0,behavior:'instant'})));}
}
document.querySelectorAll('.presentation-link').forEach(link=>link.addEventListener('click',()=>{
 try{sessionStorage.setItem('garuss-catalog-state',JSON.stringify({category:buttons.find(b=>b.classList.contains('active'))?.dataset.category,scroll:scrollY}));}catch{}
}));
