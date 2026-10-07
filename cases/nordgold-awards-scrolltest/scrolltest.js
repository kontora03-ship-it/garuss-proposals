const data=JSON.parse(document.querySelector('#case-data').textContent);
const root=document.querySelector('.sc-test');
const act=document.querySelector('.sc-case-act');
const center=document.querySelector('#sc-center');
const left=document.querySelector('#sc-left');
const right=document.querySelector('#sc-right');
const count=document.querySelector('#sc-count');
const progress=document.querySelector('#sc-progress');
const full=document.querySelector('#sc-full');
const thumbsRoot=document.querySelector('#sc-thumbs');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const api=window.ScrollCraft.mount(root,{lerp:.18});

let current=0;
let targetFloat=0;
let displayFloat=0;
let lastP=0;
let lastT=performance.now();
let velocity=0;

const thumbs=data.images.map((slide,index)=>{
  const button=document.createElement('button');
  button.className='sc-case-thumb';
  button.type='button';
  button.dataset.index=index;
  button.setAttribute('aria-label','Перейти к изображению '+(index+1));
  const img=document.createElement('img');
  img.src=slide.src;
  img.alt='';
  img.loading=index<4?'eager':'lazy';
  button.appendChild(img);
  button.addEventListener('click',()=>scrollToIndex(index));
  thumbsRoot.appendChild(button);
  return button;
});

function slideAt(index){return data.images[Math.max(0,Math.min(data.images.length-1,index))]}

function updatePeeks(index){
  const prev=data.images[index-1];
  const next=data.images[index+1];

  left.classList.add('sc-peek-change');
  right.classList.add('sc-peek-change');

  setTimeout(()=>{
    if(prev){left.src=prev.src;left.hidden=false}else{left.removeAttribute('src');left.hidden=true}
    if(next){right.src=next.src;right.hidden=false}else{right.removeAttribute('src');right.hidden=true}
    requestAnimationFrame(()=>{
      left.classList.remove('sc-peek-change');
      right.classList.remove('sc-peek-change');
    });
  },reduce?0:90);
}

function transitionMs(){
  const fast=Math.min(1,velocity/1.1);
  return Math.round(680-fast*350);
}

function show(index){
  index=Math.max(0,Math.min(data.images.length-1,index));
  if(index===current&&center.src)return;
  current=index;
  const slide=slideAt(index);
  const preload=new Image();
  preload.onload=()=>{
    center.style.setProperty('--swap-ms',transitionMs()+'ms');
    center.classList.remove('sc-changing');
    center.src=slide.src;
    center.alt=data.title+'. Изображение '+(index+1);
    void center.offsetWidth;
    center.classList.add('sc-changing');
  };
  preload.src=slide.src;

  count.textContent=String(index+1).padStart(2,'0')+' / '+String(data.images.length).padStart(2,'0');
  full.href=slide.src;
  thumbs.forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
  thumbs[index]?.scrollIntoView({block:'nearest',inline:'center',behavior:reduce?'auto':'smooth'});
  updatePeeks(index);

  [data.images[index-2],data.images[index-1],data.images[index+1],data.images[index+2]].filter(Boolean).forEach(s=>{
    const im=new Image();im.src=s.src;
  });
}

function actMetrics(){
  const rect=act.getBoundingClientRect();
  const top=scrollY+rect.top;
  const travel=Math.max(act.offsetHeight-innerHeight,1);
  return {top,travel};
}

function scrollToIndex(index){
  const {top,travel}=actMetrics();
  const p=data.images.length<=1?0:index/(data.images.length-1);
  scrollTo({top:top+travel*p,behavior:reduce?'auto':'smooth'});
}

function tick(now){
  const p=Math.max(0,Math.min(1,parseFloat(getComputedStyle(act).getPropertyValue('--sc-p'))||0));
  const dt=Math.max(16,now-lastT);
  const dp=Math.abs(p-lastP);
  const instant=dp/dt*1000;
  velocity=velocity*.78+instant*.22;

  targetFloat=p*(data.images.length-1);
  const gap=targetFloat-displayFloat;

  // Small movement settles slowly; a quick flick catches up aggressively.
  const rate=reduce?1:Math.min(.62,.10+Math.abs(gap)*.085+Math.min(.22,velocity*.08));
  displayFloat+=gap*rate;

  const index=Math.max(0,Math.min(data.images.length-1,Math.round(displayFloat)));
  if(index!==current)show(index);

  progress.style.transform='scaleX('+p.toFixed(4)+')';
  lastP=p;lastT=now;
  requestAnimationFrame(tick);
}

updatePeeks(0);
thumbs.forEach((b,i)=>b.setAttribute('aria-current',String(i===0)));
requestAnimationFrame(tick);

addEventListener('pagehide',()=>api?.destroy?.(),{once:true});
