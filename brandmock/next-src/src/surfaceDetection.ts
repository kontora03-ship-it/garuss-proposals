import {lineSurfaces} from './lineSurfaces';
import {orderFace,faceArea} from './faceGeometry';
import {analyzePlane} from './planeAnalysis';
export type SurfaceSuggestion={corners:number[][];width:number;height:number}|null;
type Candidate=NonNullable<SurfaceSuggestion>&{score:number};
/** Multi-pass edge geometry; no semantic or AI confidence claim. */
export function detectSurfaces(photo:ImageData,cv:any):NonNullable<SurfaceSuggestion>[] {
 const mats:any[]=[],own=(m:any)=>{mats.push(m);return m};
 try {
  const src=own(cv.matFromImageData(photo)),small=own(new cv.Mat()),gray=own(new cv.Mat());
  const scale=Math.min(1,900/Math.max(photo.width,photo.height)),w=Math.round(photo.width*scale),h=Math.round(photo.height*scale);
  cv.resize(src,small,new cv.Size(w,h),0,0,cv.INTER_AREA);cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);
  const smooth=own(new cv.Mat()),fine=own(new cv.Mat()),background=own(new cv.Mat()),contrast=own(new cv.Mat());
  cv.GaussianBlur(gray,smooth,new cv.Size(5,5),0);cv.GaussianBlur(gray,fine,new cv.Size(3,3),0);
  cv.GaussianBlur(gray,background,new cv.Size(31,31),0);cv.addWeighted(gray,3,background,-2,0,contrast);cv.GaussianBlur(contrast,contrast,new cv.Size(3,3),0);
  const pool:Candidate[]=[];
  for(const [image,low,high] of [[smooth,35,100],[fine,10,35],[contrast,8,28]] as const){
   const edges=own(new cv.Mat());cv.Canny(image,edges,low,high);
   // Long internal seams are considered even when a closed outer silhouette exists.
   pool.push(...lineSurfaces(edges,cv,scale));
   if(image===contrast)continue;
   const closed=own(new cv.Mat()),hierarchy=own(new cv.Mat()),contours=own(new cv.MatVector()),kernel=own(cv.Mat.ones(3,3,cv.CV_8U));
   cv.morphologyEx(edges,closed,cv.MORPH_CLOSE,kernel);cv.findContours(closed,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
   for(let i=0;i<contours.size();i++){const contour=contours.get(i),approx=new cv.Mat();try{const area=Math.abs(cv.contourArea(contour));if(area<w*h*.035||area>w*h*.88)continue;for(const epsilon of [.015,.025,.04]){cv.approxPolyDP(contour,approx,epsilon*cv.arcLength(contour,true),true);if(approx.rows!==4||!cv.isContourConvex(approx))continue;const p:number[][]=[];for(let k=0;k<8;k+=2)p.push([approx.data32S[k]/scale,approx.data32S[k+1]/scale]);pool.push({corners:p,width:1,height:1,score:area})}}finally{contour.delete();approx.delete()}}
  }
  const gx=own(new cv.Mat()),gy=own(new cv.Mat());cv.Sobel(fine,gx,cv.CV_32F,1,0);cv.Sobel(fine,gy,cv.CV_32F,0,1);
  const border:number[]=[];for(let x=0;x<w;x+=Math.max(1,Math.floor(w/64))){border.push(gray.data[x],gray.data[(h-1)*w+x])}for(let y=0;y<h;y+=Math.max(1,Math.floor(h/64))){border.push(gray.data[y*w],gray.data[y*w+w-1])}border.sort((a,b)=>a-b);const bg=border[Math.floor(border.length/2)],uniformBorder=border.filter(v=>Math.abs(v-bg)<18).length/border.length>.9;
  const supported:Candidate[]=[];
  for(const candidate of pool){let q:number[][];try{q=orderFace(candidate.corners.map(p=>p.map(v=>v*scale)))}catch{continue}
   if(q.some(([x,y])=>x<3||y<3||x>w-4||y>h-4))continue;const area=faceArea(q);if(area<w*h*.035||area>w*h*.88)continue;
   const lengths=q.map((p,i)=>Math.hypot(p[0]-q[(i+1)%4][0],p[1]-q[(i+1)%4][1]));if(Math.min(...lengths)<Math.min(w,h)*.08)continue;
   // Strongest gradient across each proposed edge must point across that edge.
   // Texture noise alone must not count as a supported straight boundary.
   const coverage=q.map((a,i)=>{const b=q[(i+1)%4],length=lengths[i],ux=(b[0]-a[0])/length,uy=(b[1]-a[1])/length,steps=Math.max(24,Math.ceil(length/2));let hits=0;for(let k=1;k<steps;k++){const x=a[0]+(b[0]-a[0])*k/steps,y=a[1]+(b[1]-a[1])*k/steps;let best=0,vx=0,vy=0;for(let offset=-3;offset<=3;offset++){const xx=Math.round(x-uy*offset),yy=Math.round(y+ux*offset);if(xx<0||yy<0||xx>=w||yy>=h)continue;const dx=gx.data32F[yy*w+xx],dy=gy.data32F[yy*w+xx],m=dx*dx+dy*dy;if(m>best){best=m;vx=dx;vy=dy}}if(best>36&&Math.abs(vx*ux+vy*uy)/Math.sqrt(best)<.38)hits++}return hits/(steps-1)});
   if(uniformBorder){let foreground=0,different=0;const samples:number[][]=[];for(let i=0;i<24;i++){const t=.06+i*.88/23;samples.push([t,.06],[t,.94],[.06,t],[.94,t])}for(const [u,v] of samples){const x=(1-v)*((1-u)*q[0][0]+u*q[1][0])+v*((1-u)*q[3][0]+u*q[2][0]),y=(1-v)*((1-u)*q[0][1]+u*q[1][1])+v*((1-u)*q[3][1]+u*q[2][1]);const delta=Math.abs(gray.data[Math.round(y)*w+Math.round(x)]-bg);if(delta>25)foreground++;different+=delta}if(different/samples.length>50&&foreground/samples.length<.90)continue}

   const evidence=coverage.reduce((a,v)=>a+v,0)/4;if(Math.min(...coverage)<.55||evidence<.72)continue;
   const center=q.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]),corners=q.map(p=>p.map(v=>v/scale));
   const score=area*evidence*evidence*(1-.35*Math.hypot(center[0]/w-.5,center[1]/h-.5))*(analyzePlane(corners,photo.width,photo.height).perspective?1.15:1);
   supported.push({corners,width:Math.round((lengths[0]+lengths[2])/2/scale),height:Math.round((lengths[1]+lengths[3])/2/scale),score});
  }
  const unique:Candidate[]=[];for(const c of supported.sort((a,b)=>b.score-a.score)){if(!unique.some(v=>v.corners.reduce((sum,p,i)=>sum+Math.hypot(p[0]-c.corners[i][0],p[1]-c.corners[i][1]),0)/4<Math.hypot(photo.width,photo.height)*.025))unique.push(c)}
  const inside=(q:number[][],p:number[][])=>q.every(v=>p.every((a,i)=>{const b=p[(i+1)%4];return (b[0]-a[0])*(v[1]-a[1])-(b[1]-a[1])*(v[0]-a[0])>=-Math.hypot(b[0]-a[0],b[1]-a[1])*4}));
  const score=(c:Candidate)=>c.score*(unique.filter(v=>v!==c&&faceArea(v.corners)<faceArea(c.corners)*.85&&faceArea(v.corners)>faceArea(c.corners)*.20&&inside(v.corners,c.corners)).length>=2?.45:1);
  return unique.sort((a,b)=>score(b)-score(a)).slice(0,5).map(({score:_,...surface})=>surface);
 } finally {mats.reverse().forEach(m=>m.delete())}
}
export function detectSurface(photo:ImageData,cv:any):SurfaceSuggestion{return detectSurfaces(photo,cv)[0]||null}
