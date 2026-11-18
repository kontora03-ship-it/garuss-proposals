import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
const bytes=await readFile(new URL('../public/models/tee-studio.glb',import.meta.url));
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meta=JSON.parse(await readFile(new URL('../public/models/tee-studio.json',import.meta.url),'utf8'));
scene.traverse(o=>{
 if(!(o instanceof T.Mesh))return;const name=(o.material as T.Material).name;
 if(!['Print_Front','Print_Back'].includes(name))return;
 const g=o.geometry,p=g.getAttribute('position'),uv=g.getAttribute('uv'),ids=g.index!,m=meta.zones[name==='Print_Front'?'front':'back'];assert.equal(m.mapping,'surface-torso');
 let positive=0,negative=0,projectedPositive=0,projectedNegative=0,maxRatio=0,minScale=Infinity,maxScale=0,triangles=0;
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),edge=new T.Vector3(),other=new T.Vector3();
 for(let j=0;j<ids.count;j+=3){
  const ia=ids.getX(j),ib=ids.getX(j+1),ic=ids.getX(j+2);a.fromBufferAttribute(p,ia);b.fromBufferAttribute(p,ib);c.fromBufferAttribute(p,ic);edge.subVectors(b,a);other.subVectors(c,a);const length=edge.length(),x=other.dot(edge)/length,y=Math.sqrt(Math.max(0,other.lengthSq()-x*x));
  if(y<1e-6)continue;
  const ux=(uv.getX(ib)-uv.getX(ia))*m.width,uy=(uv.getY(ib)-uv.getY(ia))*m.height,vx=(uv.getX(ic)-uv.getX(ia))*m.width,vy=(uv.getY(ic)-uv.getY(ia))*m.height,det=ux*vy-uy*vx;
  assert(Math.abs(det)>1e-12,'No collapsed print triangle on the 3D cloth');if(det>0)positive++;else negative++;
  // The old flat projection reverses orientation as folded cloth turns back on itself.
  const flat=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(flat>1e-12)projectedPositive++;else if(flat< -1e-12)projectedNegative++;
  // UV Jacobian in the intrinsic triangle basis: test actual surface stretch,
  // not the width/height camera projection that hid the 0.8.2 regression.
  const j00=ux/length,j10=uy/length,j01=(vx-j00*x)/y,j11=(vy-j10*x)/y,trace=j00*j00+j10*j10+j01*j01+j11*j11,d=j00*j11-j01*j10,disc=Math.sqrt(Math.max(0,trace*trace-4*d*d)),hi=Math.sqrt((trace+disc)/2),lo=Math.sqrt((trace-disc)/2);
  assert(lo>.75&&hi<1.25,'Every print triangle keeps its actual cloth scale');maxRatio=Math.max(maxRatio,hi/lo);minScale=Math.min(minScale,lo);maxScale=Math.max(maxScale,hi);triangles++;
 }
 assert.equal(Math.min(positive,negative),0,'Consistent signed UV area: no folded-over or repeated print coordinates');assert(Math.min(projectedPositive,projectedNegative)>100,'Regression case must include cloth folds where a flat projection fails');assert(maxRatio<1.3);assert(triangles>50000);
 console.log(`${name}: ${triangles} actual surface triangles, zero UV foldovers; scale ${minScale.toFixed(4)}–${maxScale.toFixed(4)}, max anisotropy ${maxRatio.toFixed(4)}; flat-projection regression exposed PASS`);
});
