const data=JSON.parse(document.querySelector('#case-data').textContent);
const image=document.querySelector('#slide-image'),stage=document.querySelector('#slide-stage');
const viewer=document.querySelector('.viewer');
const counter=document.querySelector('#slide-count'),previous=document.querySelector('#previous-slide'),next=document.querySelector('#next-slide');
const thumbs=[...document.querySelectorAll('[data-slide]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const prevPeek=document.createElement('img');
const nextPeek=document.createElement('img');
prevPeek.className='side-peek side-peek-prev';
nextPeek.className='side-peek side-peek-next';
prevPeek.alt='';nextPeek.alt='';
prevPeek.setAttribute('aria-hidden','true');
nextPeek.setAttribute('aria-hidden','true');
stage.insertBefore(prevPeek,image);
stage.appendChild(nextPeek);

let current=0,requested=0,sequence=0,lastDirection=1;
function updatePeeks(index){
  const p=data.images[index-1],n=data.images[index+1];
  if(p){prevPeek.src=p.src;prevPeek.hidden=false;}else{prevPeek.hidden=true;prevPeek.removeAttribute('src');}
  if(n){nextPeek.src=n.src;nextPeek.hidden=false;}else{nextPeek.hidden=true;nextPeek.removeAttribute('src');}
}
function animateFrame(direction){
  if(reduced.matches)return;
  image.animate([
    {opacity:.58,transform:`translateX(${direction*24}px) scale(.994)`},
    {opacity:1,transform:'translateX(0) scale(1)'}
  ],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
  [prevPeek,nextPeek].forEach((peek,i)=>{
    if(peek.hidden)return;
    peek.animate([
      {opacity:.22,transform:`translateY(-50%) translateX(${direction*(i?14:-14)}px) scale(.925)`},
      {opacity:.58,transform:'translateY(-50%) translateX(0) scale(.94)'}
    ],{duration:720,easing:'cubic-bezier(.22,1,.36,1)'});
  });
}
function show(index,direction){
  index=Math.max(0,Math.min(data.images.length-1,index));
  if(index===current&&image.complete){updatePeeks(index);return;}
  lastDirection=direction??(index>current?1:-1);
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
    [data.images[index-1],data.images[index+1]].filter(Boolean).forEach(item=>{const a=new Image();a.src=item.src;});
  };
  preload.onerror=()=>{if(token===sequence){stage.classList.remove('loading');requested=current;}};
  preload.src=slide.src;
}
updatePeeks(0);

const slideHint=document.querySelector('.slide-hint');
if(slideHint)slideHint.textContent='Прокручивайте страницу — блок фиксируется и последовательно показывает все слайды';

const stepVH=72;
function setupPinnedViewer(){
  if(!viewer||reduced.matches)return;
  viewer.style.setProperty('--slide-count',String(data.images.length));
  viewer.style.setProperty('--slide-step',stepVH+'vh');
}
setupPinnedViewer();

let raf=0;
function updateFromScroll(){
  raf=0;
  if(!viewer||reduced.matches)return;
  const rect=viewer.getBoundingClientRect();
  const viewerTop=scrollY+rect.top;
  const stickyTop=innerHeight*.10;
  const stageHeight=innerHeight*.80;
  const pinStart=viewerTop-stickyTop;
  const pinEnd=viewerTop+viewer.offsetHeight-stageHeight-stickyTop;
  const pinDistance=Math.max(1,pinEnd-pinStart);
  const progress=Math.max(0,Math.min(1,(scrollY-pinStart)/pinDistance));
  const exact=progress*(data.images.length-1);
  const index=Math.max(0,Math.min(data.images.length-1,Math.round(exact)));
  if(index!==requested)show(index,index>requested?1:-1);
}
function requestUpdate(){if(!raf)raf=requestAnimationFrame(updateFromScroll);}
addEventListener('scroll',requestUpdate,{passive:true});
addEventListener('resize',()=>{setupPinnedViewer();requestUpdate();},{passive:true});
requestUpdate();

function scrollToSlide(index){
  if(!viewer)return;
  index=Math.max(0,Math.min(data.images.length-1,index));
  const rect=viewer.getBoundingClientRect();
  const viewerTop=scrollY+rect.top;
  const stickyTop=innerHeight*.10;
  const stageHeight=innerHeight*.80;
  const pinStart=viewerTop-stickyTop;
  const pinEnd=viewerTop+viewer.offsetHeight-stageHeight-stickyTop;
  const pinDistance=Math.max(1,pinEnd-pinStart);
  const progress=data.images.length<=1?0:index/(data.images.length-1);
  scrollTo({top:pinStart+pinDistance*progress,behavior:reduced.matches?'auto':'smooth'});
}
if(previous)previous.addEventListener('click',()=>scrollToSlide(current-1));
if(next)next.addEventListener('click',()=>scrollToSlide(current+1));
thumbs.forEach(button=>button.addEventListener('click',()=>scrollToSlide(Number(button.dataset.slide))));
addEventListener('keydown',event=>{
  if(event.altKey||event.metaKey||event.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(event.key==='ArrowRight'){event.preventDefault();scrollToSlide(current+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();scrollToSlide(current-1);}
});

let touch=null;
stage.addEventListener('touchstart',event=>{
  if(event.touches.length===1)touch={x:event.touches[0].clientX,y:event.touches[0].clientY};else touch=null;
},{passive:true});
stage.addEventListener('touchend',event=>{
  if(!touch)return;
  const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;
  touch=null;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)scrollToSlide(current+(dx<0?1:-1));
},{passive:true});
