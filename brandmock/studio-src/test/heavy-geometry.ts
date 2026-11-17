import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const bytes=await readFile(new URL('../public/models/tee-heavy.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const body=gltf.scene.getObjectByName('Heavy_tee_—_sewn_body_and_sleeves');assert(body);
const vertices=new Map<string,number>(),edges=new Map<string,number>();let inside=0,outside=0;
body.traverse(o=>{
 if(!(o instanceof T.Mesh))return;const g=o.geometry,position=g.getAttribute('position'),uv=g.getAttribute('uv'),mat=o.material as T.Material,index=g.index;assert(index);
 const ids:number[]=[];
 for(let i=0;i<position.count;i++){
  const key=[position.getX(i),position.getY(i),position.getZ(i)].map(n=>Math.round(n*1e6)).join(',');
  let id=vertices.get(key);if(id===undefined){id=vertices.size;vertices.set(key,id)}ids.push(id);
 }
 for(let i=0;i<index.count;i+=3){
  const tri=[ids[index.getX(i)],ids[index.getX(i+1)],ids[index.getX(i+2)]];assert.equal(new Set(tri).size,3,'No collapsed shell triangle');
  for(const[a,b]of [[tri[0],tri[1]],[tri[1],tri[2]],[tri[2],tri[0]]]){const key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1)}
 }
 if(mat.name.startsWith('Fabric_Inside'))inside+=index.count/3;else outside+=index.count/3;
 if(mat.name==='Print_Front'||mat.name==='Print_Back'){
  const n=position.count;let sx=0,sy=0,su=0,sv=0,sxu=0,syv=0;
  for(let i=0;i<n;i++){const x=position.getX(i),y=position.getY(i),u=uv.getX(i),v=uv.getY(i);sx+=x;sy+=y;su+=u;sv+=v;sxu+=x*u;syv+=y*v}
  assert((sxu-sx*su/n)*(mat.name==='Print_Front'?1:-1)>0,'Front/back U must read left to right from its intended view');
  assert(syv-sy*sv/n<0,'Published glTF V must place canvas-top artwork on the upper garment');
 }
});
assert(vertices.size>50000);assert(inside>outside*.9,'Real interior and material returns must be exported');
const open=[...edges.values()].filter(n=>n!==2);assert.equal(open.length,0,'The actual exported body and sleeves must form one closed, welded shell');
const bounds=new T.Box3().setFromObject(body).getSize(new T.Vector3());assert(bounds.z>.30&&bounds.z/bounds.y>.17,'The shirt must have front-to-back volume');
assert(gltf.scene.children.some(o=>o.name.startsWith('Heavy_ribbed')));assert(gltf.scene.children.filter(o=>o.name.startsWith('Twin_needle')).length===6);
console.log('Actual exported Heavy shell: welded closed topology, real interior, volume, readable UV directions, collar and six twin-needle stitch loops PASS');
