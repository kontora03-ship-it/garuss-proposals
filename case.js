const data=JSON.parse(document.querySelector('#case-data').textContent);
const viewer=document.querySelector('.viewer');

if(viewer){
  viewer.innerHTML='';
  viewer.className='viewer vertical-gallery';

  const lightbox=document.createElement('div');
  lightbox.className='case-lightbox';
  lightbox.hidden=true;
  lightbox.setAttribute('role','dialog');
  lightbox.setAttribute('aria-modal','true');
  lightbox.setAttribute('aria-label','Увеличенное изображение');

  const lightboxImage=document.createElement('img');
  lightboxImage.className='case-lightbox-image';
  lightboxImage.alt='';

  const closeButton=document.createElement('button');
  closeButton.className='case-lightbox-close';
  closeButton.type='button';
  closeButton.setAttribute('aria-label','Закрыть увеличенное изображение');
  closeButton.innerHTML='×';

  lightbox.append(lightboxImage,closeButton);
  document.body.appendChild(lightbox);

  let lastFocused=null;

  function openLightbox(img){
    lastFocused=document.activeElement;
    lightboxImage.src=img.currentSrc||img.src;
    lightboxImage.alt=img.alt;
    lightbox.hidden=false;
    document.body.classList.add('lightbox-open');
    requestAnimationFrame(()=>lightbox.classList.add('is-open'));
    closeButton.focus({preventScroll:true});
  }

  function closeLightbox(){
    if(lightbox.hidden)return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    setTimeout(()=>{
      lightbox.hidden=true;
      lightboxImage.removeAttribute('src');
      if(lastFocused&&typeof lastFocused.focus==='function')lastFocused.focus({preventScroll:true});
    },220);
  }

  closeButton.addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',event=>{
    if(event.target===lightbox)closeLightbox();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!lightbox.hidden)closeLightbox();
  });

  const observer='IntersectionObserver' in window
    ? new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },{rootMargin:'0px 0px -10% 0px',threshold:.10})
    : null;

  data.images.forEach((slide,index)=>{
    const figure=document.createElement('figure');
    figure.className='gallery-item';

    const img=document.createElement('img');
    img.className='gallery-image';
    img.src=slide.src;
    img.width=slide.width;
    img.height=slide.height;
    img.alt=`${data.title}. Изображение ${index+1}`;
    img.decoding='async';
    img.tabIndex=0;
    img.setAttribute('role','button');
    img.setAttribute('aria-label',`Увеличить изображение ${index+1}`);

    if(index===0){
      img.loading='eager';
      img.fetchPriority='high';
    }else{
      img.loading='lazy';
      img.fetchPriority='low';
    }

    const markReady=()=>figure.classList.add('is-ready');
    if(img.complete){
      if(typeof img.decode==='function')img.decode().catch(()=>{}).finally(markReady);
      else markReady();
    }else{
      img.addEventListener('load',markReady,{once:true});
      img.addEventListener('error',markReady,{once:true});
    }

    img.addEventListener('click',()=>openLightbox(img));
    img.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        openLightbox(img);
      }
    });

    figure.appendChild(img);
    viewer.appendChild(figure);

    if(observer)observer.observe(figure);
    else figure.classList.add('is-visible');
  });
}


/* Case scroll progress */
const progressBar=document.createElement('div');
progressBar.className='case-scroll-progress';
progressBar.setAttribute('aria-hidden','true');
document.body.appendChild(progressBar);

let progressRaf=0;
function updateScrollProgress(){
  progressRaf=0;
  const maxScroll=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const progress=Math.max(0,Math.min(1,scrollY/maxScroll));
  progressBar.style.transform=`scaleX(${progress})`;
}
function requestProgressUpdate(){
  if(!progressRaf)progressRaf=requestAnimationFrame(updateScrollProgress);
}
addEventListener('scroll',requestProgressUpdate,{passive:true});
addEventListener('resize',requestProgressUpdate,{passive:true});
requestProgressUpdate();


/* Gentle mouse-wheel smoothing; trackpads keep native scrolling */
if(!reduced.matches){
  let smoothTarget=scrollY;
  let smoothCurrent=scrollY;
  let smoothRaf=0;
  let lastWheelAt=0;

  function animateSmoothScroll(){
    const diff=smoothTarget-smoothCurrent;
    smoothCurrent+=diff*.105;

    if(Math.abs(diff)<.45){
      smoothCurrent=smoothTarget;
      scrollTo(0,smoothCurrent);
      smoothRaf=0;
      return;
    }

    scrollTo(0,smoothCurrent);
    smoothRaf=requestAnimationFrame(animateSmoothScroll);
  }

  addEventListener('wheel',event=>{
    if(document.body.classList.contains('lightbox-open'))return;
    if(event.ctrlKey)return;

    const absY=Math.abs(event.deltaY);
    const looksLikeMouseWheel=event.deltaMode!==0||absY>=45;
    if(!looksLikeMouseWheel)return;

    event.preventDefault();

    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const multiplier=event.deltaMode===1?22:1;
    smoothTarget=Math.max(0,Math.min(max,smoothTarget+event.deltaY*multiplier*.72));

    if(!smoothRaf){
      smoothCurrent=scrollY;
      smoothRaf=requestAnimationFrame(animateSmoothScroll);
    }

    lastWheelAt=performance.now();
  },{passive:false});

  addEventListener('scroll',()=>{
    if(!smoothRaf){
      smoothTarget=scrollY;
      smoothCurrent=scrollY;
    }
  },{passive:true});
}
