(()=>{
 const host=document.querySelector('.header-search');
 const toggle=host.querySelector('.search-toggle');
 const input=host.querySelector('input');
 const clear=host.querySelector('.search-clear');
 const panel=host.querySelector('.search-results');
 const list=host.querySelector('.search-result-list');
 const status=host.querySelector('.search-status');
 const categoryButtons=[...document.querySelectorAll('[data-category]')];
 const empty=document.querySelector('.catalog-search-empty');
 const aliases=[['nordgold','нордголд норд голд'],['malltech','моллтех маллтех молл тех'],['бурсервис','burservice bursservice бур сервис'],['акку','akku vertrieb фертриб'],['земский','zemsky zemskij']];
 function normalize(value){return value.toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/g,' ').trim();}
 function tokens(value){return normalize(value).split(/\s+/).filter(Boolean).map(word=>word.replace(/^подар(?:ок|ки|ков|ка|ку|ками|ках)$/,'подар').replace(/^наград[а-я]*$/,'наград').replace(/^упаков[а-я]*$/,'упаков').replace(/^игр(?:а|ы|у|е|ой|ами|ах)$/,'игр'));}
 const entries=[...document.querySelectorAll('.test-grid .presentation-card')].map(card=>{
  const client=card.querySelector('.card-meta').textContent.trim();
  const title=card.querySelector('h2').textContent.trim();
  let text=normalize(client+' '+title+' '+card.dataset.categories);
  aliases.forEach(([name,variants])=>{if(text.includes(name))text+=' '+normalize(variants);});
  return {card,client,title,text,href:card.querySelector('a').getAttribute('href'),image:card.querySelector('img').getAttribute('src'),categories:card.dataset.categories.split('|')};
 });
 let category='Все кейсы';
 function matching(){const terms=tokens(input.value);return entries.filter(e=>(category==='Все кейсы'||e.categories.includes(category))&&terms.every(term=>e.text.includes(term)));}
 function render(){
  const found=matching();const matched=new Set(found);
  entries.forEach(e=>{e.card.hidden=!matched.has(e);});
  document.querySelector('#result-count').textContent=found.length;
  empty.hidden=found.length!==0;
  clear.hidden=!input.value;
  status.textContent=input.value.trim()?`Найдено кейсов: ${found.length}`:category==='Все кейсы'?'Поиск по клиенту, проекту или продукции':`Раздел «${category}»: ${found.length}`;
  list.replaceChildren();
  found.forEach(entry=>{
   const link=document.createElement('a');link.className='search-result';link.href=entry.href;
   const image=document.createElement('img');image.src=entry.image;image.alt='';image.width=72;image.height=54;image.loading='lazy';
   const text=document.createElement('span');const client=document.createElement('small');client.textContent=entry.client;
   const title=document.createElement('span');title.textContent=entry.title;text.append(client,title);link.append(image,text);list.append(link);
  });
  if(!found.length){const p=document.createElement('p');p.className='search-no-results';p.textContent='Ничего не найдено. Попробуйте другое название или сбросьте поиск и фильтры.';list.append(p);const reset=document.createElement('button');reset.type='button';reset.className='search-reset';reset.textContent='Сбросить поиск и фильтры';reset.addEventListener('click',resetAll);list.append(reset);}
  requestAnimationFrame(()=>{if(typeof sc!=='undefined')sc.layout();if(typeof measure==='function')measure();});
 }
 function open(){host.querySelector('form').hidden=false;toggle.setAttribute('aria-label','Закрыть поиск');host.classList.add('is-open');toggle.setAttribute('aria-expanded','true');panel.hidden=false;render();input.focus();}
 function close(restoreFocus=true){host.querySelector('form').hidden=true;toggle.setAttribute('aria-label','Открыть поиск');host.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');panel.hidden=true;if(restoreFocus)toggle.focus();}
 function resetAll(){input.value='';category='Все кейсы';categoryButtons.forEach(b=>{const active=b.dataset.category===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();if(host.classList.contains('is-open'))input.focus();}
 toggle.addEventListener('click',()=>host.classList.contains('is-open')?close():open());
 clear.addEventListener('click',()=>{input.value='';render();input.focus();});
 input.addEventListener('input',render);
 host.querySelector('form').addEventListener('submit',event=>{event.preventDefault();close(false);if(typeof cancelWheel==='function')cancelWheel();document.getElementById('catalog').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});});
 host.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();}
  if(event.key==='ArrowDown'&&event.target===input){const first=list.querySelector('a');if(first){event.preventDefault();first.focus();}}
  if(event.key==='ArrowUp'&&event.target===list.querySelector('a')){event.preventDefault();input.focus();}
 });
 document.addEventListener('pointerdown',event=>{if(host.classList.contains('is-open')&&!host.contains(event.target))close(false);});
 host.addEventListener('focusout',()=>{queueMicrotask(()=>{if(!host.contains(document.activeElement))close(false);});});
 categoryButtons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;categoryButtons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}));
 empty.querySelector('button').addEventListener('click',resetAll);
 render();
})();
