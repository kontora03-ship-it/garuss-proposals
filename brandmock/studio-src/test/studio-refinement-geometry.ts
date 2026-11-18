import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const parse=async(path:string)=>{const b=await readFile(new URL(path,import.meta.url));return(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene};
const [before,after]=await Promise.all([parse('../sources/vendor/tee-studio-v06.glb'),parse('../public/models/tee-studio.glb')]);
const meta=JSON.parse(await readFile(new URL('../public/models/tee-studio.json',import.meta.url),'utf8')),originalMeta=JSON.parse(await readFile(new URL('../sources/vendor/tee-studio-v06.json',import.meta.url),'utf8'));
assert.deepEqual(meta.zones,originalMeta.zones);assert.deepEqual(meta.fitScale,originalMeta.fitScale);
const surfaces=(root:T.Object3D)=>{const out=new Map<string,T.Mesh>();root.traverse(o=>{if(o instanceof T.Mesh){const name=(o.material as T.Material).name;if(name.startsWith('Print_')||name.startsWith('Ribbing_Hem'))out.set(name,o)}});return out};
const old=surfaces(before),current=surfaces(after);let fixedFront=0,fixedSleeves=0,softenedBack=0,backMax=0;const lift=meta.refinement?.shoulderLift?.amount||0;
for(const[name,mesh]of current){
 const baseline=old.get(name);assert(baseline);const g=mesh.geometry,b=baseline.geometry;assert.equal(g.index?.count,b.index?.count,'Retain every original printed/hem triangle');
 const uv=b.getAttribute('uv'),atlas=b.getAttribute('uv1'),pos=b.getAttribute('position'),map=new Map<string,number[]>();
 const key=(u:number,v:number)=>Math.round(u*1e5)+','+Math.round(v*1e5);
 for(let i=0;i<uv.count;i++){const k=key(uv.getX(i),uv.getY(i));map.set(k,[...(map.get(k)||[]),i])}
 const nu=g.getAttribute('uv'),na=g.getAttribute('uv1'),np=g.getAttribute('position');assert(na);
 for(let i=0;i<nu.count;i++){
  const candidates=map.get(key(nu.getX(i),nu.getY(i)));assert(candidates,'Every exported print UV still has its source sample');
  const j=candidates.reduce((best,j)=>Math.abs(uv.getX(j)-nu.getX(i))+Math.abs(uv.getY(j)-nu.getY(i))<Math.abs(uv.getX(best)-nu.getX(i))+Math.abs(uv.getY(best)-nu.getY(i))?j:best,candidates[0]);
  assert(Math.abs(na.getX(i)-atlas.getX(j))<2e-7&&Math.abs(na.getY(i)-atlas.getY(j))<2e-7,'Native artist atlas retained');
  const dx=Math.abs(np.getX(i)-pos.getX(j)),dy=Math.abs(np.getY(i)-pos.getY(j)),dz=Math.abs(np.getZ(i)-pos.getZ(j));
  const outsideShoulder=!lift||pos.getY(j)<.38||Math.abs(pos.getX(j))<.27||Math.abs(pos.getX(j))>.93;
  if(name.startsWith('Ribbing_Hem')||(name.includes('Sleeve')&&outsideShoulder)){assert(Math.max(dx,dy,dz)<2e-6,'Approved cuffs, hems and lower sleeves remain unchanged');fixedSleeves++}
  else if(name.includes('Sleeve')){assert(dx<2e-6&&dz<2e-6&&dy<=lift+2e-6,'Only the upper sleeve height may change');assert(np.getY(i)>=pos.getY(j)-2e-6,'Upper sleeves lift rather than sag')}
  else if(pos.getY(j)<.58||Math.abs(pos.getX(j))>.46){
   if(name==='Print_Front'){
    if(outsideShoulder){assert(Math.max(dx,dy,dz)<2e-6,'Front outside the neck/shoulder regions remains unchanged');fixedFront++}
    else assert(dx<2e-6&&dz<2e-6&&dy<=lift+2e-6,'Front shoulder change is a restrained height adjustment');
   }
   else{assert(dx<2e-6&&dy<=(outsideShoulder?2e-6:lift+2e-6),'Back fold smoothing preserves width and lower-back height');assert(dz<=.015002,'Back adjustment stays restrained');if(dz>1e-6)softenedBack++;backMax=Math.max(backMax,dz)}
  }
 }
}
assert(fixedFront>10000&&fixedSleeves>6000&&softenedBack>10000);assert(backMax>1e-4&&backMax<.015);
let collar:T.Mesh|undefined;after.traverse(o=>{if(o instanceof T.Mesh&&(o.material as T.Material).name.startsWith('Ribbing_Collar'))collar=o});assert(collar);const bounds=new T.Box3().setFromObject(collar!);assert(bounds.getSize(new T.Vector3()).x<.57,'Wider crew band stays local to the neck');
console.log(`Studio refinement: ${fixedFront} front samples away from edits fixed, ${fixedSleeves} lower-sleeve/cuff/hem samples fixed; ${softenedBack} back samples subtly smoothed, max ${backMax.toFixed(6)}; original print UVs and atlas retained PASS`);
