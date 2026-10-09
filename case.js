(()=>{
 const data=JSON.parse(document.querySelector('#case-data').textContent);
 const viewer=document.querySelector('.viewer');if(!viewer)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 viewer.replaceChildren();viewer.className='viewer vertical-gallery';
 const box=document.createElement('div');box.className='case-lightbox';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Просмотр изображений кейса');
 const image=document.createElement('img');image.className='case-lightbox-image';
 const makeButton=(name,cls,label)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);b.textContent=name;return b;};
 const close=makeButton('×','case-lightbox-close','Закрыть просмотр');
 const prev=makeButton('‹','case-lightbox-prev','Предыдущий кадр');
 const next=makeButton('›','case-lightbox-next','Следующий кадр');
 const count=document.createElement('span');count.className='case-lightbox-count';count.setAttribute('role','status');count.setAttribute('aria-live','polite');
 box.append(image,close,prev,next,count);document.body.append(box);
 let selected=0,lastFocused=null,background=[];
 function show(index){
  selected=Math.max(0,Math.min(data.images.length-1,index));const slide=data.images[selected];
  image.src=slide.src;image.alt=`${data.title}. Кадр ${selected+1}`;
  count.textContent=String(selected+1).padStart(2,'0')+' / '+String(data.images.length).padStart(2,'0');
  prev.disabled=selected===0;next.disabled=selected===data.images.length-1;
 }
 function open(index){lastFocused=document.activeElement;show(index);box.hidden=false;document.body.classList.add('lightbox-open');background=[...document.body.children].filter(e=>e!==box&&!['SCRIPT','STYLE'].includes(e.tagName)).map(e=>({e,inert:e.inert}));background.forEach(({e})=>e.inert=true);close.focus({preventScroll:true});}
 function hide(){if(box.hidden)return;box.hidden=true;document.body.classList.remove('lightbox-open');background.forEach(({e,inert})=>e.inert=inert);image.removeAttribute('src');lastFocused?.focus({preventScroll:true});}
 close.addEventListener('click',hide);prev.addEventListener('click',()=>show(selected-1));next.addEventListener('click',()=>show(selected+1));
 box.addEventListener('click',e=>{if(e.target===box)hide();});
 box.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();hide();}
  if(e.key==='ArrowLeft'){e.preventDefault();show(selected-1);}
  if(e.key==='ArrowRight'){e.preventDefault();show(selected+1);}
  if(e.key==='Tab'){
   const buttons=[...box.querySelectorAll('button')].filter(b=>!b.disabled);const index=buttons.indexOf(document.activeElement);
   if(e.shiftKey&&index===0){e.preventDefault();buttons.at(-1).focus();}
   else if(!e.shiftKey&&index===buttons.length-1){e.preventDefault();buttons[0].focus();}
  }
 });
 let touchX=null;box.addEventListener('touchstart',e=>{touchX=e.touches.length===1?e.touches[0].clientX:null;},{passive:true});box.addEventListener('touchend',e=>{if(touchX===null||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>60)show(selected+(dx<0?1:-1));touchX=null;},{passive:true});
 const observer=!reduced.matches&&'IntersectionObserver' in window?new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{rootMargin:'150px 0px',threshold:0}):null;
 data.images.forEach((slide,index)=>{
  const figure=document.createElement('figure');figure.className='gallery-item';
  const img=document.createElement('img');img.className='gallery-image';img.src=slide.src;img.width=slide.width;img.height=slide.height;img.alt=`${data.title}. Кадр ${index+1}`;img.decoding='async';img.loading=index===0?'eager':'lazy';if(index===0)img.fetchPriority='high';img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label',`Открыть кадр ${index+1} из ${data.images.length}`);
  img.addEventListener('click',()=>open(index));img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(index);}});
  const caption=document.createElement('figcaption');caption.className='gallery-caption';const label=document.createElement('span');label.textContent=String(index+1).padStart(2,'0')+' / '+String(data.images.length).padStart(2,'0');const hint=document.createElement('span');hint.textContent='Нажмите, чтобы рассмотреть';caption.append(label,hint);
  figure.append(img,caption);viewer.append(figure);if(observer)observer.observe(figure);else figure.classList.add('is-visible');
 });
 reduced.addEventListener('change',()=>{if(reduced.matches){observer?.disconnect();viewer.querySelectorAll('.gallery-item').forEach(e=>e.classList.add('is-visible'));}});
 const track=document.createElement('div');track.className='case-scroll-track';track.setAttribute('aria-hidden','true');const bar=document.createElement('div');bar.className='case-scroll-progress';track.append(bar);document.body.append(track);
 let raf=0;function update(){raf=0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);bar.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollY/max))})`;}
 function schedule(){if(!raf)raf=requestAnimationFrame(update);}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});if('ResizeObserver' in window)new ResizeObserver(schedule).observe(viewer);schedule();
})();
