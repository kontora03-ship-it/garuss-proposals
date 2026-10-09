(()=>{
 const key='garuss-case-return';
 const isCase=document.body.classList.contains('case-page');
 let context=null;
 try{context=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 function valid(value){try{const u=new URL(value,location.origin);return u.origin===location.origin&&['/garuss-proposals/','/garuss-proposals/home-scrolltest/','/garuss-proposals/home-scrolltest/search.html'].includes(u.pathname);}catch{return false;}}
 if(isCase){
  let fallback='/garuss-proposals/home-scrolltest/#catalog';
  if(document.referrer&&valid(document.referrer)){
   const ref=new URL(document.referrer);
   if(ref.pathname==='/garuss-proposals/')context={url:ref.pathname+'?return=1#catalog',y:0};
  }
  document.querySelectorAll('.case-bottom>.back-link').forEach(link=>{
   const url=new URL(context&&valid(context.url)?context.url:fallback,location.origin);
   if(context&&url.pathname.includes('/home-scrolltest/'))url.searchParams.set('resume','1');
   link.href=url.pathname+url.search+url.hash;
   if(context&&url.pathname.endsWith('/search.html'))link.textContent='← К результатам поиска';
  });
  const intro=document.querySelector('.case-intro');
  const entry=(window.GARUSS_CATALOG||[]).find(e=>e.href===location.pathname);
  if(entry&&intro){
   const meta=document.createElement('div');meta.className='case-meta';
   const number=document.createElement('span');number.className='case-number';number.textContent='КЕЙС '+String(entry.number).padStart(2,'0');
   const category=document.createElement('span');category.textContent=entry.categories.join(' / ');
   const count=document.createElement('span');count.textContent=JSON.parse(document.querySelector('#case-data').textContent).images.length+' кадров';
   meta.append(number,category,count);intro.append(meta);
  }
 }else{
  document.addEventListener('click',event=>{
   const a=event.target.closest('a[href]');if(!a||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const url=new URL(a.href,location.href);
   if(url.origin===location.origin&&url.pathname.startsWith('/garuss-proposals/cases/')){
    try{sessionStorage.setItem(key,JSON.stringify({url:location.pathname+location.search+location.hash,y:scrollY,category:document.querySelector('[data-category].active')?.dataset.category||'Все кейсы'}));}catch{}
   }
  });
  if(new URLSearchParams(location.search).has('resume')&&context&&valid(context.url)){
   async function restore(){
    await Promise.allSettled([document.fonts.ready,typeof sceneAssetsReady!=='undefined'?sceneAssetsReady:Promise.resolve()]);
    requestAnimationFrame(()=>{if(typeof sc!=='undefined')sc.layout();window.scrollTo({top:Number(context.y)||0,behavior:'instant'});if(typeof cancelWheel==='function')cancelWheel();const url=new URL(location.href);url.searchParams.delete('resume');history.replaceState(null,'',url);});
   }
   if(document.readyState==='complete')restore();else addEventListener('load',restore,{once:true});
  }
 }
})();
