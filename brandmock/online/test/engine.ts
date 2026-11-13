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
const perspective=await render(photo,logo,{...s,corners:[[30,10],[170,30],[190,125],[10,140]],rotation:12});assert.notDeepEqual(perspective.data,photo.data);count++;
const transparent=new ImageData(200,150);const out=await render(transparent,logo,{...s,opacity:.5});assert.equal(Math.max(...out.data.filter((_,i)=>i%4===3)),128);count++;
console.log(`${count} geometry, alpha, mask and repeatability assertions passed`);
