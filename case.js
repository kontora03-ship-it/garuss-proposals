const data=JSON.parse(document.querySelector('#case-data').textContent);
const image=document.querySelector('#slide-image'),stage=document.querySelector('#slide-stage');
const counter=document.querySelector('#slide-count'),previous=document.querySelector('#previous-slide'),next=document.querySelector('#next-slide');
const thumbs=[...document.querySelectorAll('[data-slide]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const leftPeek=document.createElement('img');
const rightPeek=document.createElement('img');
leftPeek.className='side-peek side-peek-prev';
rightPeek.className='side-peek side-peek-next';
leftPeek.alt=''; rightPeek.alt='';
leftPeek.setAttribute('aria-hidden','true');
rightPeek.setAttribute('aria-hidden','true');
stage.insertBefore(leftPeek,image);
stage.appendChild(rightPeek);

let current=0,requested=0,sequence=0,lastDirection=1;
function updatePeeks(index){
  const previousSlide=data.images[index-1];
  const nextSlide=data.images[index+1];

  // Left is always previous, right is always next.
  if(previousSlide){
    leftPeek.src=previousSlide.src;
    leftPeek.hidden=false;
  }else{
    leftPeek.removeAttribute('src');
    leftPeek.hidden=true;
  }

  if(nextSlide){
    rightPeek.src=nextSlide.src;
    rightPeek.hidden=false;
  }else{
    rightPeek.removeAttribute('src');
    rightPeek.hidden=true;
  }
}
function animateFrame(direction){
  if(reduced.matches)return;
  image.animate([
    {opacity:.55,transform:`translateX(${direction*28}px) scale(.992)`},
    {opacity:1,transform:'translateX(0) scale(1)'}
  ],{duration:620,easing:'cubic-bezier(.22,1,.36,1)'});
  [leftPeek,rightPeek].forEach((peek,i)=>{
    if(peek.hidden)return;
    peek.animate([
      {opacity:0,transform:`translateX(${direction*(i?18:-18)}px) scale(.985)`},
      {opacity:.42,transform:'translateX(0) scale(1)'}
    ],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
  });
}
function show(index,direction){
  if(index<0||index>=data.images.length)return;
  lastDirection=direction??(index>current?1:index<current?-1:lastDirection);
  requested=index;
  const token=++sequence,slide=data.images[index],preload=new Image();
  stage.classList.add('loading');
  preload.onload=()=>{
    if(token!==sequence)return;
    current=index;
    image.src=slide.src;
    image.width=slide.width;
    image.height=slide.height;
    image.alt=`${data.title}. Изображение ${index+1}`;
    counter.textContent=`${index+1} / ${data.images.length}`;
    if(previous)previous.disabled=index===0;
    if(next)next.disabled=index===data.images.length-1;
    document.querySelector('#full-image').href=slide.src;
    thumbs.forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
    updatePeeks(index);
    stage.classList.remove('loading');
    animateFrame(lastDirection);
    [data.images[index-1],data.images[index+1]].filter(Boolean).forEach(item=>{const adjacent=new Image();adjacent.src=item.src;});
  };
  preload.onerror=()=>{
    if(token!==sequence)return;
    stage.classList.remove('loading');
    requested=current;
    counter.textContent='Не удалось загрузить. Попробуйте ещё раз.';
  };
  preload.src=slide.src;
}
updatePeeks(0);

if(previous)previous.addEventListener('click',()=>show(requested-1,-1));
if(next)next.addEventListener('click',()=>show(requested+1,1));
thumbs.forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.slide);show(i,i>=current?1:-1);}));
addEventListener('keydown',event=>{
  if(event.altKey||event.metaKey||event.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();show(requested+1,1);}
  if(event.key==='ArrowLeft'){event.preventDefault();show(requested-1,-1);}
});

let touch=null;
stage.addEventListener('touchstart',event=>{
  if(event.touches.length===1)touch={x:event.touches[0].clientX,y:event.touches[0].clientY};
  else touch=null;
},{passive:true});
stage.addEventListener('touchend',event=>{
  if(!touch)return;
  const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;
  touch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(requested+(dx<0?1:-1),dx<0?1:-1);
},{passive:true});

const slideHint=document.querySelector('.slide-hint');
if(slideHint)slideHint.textContent='Когда изображение в центре экрана — листайте колесом, трекпадом, стрелками или свайпом';

let wheelSum=0,wheelLocked=false,wheelReset;
let viewerPinned=false;
let releasedDirection=0;
let pinnedScrollY=0;
let forcingScroll=false;

function stageCenterDelta(){
  const rect=stage.getBoundingClientRect();
  return (rect.top+rect.height/2)-(innerHeight/2);
}
function lockStageExactly(){
  const delta=stageCenterDelta();
  pinnedScrollY=Math.round(scrollY+delta);
  forcingScroll=true;
  scrollTo({top:pinnedScrollY,behavior:'auto'});
  requestAnimationFrame(()=>{forcingScroll=false;});
}
function shouldCapture(event){
  const delta=stageCenterDelta();
  const projected=delta-event.deltaY;
  const closeEnough=Math.abs(delta)<=Math.min(150,innerHeight*.15);
  const crossesCenter=(delta>0&&projected<=0)||(delta<0&&projected>=0);
  return closeEnough||crossesCenter;
}
function setPinned(value){
  viewerPinned=value;
  stage.classList.toggle('is-pinned',value);
  wheelSum=0;
  if(value){
    releasedDirection=0;
    lockStageExactly();
  }
}

addEventListener('scroll',()=>{
  if(!viewerPinned||forcingScroll)return;
  if(Math.abs(scrollY-pinnedScrollY)>1){
    forcingScroll=true;
    scrollTo({top:pinnedScrollY,behavior:'auto'});
    requestAnimationFrame(()=>{forcingScroll=false;});
  }
},{passive:true});

addEventListener('wheel',event=>{
  if(Math.abs(event.deltaY)<Math.abs(event.deltaX))return;
  const direction=event.deltaY>0?1:-1;

  if(!viewerPinned&&releasedDirection){
    if(direction===releasedDirection)return;
    releasedDirection=0;
  }

  if(!viewerPinned){
    if(!shouldCapture(event))return;
    event.preventDefault();
    setPinned(true);
    return;
  }

  const atFirst=requested<=0;
  const atLast=requested>=data.images.length-1;

  if((direction>0&&atLast)||(direction<0&&atFirst)){
    setPinned(false);
    releasedDirection=direction;
    return;
  }

  event.preventDefault();
  lockStageExactly();
  if(wheelLocked)return;

  wheelSum+=event.deltaY;
  clearTimeout(wheelReset);
  wheelReset=setTimeout(()=>{wheelSum=0;},170);
  if(Math.abs(wheelSum)<48)return;

  const target=requested+direction;
  if(target<0||target>=data.images.length)return;

  wheelLocked=true;
  wheelSum=0;
  show(target,direction);
  setTimeout(()=>{
    wheelLocked=false;
    if(viewerPinned)lockStageExactly();
  },680);
},{passive:false});

/* Keep stage height matched to the rendered central slide */
function syncStageHeight(){
  requestAnimationFrame(()=>{
    const h=image.getBoundingClientRect().height;
    if(h>0)stage.style.setProperty('--stage-height',Math.ceil(h)+'px');
    if(viewerPinned){
      requestAnimationFrame(()=>lockStageExactly());
      setTimeout(()=>{if(viewerPinned)lockStageExactly();},560);
    }
  });
}
image.addEventListener('load',syncStageHeight);
addEventListener('resize',syncStageHeight,{passive:true});
if(image.complete)syncStageHeight();
