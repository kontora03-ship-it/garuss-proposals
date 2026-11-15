export type GarmentOptions={garment_type?:'tshirt'|'polo'|'hoodie'|'sweatshirt';print_zone?:'chest'|'left-chest'|'back'};
const median=(v:number[])=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
/** Follow the torso axis and side seams rather than the sleeve bounding box. */
export function garmentRegion(mask:Uint8Array,w:number,h:number,options:GarmentOptions={}) {
 let x0=w,x1=0,y0=h,y1=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}const height=y1-y0;
 const run=(y:number)=>{let start=-1,best=[0,0];for(let x=0;x<=w;x++){if(x<w&&mask[y*w+x]){if(start<0)start=x}else if(start>=0){if(x-start>best[1]-best[0])best=[start,x-1];start=-1}}return best};
 const centers:number[][]=[];for(let y=Math.round(y0+height*.40);y<=y0+height*.76;y+=Math.max(1,Math.round(height/45))){const r=run(y);if(r[1]-r[0]>height*.18)centers.push([(r[0]+r[1])/2,y])}if(centers.length<4)throw Error('Не удалось отделить торс от рукавов. Укажите область вручную.');
 const slopes:number[]=[];for(let a=0;a<centers.length;a++)for(let b=a+2;b<centers.length;b++)slopes.push((centers[b][0]-centers[a][0])/(centers[b][1]-centers[a][1]));const slope=Math.max(-.65,Math.min(.65,median(slopes))),norm=Math.hypot(slope,1),down=[slope/norm,1/norm],right=[down[1],-down[0]],origin=[median(centers.map(([x,y])=>x-slope*(y-(y0+y1)/2))),(y0+y1)/2];
 const points:number[][]=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(mask[y*w+x])points.push([(x-origin[0])*right[0]+(y-origin[1])*right[1],(x-origin[0])*down[0]+(y-origin[1])*down[1]]);
 let top=Infinity,bottom=-Infinity;for(const [,v]of points){top=Math.min(top,v);bottom=Math.max(bottom,v)}const length=bottom-top;
 const cross=(fraction:number)=>{const target=top+length*fraction,xs=points.filter(([,v])=>Math.abs(v-target)<Math.max(2,length*.018)).map(([u])=>u).sort((a,b)=>a-b);if(xs.length<10)throw Error('Недостаточно видна область груди');return [xs[Math.floor(xs.length*.025)],xs[Math.floor(xs.length*.975)]]};
 const bands=[.45,.55,.65].map(cross),left=Math.max(...bands.map(p=>p[0])),r=Math.min(...bands.map(p=>p[1])),bodyWidth=r-left;if(bodyWidth<length*.22)throw Error('Не найден непрерывный торс. Укажите четыре угла.');
 const zone=options.print_zone||'chest',hood=options.garment_type==='hoodie',polo=options.garment_type==='polo';const start=zone==='back'?.23:hood?.35:polo?.35:.29,finish=zone==='back'?.72:hood?.60:.64;
 let l=left+bodyWidth*.14,rr=r-bodyWidth*.14,ty=top+length*start,by=top+length*finish;
 if(zone==='left-chest'){l=left+bodyWidth*.58;rr=left+bodyWidth*.85;by=ty+Math.min(length*.18,(rr-l)*1.2)}
 // Shrink if the neck, arms or side cut-outs overlap the proposed print rectangle.
 const toPhoto=(u:number,v:number)=>[origin[0]+right[0]*u+down[0]*v,origin[1]+right[1]*u+down[1]*v];let coverage=0;
 for(let attempt=0;attempt<5;attempt++){let inside=0,total=0;for(let iy=0;iy<=12;iy++)for(let ix=0;ix<=12;ix++){const [x,y]=toPhoto(l+(rr-l)*ix/12,ty+(by-ty)*iy/12);total++;if(x>=0&&y>=0&&x<w&&y<h&&mask[Math.floor(y)*w+Math.floor(x)])inside++}coverage=inside/total;if(coverage>.97)break;const dx=(rr-l)*.055,dy=(by-ty)*.04;l+=dx;rr-=dx;ty+=dy;by-=dy}
 if(coverage<.92)throw Error('Область перекрыта или одежда сильно сложена. Укажите четыре угла.');
 return [toPhoto(l,ty),toPhoto(rr,ty),toPhoto(rr,by),toPhoto(l,by)];
}
