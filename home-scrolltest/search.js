(()=>{
 const host=document.querySelector('.header-search');
 const input=host.querySelector('input');
 const clear=host.querySelector('.search-clear');
 const panel=host.querySelector('.search-results');
 const list=host.querySelector('.search-result-list');
 const status=host.querySelector('.search-status');
 const pageInput=document.querySelector('.catalog-query input');
 const pageClear=document.querySelector('.catalog-query-clear');
 const categoryButtons=[...document.querySelectorAll('[data-category]')];
 const empty=document.querySelector('.catalog-search-empty');
 const aliases=[['nordgold','нордголд норд голд'],['malltech','моллтех маллтех молл тех'],['бурсервис','burservice bursservice бур сервис'],['акку','akku vertrieb фертриб'],['земский','zemsky zemskij']];
 function normalize(value){return value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim();}
 function tokens(value){return normalize(value).split(/\s+/).filter(Boolean).map(word=>word.replace(/^подар(?:ок|ки|ков|ка|ку|ками|ках)$/,'подар').replace(/^наград[а-я]*$/,'наград').replace(/^упаков[а-я]*$/,'упаков').replace(/^игр(?:а|ы|у|е|ой|ами|ах)$/,'игр'));}
 const cards=[...document.querySelectorAll('.test-grid .presentation-card')];
 const entries=(window.GARUSS_CATALOG||[]).map(entry=>{
  let text=normalize(entry.client+' '+entry.title+' '+entry.categories.join(' '));
  aliases.forEach(([name,variants])=>{if(text.includes(name))text+=' '+normalize(variants);});
  return {...entry,text,card:cards.find(card=>card.querySelector('a').getAttribute('href')===entry.href)};
 });
 let category='Все кейсы';
 const params=new URLSearchParams(location.search);
 if(!pageInput&&params.has('resume')){try{const state=JSON.parse(sessionStorage.getItem('garuss-case-return')||'null');if(categoryButtons.some(b=>b.dataset.category===state?.category))category=state.category;}catch{}}
 if(pageInput){pageInput.value=params.get('q')||'';input.value=pageInput.value;const requested=params.get('category');if(categoryButtons.some(b=>b.dataset.category===requested))category=requested;}
 function match(query,section='Все кейсы'){const terms=tokens(query);return entries.filter(e=>(section==='Все кейсы'||e.categories.includes(section))&&terms.every(term=>e.text.includes(term)));}
 function updateURL(){if(!pageInput)return;const url=new URL(location.href);url.searchParams.delete('q');url.searchParams.delete('category');if(pageInput.value.trim())url.searchParams.set('q',pageInput.value.trim());if(category!=='Все кейсы')url.searchParams.set('category',category);history.replaceState(null,'',url);}
 function renderCatalog(){
  if(!empty)return;
  const found=new Set(match(pageInput?pageInput.value:'',category));
  entries.forEach(e=>e.card.hidden=!found.has(e));
  document.querySelector('#result-count').textContent=found.size;
  empty.hidden=found.size!==0;
  categoryButtons.forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  if(pageClear)pageClear.hidden=!pageInput.value;
  clear.hidden=!input.value;
  updateURL();
  requestAnimationFrame(()=>{if(typeof sc!=='undefined')sc.layout();if(typeof measure==='function')measure();});
 }
 function close(){panel.hidden=true;input.setAttribute('aria-expanded','false');}
 function suggestions(){
  clear.hidden=!input.value;list.replaceChildren();
  if(!input.value.trim()){close();return;}
  const found=match(input.value);status.textContent=`Найдено кейсов: ${found.length}`;
  found.forEach(entry=>{
   const link=document.createElement('a');link.className='search-result';link.href=entry.href;
   const image=document.createElement('img');image.src=entry.image;image.alt='';image.width=72;image.height=54;
   const text=document.createElement('span');const client=document.createElement('small');client.textContent=entry.client;
   const title=document.createElement('span');title.textContent=entry.title;text.append(client,title);link.append(image,text);list.append(link);
  });
  if(!found.length){const p=document.createElement('p');p.className='search-no-results';p.textContent='Ничего не найдено. Попробуйте другое название.';list.append(p);}
  host.querySelector('.search-all').href='/garuss-proposals/home-scrolltest/search.html?q='+encodeURIComponent(input.value.trim());
  panel.hidden=false;input.setAttribute('aria-expanded','true');
 }
 input.addEventListener('input',suggestions);input.addEventListener('focus',suggestions);
 clear.addEventListener('click',()=>{input.value='';suggestions();input.focus();});
 host.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();input.focus();close();}
  if(event.key==='ArrowDown'&&event.target===input){const first=list.querySelector('a');if(!panel.hidden&&first){event.preventDefault();first.focus();}}
  if(event.key==='ArrowUp'&&event.target===list.querySelector('a')){event.preventDefault();input.focus();}
 });
 document.addEventListener('pointerdown',event=>{if(!host.contains(event.target))close();});
 host.addEventListener('focusout',event=>{if(event.relatedTarget&&!host.contains(event.relatedTarget))close();});
 categoryButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;renderCatalog();}));
 empty?.querySelector('button').addEventListener('click',()=>{category='Все кейсы';if(pageInput){pageInput.value='';input.value='';}renderCatalog();});
 if(pageInput){
  pageInput.addEventListener('input',()=>{input.value=pageInput.value;clear.hidden=!input.value;close();renderCatalog();});
  pageClear.addEventListener('click',()=>{pageInput.value='';input.value='';clear.hidden=true;renderCatalog();pageInput.focus();});
  document.querySelector('.catalog-query').addEventListener('submit',event=>{event.preventDefault();renderCatalog();close();});
 }
 clear.hidden=!input.value;renderCatalog();
})();
