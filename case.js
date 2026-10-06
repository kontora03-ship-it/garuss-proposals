const data=JSON.parse(document.querySelector('#case-data').textContent);
const image=document.querySelector('#slide-image'),stage=document.querySelector('#slide-stage');
const counter=document.querySelector('#slide-count'),previous=document.querySelector('#previous-slide'),next=document.querySelector('#next-slide');
const thumbs=[...document.querySelectorAll('[data-slide]')];
let current=0,requested=0,sequence=0;
function show(index){
 if(index<0||index>=data.images.length)return;
 requested=index;const token=++sequence,slide=data.images[index],preload=new Image();
 stage.classList.add('loading');
 preload.onload=()=>{
  if(token!==sequence)return;
  current=index;image.src=slide.src;image.width=slide.width;image.height=slide.height;image.alt=`${data.title}. Изображение ${index+1}`;
  counter.textContent=`${index+1} / ${data.images.length}`;previous.disabled=index===0;next.disabled=index===data.images.length-1;
  document.querySelector('#full-image').href=slide.src;
  thumbs.forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
  stage.classList.remove('loading');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)image.animate([{opacity:.3},{opacity:1}],{duration:320,easing:'ease-out'});
  if(data.images[index+1]){const adjacent=new Image();adjacent.src=data.images[index+1].src;}
 };
 preload.onerror=()=>{if(token!==sequence)return;stage.classList.remove('loading');requested=current;counter.textContent='Не удалось загрузить. Попробуйте ещё раз.';};
 preload.src=slide.src;
}
previous.addEventListener('click',()=>show(requested-1));next.addEventListener('click',()=>show(requested+1));
thumbs.forEach(button=>button.addEventListener('click',()=>show(Number(button.dataset.slide))));
addEventListener('keydown',event=>{if(event.altKey||event.metaKey||event.ctrlKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;if(event.key==='ArrowRight'){event.preventDefault();show(requested+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(requested-1);}});
let touch=null;
stage.addEventListener('touchstart',event=>{if(event.touches.length===1)touch={x:event.touches[0].clientX,y:event.touches[0].clientY};else touch=null;},{passive:true});
stage.addEventListener('touchend',event=>{if(!touch)return;const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(requested+(dx<0?1:-1));},{passive:true});


/* Wheel/trackpad slide navigation */
const slideHint=document.querySelector('.slide-hint');
if(slideHint) slideHint.textContent='Листайте колесом мыши, трекпадом, стрелками клавиатуры или свайпом';
let wheelSum=0,wheelLocked=false,wheelReset;
stage.addEventListener('wheel',event=>{
  if(Math.abs(event.deltaY)<Math.abs(event.deltaX)) return;

  const rect=stage.getBoundingClientRect();
  const stageCenter=rect.top+rect.height/2;
  const viewportCenter=innerHeight/2;
  const centerTolerance=Math.min(110,innerHeight*.12);
  const isCentered=Math.abs(stageCenter-viewportCenter)<=centerTolerance;

  // Before the image reaches the screen center, keep normal page scrolling.
  if(!isCentered) return;

  const direction=event.deltaY>0?1:-1;
  const target=requested+direction;

  // At the first/last slide, release the wheel back to page scrolling.
  if(target<0||target>=data.images.length) return;

  event.preventDefault();
  if(wheelLocked) return;

  wheelSum+=event.deltaY;
  clearTimeout(wheelReset);
  wheelReset=setTimeout(()=>{wheelSum=0;},140);
  if(Math.abs(wheelSum)<36) return;

  wheelLocked=true;
  wheelSum=0;
  show(target);
  setTimeout(()=>{wheelLocked=false;},420);
},{passive:false});
