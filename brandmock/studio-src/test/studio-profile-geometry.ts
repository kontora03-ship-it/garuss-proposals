import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
const bytes=await readFile(new URL('../public/models/tee-studio.glb',import.meta.url));const{scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=new Map<string,T.BufferGeometry>();scene.traverse(o=>{if(o instanceof T.Mesh)meshes.set((o.material as T.Material).name,o.geometry)});
const quantile=(a:number[],q:number)=>a.sort((x,y)=>x-y)[Math.floor((a.length-1)*q)];
for(const[name,sign]of [['Print_Front',1],['Print_Back',-1]]as const){
 const values=[meshes.get(name)!,meshes.get('Ribbing_Hem')!].flatMap(g=>{const p=g.getAttribute('position');return Array.from({length:p.count},(_,j)=>[p.getX(j),p.getY(j),p.getZ(j)])}).filter(p=>Math.abs(p[0])<.4&&sign*p[2]>.025);
 const lower=values.filter(p=>p[1]>-.86&&p[1]<-.65).map(p=>sign*p[2]);assert(lower.length>500);
 const depth=quantile(lower,.95);assert(depth<.36,'Lower front/back must not retain the 0.8.3 inflated profile');console.log(`${name}: lower torso 95th-percentile depth ${depth.toFixed(5)} < 0.36 PASS`);
}
// The chest is part of a broad human torso, not a localized bulge or a flat sheet.
const front=meshes.get('Print_Front')!.getAttribute('position');
function frontDepth(lo:number,hi:number,xlo=-.18,xhi=.18){const a:number[]=[];for(let j=0;j<front.count;j++)if(front.getY(j)>lo&&front.getY(j)<hi&&front.getX(j)>xlo&&front.getX(j)<xhi)a.push(front.getZ(j));assert(a.length>50);return quantile(a,.9)}
const chest=frontDepth(.25,.40),waist=frontDepth(-.30,-.12),lowerChest=frontDepth(.05,.15),upperChest=frontDepth(.45,.55),left=frontDepth(.25,.40,-.30,-.15),right=frontDepth(.25,.40,.15,.30);
assert(chest-waist>.02&&chest-waist<.065,'Chest-to-waist contour must be visible and gently continuous');assert(waist>.26,'The abdomen must retain torso volume instead of pinching behind an isolated chest bump');assert(Math.abs(chest-lowerChest)<.07&&Math.abs(chest-upperChest)<.09,'Chest volume must extend smoothly into the surrounding torso');assert(chest>=left-.015&&chest>=right-.015,'A broad central chest must not split into two separate lobes');console.log(`Human torso: chest ${chest.toFixed(5)}, abdomen ${waist.toFixed(5)}, continuous profile difference ${(chest-waist).toFixed(5)} PASS`);
// Weld exported material splits by position to identify the actual open lower rim.
const counts=new Map<string,{a:number[];b:number[];count:number}>();
for(const name of ['Print_Front','Print_Back','Ribbing_Hem']){
 const g=meshes.get(name)!,p=g.getAttribute('position'),idx=g.index!;
 for(let j=0;j<idx.count;j+=3)for(const[a,b]of [[idx.getX(j),idx.getX(j+1)],[idx.getX(j+1),idx.getX(j+2)],[idx.getX(j+2),idx.getX(j)]]){
  const av=[p.getX(a),p.getY(a),p.getZ(a)],bv=[p.getX(b),p.getY(b),p.getZ(b)];if(av[1]>-.4||bv[1]>-.4)continue;
  const keys=[av.map(v=>v.toFixed(6)).join(','),bv.map(v=>v.toFixed(6)).join(',')].sort(),key=keys.join('|');const old=counts.get(key);if(old)old.count++;else counts.set(key,{a:av,b:bv,count:1});
 }
}
const rim=[...counts.values()].filter(e=>e.count===1).flatMap(e=>[e.a,e.b]);assert(rim.length>=600,'The garment bottom stays an open hem');const heights=rim.map(p=>p[1]),range=Math.max(...heights)-Math.min(...heights);assert(range<1e-5,'Remove the high side cuts: the entire lower rim must be level');console.log(`Actual lower boundary: ${rim.length/2} edges, height range ${range.toExponential(2)}, no high side opening PASS`);
