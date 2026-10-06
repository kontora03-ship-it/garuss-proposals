(()=>{
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 if(preference.matches||!('IntersectionObserver' in window))return;
 const animations=new Set();
 function start(){
  const observer=new IntersectionObserver(entries=>{
   let order=0;
   entries.forEach(entry=>{
    if(!entry.isIntersecting||entry.target.hidden)return;
    observer.unobserve(entry.target);
    if(preference.matches)return;
    const animation=entry.target.animate([{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,delay:order++*85,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'});
    animations.add(animation);animation.onfinish=()=>animations.delete(animation);
   });
  },{threshold:.08});
  document.querySelectorAll('.presentation-card,.case-intro,.viewer,.case-bottom').forEach(el=>observer.observe(el));
  preference.addEventListener('change',()=>{if(preference.matches){animations.forEach(a=>a.cancel());animations.clear();observer.disconnect();}});
 }
 if(document.documentElement.classList.contains('intro-pending')){
  const watcher=new MutationObserver(()=>{if(!document.documentElement.classList.contains('intro-pending')){watcher.disconnect();start();}});
  watcher.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 }else start();
})();
