import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
class PixelData{data:Uint8ClampedArray;width:number;height:number;constructor(a:number|Uint8ClampedArray,b:number,c?:number){if(typeof a==='number'){this.width=a;this.height=b;this.data=new Uint8ClampedArray(a*b*4)}else{this.data=a;this.width=b;this.height=c!}}}
Object.assign(globalThis,{ImageData:PixelData,window:{fetch:fetch,cv:require('../public/opencv.js')},document:{baseURI:'http://localhost/',createElement:()=>({}),head:{appendChild:(s:any)=>queueMicrotask(()=>s.onload())}}});
const {render,defaults}=await import('../src/online');
const photo=new ImageData(200,150);for(let i=0;i<photo.data.length;i+=4)photo.data.set([170,150,120,255],i);
const logo=new ImageData(80,40);for(let y=5;y<35;y++)for(let x=5;x<75;x++)if(!(x>=25&&x<55&&y>=12&&y<28))logo.data.set([240,35,65,255],(y*80+x)*4);
const s={...defaults(200,150),corners:[[20,20],[180,20],[180,130],[20,130]],surface_width:160,surface_height:110,intensity:0};
let count=0;
for(const method of ['print','gold','silver','blind']){const settings={...s,method};const out=await render(photo,logo,settings);const again=await render(photo,logo,settings);assert.deepEqual(out.data,again.data);assert.deepEqual(out.data.slice(0,4),photo.data.slice(0,4));assert.deepEqual(out.data.slice((75*200+100)*4,(75*200+100)*4+4),photo.data.slice((75*200+100)*4,(75*200+100)*4+4));count+=3;}
assert.deepEqual((await render(photo,logo,{...s,opacity:0})).data,photo.data);count++;
await assert.rejects(()=>render(photo,logo,{...s,corners:[[20,20],[180,130],[180,20],[20,130]]}));count++;
await assert.rejects(()=>render(photo,logo,{...s,corners:[[-1,0],[180,20],[180,130],[20,130]]}));count++;
const perspective=await render(photo,logo,{...s,placement_mode:'perspective',perspective_confirmed:true,corners:[[30,10],[170,30],[190,125],[10,140]],rotation:12});assert.notDeepEqual(perspective.data,photo.data);count++;
const transparent=new ImageData(200,150);const out=await render(transparent,logo,{...s,opacity:.5});assert.equal(Math.max(...out.data.filter((_,i)=>i%4===3)),128);count++;
console.log(`${count} geometry, alpha, mask and repeatability assertions passed`);
const {editLogo,defaultLogoEdits,suggestBackground}=await import('../src/logoEditing');
const raster=new ImageData(60,40);for(let i=0;i<raster.data.length;i+=4)raster.data.set([251,251,251,255],i);for(let y=10;y<30;y++)for(let x=10;x<50;x++)raster.data.set([30,40,50,255],(y*60+x)*4);for(let y=15;y<25;y++)for(let x=20;x<40;x++)raster.data.set([251,251,251,255],(y*60+x)*4);
const before=new Uint8ClampedArray(raster.data),key={...defaultLogoEdits,removeBackground:true};const cleaned=editLogo(raster,key);assert.equal(cleaned.data[3],0);assert.equal(cleaned.data[(20*60+30)*4+3],255);assert.equal(cleaned.data[(12*60+12)*4+3],255);assert.deepEqual(raster.data,before);assert.equal(suggestBackground(raster),'#fbfbfb');
const holes=editLogo(raster,{...key,connected:false});assert.equal(holes.data[(20*60+30)*4+3],0);const colored=editLogo(raster,{...key,connected:false,recolor:true,color:'#cc4400'});assert.deepEqual(Array.from(colored.data.slice((12*60+12)*4,(12*60+12)*4+4)),[204,68,0,255]);assert.deepEqual(colored.data,editLogo(raster,{...key,connected:false,recolor:true,color:'#cc4400'}).data);
const transparentLogo=new ImageData(3,3);transparentLogo.data.set([100,120,140,80],16);const recolored=editLogo(transparentLogo,{...defaultLogoEdits,recolor:true,color:'#ff0000'});assert.equal(recolored.data[19],80);assert.equal(recolored.data[3],0);assert.deepEqual(editLogo(raster,defaultLogoEdits).data,before);
const {surfaceMapping}=await import('../src/surfaceMapping');const quad=[[20,30],[180,10],[190,130],[10,140]],map=surfaceMapping(quad)!;for(const [u,v]of [[0,0],[1,0],[1,1],[0,1],[.3,.7]]){const q=map.forward(u,v),back=map.inverse(q[0],q[1])!;assert(Math.abs(back[0]-u)<1e-8&&Math.abs(back[1]-v)<1e-8)}
const {detectSurface}=await import('../src/surfaceDetection');const {loadCv}=await import('../src/online');const cv=await loadCv();const scene=new ImageData(300,240);for(let i=0;i<scene.data.length;i+=4)scene.data.set([240,240,240,255],i);for(let y=40;y<200;y++)for(let x=50;x<250;x++)scene.data.set([60,80,60,255],(y*300+x)*4);const found=detectSurface(scene,cv);assert(found);assert(Math.abs(found.corners[0][0]-50)<5&&Math.abs(found.corners[0][1]-40)<5);assert(Math.abs(found.corners[2][0]-249)<5);const empty=new ImageData(300,240);assert.equal(detectSurface(empty,cv),null);assert.deepEqual(found,detectSurface(scene,cv));console.log('Logo masking, recoloring, source preservation, surface proposal and drag mapping tests passed');
const {logoGeometry,usesPerspective}=await import('../src/placementGeometry');
const skewed={...s,corners:[[30,15],[165,40],[190,130],[10,125]],rotation:31,placement_mode:'safe' as const};
const safeGeometry=logoGeometry(80,40,skewed),af=safeGeometry.affine!;assert(af);assert(Math.abs(af[0]*af[1]+af[3]*af[4])<1e-10);assert(Math.abs(Math.hypot(af[0],af[3])-Math.hypot(af[1],af[4]))<1e-10);
const safePixels=await render(photo,logo,skewed);assert.deepEqual(safePixels.data,(await render(photo,logo,{...skewed,surface_width:15,surface_height:900})).data);
const pending={...skewed,placement_mode:'perspective' as const,perspective_confirmed:false};assert(!usesPerspective(pending));assert.deepEqual(safePixels.data,(await render(photo,logo,pending)).data);
const explicit={...pending,perspective_confirmed:true};assert(usesPerspective(explicit));assert(!logoGeometry(80,40,explicit).affine);assert.notDeepEqual(safePixels.data,(await render(photo,logo,explicit)).data);
const clipping={...s,placement_mode:'safe' as const,rotation:45,x:0,y:0,scale:1};const outside=await render(photo,logo,clipping);assert(outside.data.some((v,i)=>i%4===0&&i/4%200<20&&v!==photo.data[i]));
assert.deepEqual((await render(photo,logo,{...skewed,placement_mode:undefined})).data,safePixels.data);
const mm=surfaceMapping(explicit.corners)!;const inverseCorners=logoGeometry(80,40,explicit).corners.map(([x,y])=>mm.inverse(x,y)!);const [p0,p1,p3]=[inverseCorners[0],inverseCorners[1],inverseCorners[3]];const edgeLength=(p:number[],q:number[])=>Math.hypot((p[0]-q[0])*explicit.surface_width,(p[1]-q[1])*explicit.surface_height);assert(Math.abs(edgeLength(p0,p1)/edgeLength(p0,p3)-2)<1e-8);
console.log('Safe similarity transform, aspect independence, explicit perspective gate, legacy defaults and non-clipping checks passed');

assert.deepEqual(safePixels.data,(await render(photo,logo,{...skewed,surface_width:0,surface_height:NaN})).data);await assert.rejects(()=>render(photo,logo,{...explicit,surface_width:0}));
