const data=JSON.parse(document.querySelector('#case-data').textContent);

const viewer=document.querySelector('.viewer');
const stage=document.querySelector('#slide-stage');
const image=document.querySelector('#slide-image');
const counter=document.querySelector('#slide-count');
const previous=document.querySelector('#previous-slide');
const next=document.querySelector('#next-slide');
const fullImage=document.querySelector('#full-image');
const toolbar=document.querySelector('.viewer-toolbar');
const hint=document.querySelector('.slide-hint');
const thumbnails=document.querySelector('.thumbnails');
const thumbs=[...document.querySelectorAll('[data-slide]')];
const header=document.querySelector('.case-header');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

// One fixed visual block: toolbar + carousel + hint + thumbnails.
const pin=document.createElement('div');
pin.className='viewer-pin';
viewer.insertBefore(pin,viewer.firstChild);
[toolbar,stage,hint,thumbnails].forEach(el=>pin.appendChild(el));

// Side previews. Visual order is intentionally swapped from the previous version.
const leftPeek=document.createElement('img');
const rightPeek=document.createElement('img');
leftPeek.className='side-peek side-peek-left';
rightPeek.className='side-peek side-peek-right';
leftPeek.alt='';rightPeek.alt='';
leftPeek.setAttribute('aria-hidden','true');
rightPeek.setAttribute('aria-hidden','true');
stage.insertBefore(leftPeek,image);
stage.appendChild(rightPeek);

let current=0;
let targetIndex=0;
let loading=false;
let sequence=0;
let scrollRaf=0;

function clampIndex(index){
  return Math.max(0,Math.min(data.images.length-1,index));
}

function updatePeeks(index){
  // Corrected visual order requested by user:
  // left shows the slide that was previously appearing on the right,
  // right shows the slide that was previously appearing on the left.
  const leftSlide=data.images[index+1];
  const rightSlide=data.images[index-1];

  if(leftSlide){
    leftPeek.src=leftSlide.src;
    leftPeek.hidden=false;
  }else{
    leftPeek.removeAttribute('src');
    leftPeek.hidden=true;
  }

  if(rightSlide){
    rightPeek.src=rightSlide.src;
    rightPeek.hidden=false;
  }else{
    rightPeek.removeAttribute('src');
    rightPeek.hidden=true;
  }
}

function animateFrame(direction){
  if(reduced.matches)return;

  image.animate([
    {opacity:.48,transform:`translateX(${direction*22}px) scale(.994)`},
    {opacity:1,transform:'translateX(0) scale(1)'}
  ],{
    duration:620,
    easing:'cubic-bezier(.22,1,.36,1)'
  });

  [leftPeek,rightPeek].forEach((peek,i)=>{
    if(peek.hidden)return;
    peek.animate([
      {opacity:.08,transform:`translateY(-50%) translateX(${direction*(i?14:-14)}px) scale(.965)`},
      {opacity:.42,transform:'translateY(-50%) translateX(0) scale(.97)'}
    ],{
      duration:720,
      easing:'cubic-bezier(.22,1,.36,1)'
    });
  });
}

function show(index,direction){
  index=clampIndex(index);
  if(index===current&&image.complete){
    updatePeeks(index);
    return Promise.resolve();
  }

  const token=++sequence;
  const slide=data.images[index];
  const preload=new Image();
  loading=true;
  stage.classList.add('loading');

  return new Promise(resolve=>{
    preload.onload=()=>{
      if(token!==sequence){resolve();return;}

      const dir=direction??(index>current?1:-1);
      current=index;

      image.src=slide.src;
      image.width=slide.width;
      image.height=slide.height;
      image.alt=`${data.title}. Изображение ${index+1}`;

      counter.textContent=`${index+1} / ${data.images.length}`;
      if(previous)previous.disabled=index===0;
      if(next)next.disabled=index===data.images.length-1;
      if(fullImage)fullImage.href=slide.src;

      thumbs.forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
      updatePeeks(index);

      const activeThumb=thumbs[index];
      activeThumb?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'nearest',inline:'center'});

      stage.classList.remove('loading');
      animateFrame(dir);

      [data.images[index-1],data.images[index+1]].filter(Boolean).forEach(item=>{
        const adjacent=new Image();
        adjacent.src=item.src;
      });

      loading=false;
      resolve();
      setTimeout(pumpToTarget,380);
    };

    preload.onerror=()=>{
      if(token===sequence){
        stage.classList.remove('loading');
        loading=false;
      }
      resolve();
    };

    preload.src=slide.src;
  });
}

function pumpToTarget(){
  if(loading||current===targetIndex)return;
  const direction=targetIndex>current?1:-1;
  show(current+direction,direction);
}

function setTarget(index){
  targetIndex=clampIndex(index);
  pumpToTarget();
}

function layoutViewer(){
  const headerHeight=Math.round(header?.getBoundingClientRect().height||0);
  const shellHeight=Math.max(420,innerHeight-headerHeight);
  const step=Math.max(360,Math.round(innerHeight*.72));

  document.documentElement.style.setProperty('--case-header-h',headerHeight+'px');
  viewer.style.height=(shellHeight+(data.images.length-1)*step)+'px';
  viewer.dataset.step=String(step);

  requestScrollUpdate();
}

function scrollMetrics(){
  const viewerRect=viewer.getBoundingClientRect();
  const viewerTop=scrollY+viewerRect.top;
  const headerHeight=header?.getBoundingClientRect().height||0;
  const shellHeight=Math.max(420,innerHeight-headerHeight);
  const start=viewerTop-headerHeight;
  const end=viewerTop+viewer.offsetHeight-shellHeight-headerHeight;
  return {start,end,distance:Math.max(1,end-start)};
}

function updateFromScroll(){
  scrollRaf=0;
  const {start,distance}=scrollMetrics();
  const progress=Math.max(0,Math.min(1,(scrollY-start)/distance));
  const index=Math.round(progress*(data.images.length-1));
  setTarget(index);
}

function requestScrollUpdate(){
  if(!scrollRaf)scrollRaf=requestAnimationFrame(updateFromScroll);
}

function scrollToIndex(index){
  index=clampIndex(index);
  const {start,distance}=scrollMetrics();
  const progress=data.images.length<=1?0:index/(data.images.length-1);
  scrollTo({
    top:start+distance*progress,
    behavior:reduced.matches?'auto':'smooth'
  });
}

if(hint)hint.textContent='Прокручивайте страницу — блок остаётся на месте, изображения меняются внутри';

if(previous)previous.addEventListener('click',()=>scrollToIndex(current-1));
if(next)next.addEventListener('click',()=>scrollToIndex(current+1));
thumbs.forEach(button=>button.addEventListener('click',()=>scrollToIndex(Number(button.dataset.slide))));

addEventListener('keydown',event=>{
  if(event.altKey||event.metaKey||event.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();scrollToIndex(current+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();scrollToIndex(current-1);}
});

let touch=null;
stage.addEventListener('touchstart',event=>{
  if(event.touches.length===1)touch={x:event.touches[0].clientX,y:event.touches[0].clientY};
  else touch=null;
},{passive:true});
stage.addEventListener('touchend',event=>{
  if(!touch)return;
  const dx=event.changedTouches[0].clientX-touch.x;
  const dy=event.changedTouches[0].clientY-touch.y;
  touch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5){
    scrollToIndex(current+(dx<0?1:-1));
  }
},{passive:true});

addEventListener('scroll',requestScrollUpdate,{passive:true});
addEventListener('resize',layoutViewer,{passive:true});

updatePeeks(0);
layoutViewer();
requestScrollUpdate();
