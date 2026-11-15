import type {AiRequest,AiResult} from './aiCore';
const median=(a:number[])=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
/** Border-colour segmentation for isolated catalog products. No model download or semantic claims. */
export function fastSurface({width:w,height:h,rgba,point}:AiRequest):AiResult {
 const n=w*h;if(w<20||h<20||n>650000||rgba.length!==n*4)throw Error('Некорректное изображение');
 const mask=new Uint8Array(n),queue=new Uint32Array(n);let transparent=0;for(let i=0;i<n;i++)if(rgba[i*4+3]<32)transparent++;
 if(transparent>n*.1){for(let i=0;i<n;i++)mask[i]=rgba[i*4+3]>96?1:0}
 else {
  const strip=Math.max(2,Math.round(w*.025)),left:number[][]=[],right:number[][]=[];
  for(let y=0;y<h;y++){const a=[[],[],[]] as number[][],b=[[],[],[]] as number[][];for(let x=0;x<strip;x++)for(let c=0;c<3;c++){a[c].push(rgba[(y*w+x)*4+c]);b[c].push(rgba[(y*w+w-1-x)*4+c])}left.push(a.map(median));right.push(b.map(median))}
  const smooth=(rows:number[][])=>rows.map((_,y)=>[0,1,2].map(c=>median(rows.slice(Math.max(0,y-5),Math.min(h,y+6)).map(a=>a[c]))));const l=smooth(left),r=smooth(right);
  const residual:number[]=[];for(let y=0;y<h;y+=3)for(const x of [0,strip-1,w-strip,w-1]){const t=x/(w-1),i=(y*w+x)*4;residual.push(Math.hypot(...[0,1,2].map(c=>rgba[i+c]-(l[y][c]*(1-t)+r[y][c]*t))))}
  residual.sort((a,b)=>a-b);const noise=residual[Math.floor(residual.length*.9)];if(noise>32)throw Error('Сложный фон: быстрый поиск не уверен. Выберите «Уточнить с ИИ» или укажите 4 угла.');const threshold=Math.max(18,noise*1.8+8);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const t=x/(w-1),i=(y*w+x)*4;const distance=Math.hypot(...[0,1,2].map(c=>rgba[i+c]-(l[y][c]*(1-t)+r[y][c]*t)));mask[y*w+x]=distance>threshold?1:0}
 }
 // Largest centered connected component, or the component at an explicit user point.
 const seen=new Uint8Array(n);let best:number[]|undefined,bestScore=-Infinity;const anchor=point?Math.floor(point[1])*w+Math.floor(point[0]):-1;
 if(point&&(!point.every(Number.isFinite)||point[0]<0||point[1]<0||point[0]>=w||point[1]>=h||!mask[anchor]))throw Error('В этой точке контур не выделился. Попробуйте ИИ по точке или ручную область.');
 for(let at=0;at<n;at++){if(!mask[at]||seen[at])continue;let start=0,end=1,sumX=0,sumY=0,touches=0;queue[0]=at;seen[at]=1;const add=(i:number)=>{if(mask[i]&&!seen[i]){seen[i]=1;queue[end++]=i}};let contains=false;
  while(start<end){const i=queue[start++],x=i%w,y=Math.floor(i/w);sumX+=x;sumY+=y;if(i===anchor)contains=true;if(x===0||y===0||x===w-1||y===h-1)touches++;if(x>0)add(i-1);if(x<w-1)add(i+1);if(y>0)add(i-w);if(y<h-1)add(i+w)}
  if(end<n*.015||end>n*.85||touches>Math.max(w,h)*.08||point&&!contains)continue;
  const score=end/(1+3*Math.hypot(sumX/end/w-.5,sumY/end/h-.5));if(score>bestScore){bestScore=score;best=Array.from(queue.subarray(0,end))}
 }
 if(!best)throw Error('Надёжный контур не найден. Для сложного фона выберите ИИ по точке или укажите 4 угла.');
 const selected=new Uint8Array(n);for(const i of best)selected[i]=1;
 // Fill only enclosed gaps in the object silhouette. Open collar and sleeve gaps remain outside.
 seen.fill(0);let start=0,end=0;const addOutside=(i:number)=>{if(!selected[i]&&!seen[i]){seen[i]=1;queue[end++]=i}};
 for(let x=0;x<w;x++){addOutside(x);addOutside((h-1)*w+x)}for(let y=0;y<h;y++){addOutside(y*w);addOutside(y*w+w-1)}
 while(start<end){const i=queue[start++],x=i%w;if(x>0)addOutside(i-1);if(x<w-1)addOutside(i+1);if(i>=w)addOutside(i-w);if(i<w*(h-1))addOutside(i+w)}
 let sx=0,sy=0,count=0;for(let i=0;i<n;i++)if(!seen[i]){selected[i]=1;sx+=i%w;sy+=Math.floor(i/w);count++}
 let seed=point;if(!seed){const cx=sx/count,cy=sy/count;let distance=Infinity,at=best[0];for(const i of best){const d=(i%w-cx)**2+(Math.floor(i/w)-cy)**2;if(d<distance){at=i;distance=d}}seed=[at%w,Math.floor(at/w)]}
 return {width:w,height:h,mask:selected,seed,detectedCup:false,source:'Быстрый анализ контура'};
}
